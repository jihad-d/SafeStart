-- SafeStart : verrouillage des données (RLS + droits)
-- À exécuter une fois dans Supabase > SQL Editor, APRÈS les migrations précédentes.
--
-- Principe :
--  • chaque utilisateur ne peut LIRE que ses propres lignes ;
--  • le navigateur ne peut plus ÉCRIRE directement dans transactions / portfolio / badges :
--    tout passe par les fonctions SQL (record_simulated_transaction, reset_simulation,
--    delete_my_account) ;
--  • dans profiles, le navigateur ne peut modifier que pseudo / niveau / onboarding :
--    solde, points, Premium et quotas sont protégés par un trigger.

-- ─────────────────────────────────────────────────────────────
-- 1. RLS activée partout
-- ─────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.transactions     enable row level security;
alter table public.portfolio_assets enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 2. Droits : lecture seule pour transactions / portfolio,
--    aucun accès pour les visiteurs non connectés (anon)
-- ─────────────────────────────────────────────────────────────
revoke all on public.profiles, public.transactions, public.portfolio_assets from anon;
revoke insert, update, delete on public.transactions, public.portfolio_assets from authenticated;
grant select on public.transactions, public.portfolio_assets to authenticated;
grant select, insert, update on public.profiles to authenticated;
revoke delete on public.profiles from authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Politiques : chacun ne voit que ses lignes
-- ─────────────────────────────────────────────────────────────
drop policy if exists "safestart_profiles_select_own" on public.profiles;
create policy "safestart_profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "safestart_profiles_insert_own" on public.profiles;
create policy "safestart_profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "safestart_profiles_update_own" on public.profiles;
create policy "safestart_profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "safestart_transactions_select_own" on public.transactions;
create policy "safestart_transactions_select_own" on public.transactions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "safestart_portfolio_select_own" on public.portfolio_assets;
create policy "safestart_portfolio_select_own" on public.portfolio_assets
  for select to authenticated using (user_id = auth.uid());

-- Badges (si la table existe)
do $$
begin
  if to_regclass('public.user_badges') is not null then
    execute 'alter table public.user_badges enable row level security';
    execute 'revoke all on public.user_badges from anon';
    execute 'revoke insert, update, delete on public.user_badges from authenticated';
    execute 'grant select on public.user_badges to authenticated';
    execute 'drop policy if exists "safestart_badges_select_own" on public.user_badges';
    execute 'create policy "safestart_badges_select_own" on public.user_badges
               for select to authenticated using (user_id = auth.uid())';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Colonnes protégées du profil
--    Depuis le navigateur (rôle authenticated) : valeurs imposées à la création,
--    inchangeables ensuite. Les fonctions SQL « security definer » (qui s'exécutent
--    avec un autre rôle) restent libres de les modifier.
-- ─────────────────────────────────────────────────────────────
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.simulated_balance_eur := 1000;
      new.total_points          := 0;
      new.is_premium            := false;
      new.ai_messages_today     := 0;
      new.ai_messages_limit     := 20;
    else
      new.id                    := old.id;
      new.email                 := old.email;
      new.simulated_balance_eur := old.simulated_balance_eur;
      new.total_points          := old.total_points;
      new.is_premium            := old.is_premium;
      new.ai_messages_today     := old.ai_messages_today;
      new.ai_messages_limit     := old.ai_messages_limit;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ─────────────────────────────────────────────────────────────
-- 5. La fonction de transaction passe en « security definer »
--    (elle doit pouvoir écrire solde, points, historique et portfolio,
--    que le navigateur ne peut plus modifier lui-même).
--    Elle ne touche que les lignes de auth.uid().
-- ─────────────────────────────────────────────────────────────
create or replace function public.record_simulated_transaction(
  p_type                 text,
  p_crypto_id            text,
  p_crypto_name          text,
  p_crypto_symbol        text,
  p_crypto_image         text,
  p_price_eur            numeric,
  p_amount_eur           numeric,
  p_quantity             numeric,
  p_fees_eur             numeric,
  p_to_address           text,
  p_gas_fee_eur          numeric,
  p_from_crypto_symbol   text,
  p_to_crypto_symbol     text,
  p_slippage_percentage  numeric,
  p_security_score       int,
  p_security_score_label text,
  p_ai_comment           text
)
returns table (new_balance numeric, new_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cost    numeric := coalesce(p_amount_eur, 0) + coalesce(p_fees_eur, 0);
  v_balance numeric;
  c_points  constant int := 10;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;
  if p_type not in ('buy', 'send', 'swap') then
    raise exception 'Type de transaction invalide' using errcode = '22023';
  end if;
  if coalesce(p_amount_eur, 0) <= 0 or coalesce(p_price_eur, 0) <= 0 or coalesce(p_quantity, 0) <= 0 then
    raise exception 'Montant invalide' using errcode = '22023';
  end if;
  if p_security_score not between 0 and 100
     or p_security_score_label not in ('safe', 'warning', 'danger') then
    raise exception 'Score invalide' using errcode = '22023';
  end if;
  -- La quantité doit correspondre au montant et au prix (tolérance 1 %)
  if abs(p_quantity * p_price_eur - p_amount_eur) > p_amount_eur * 0.01 then
    raise exception 'Quantité incohérente' using errcode = '22023';
  end if;

  select p.simulated_balance_eur into v_balance
    from public.profiles p where p.id = v_uid for update;

  if v_balance is null or v_balance < v_cost then
    raise exception 'Solde insuffisant' using errcode = 'P0001';
  end if;

  insert into public.transactions (
    user_id, type, crypto_name, crypto_symbol, amount_eur, quantity, fees_eur,
    to_address, gas_fee_eur, from_crypto_symbol, to_crypto_symbol,
    slippage_percentage, security_score, security_score_label, ai_comment
  ) values (
    v_uid, p_type, p_crypto_name, p_crypto_symbol, p_amount_eur, p_quantity, p_fees_eur,
    left(p_to_address, 120), p_gas_fee_eur, p_from_crypto_symbol, p_to_crypto_symbol,
    p_slippage_percentage, p_security_score, p_security_score_label, left(p_ai_comment, 300)
  );

  if p_type = 'buy' then
    insert into public.portfolio_assets as a (
      user_id, crypto_id, crypto_symbol, crypto_name, crypto_image,
      quantity, avg_buy_price, current_price
    ) values (
      v_uid, p_crypto_id, p_crypto_symbol, p_crypto_name, p_crypto_image,
      p_quantity, p_price_eur, p_price_eur
    )
    on conflict (user_id, crypto_id) do update
      set avg_buy_price = ((a.quantity * a.avg_buy_price) + (excluded.quantity * excluded.avg_buy_price))
                          / nullif(a.quantity + excluded.quantity, 0),
          quantity      = a.quantity + excluded.quantity,
          current_price = excluded.current_price;
  end if;

  return query
  update public.profiles p
     set simulated_balance_eur = p.simulated_balance_eur - v_cost,
         total_points          = p.total_points + c_points
   where p.id = v_uid
  returning p.simulated_balance_eur::numeric, p.total_points;
end;
$$;

revoke all on function public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text
) from public, anon;
grant execute on function public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text
) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Vérification : liste des politiques en place
--    (s'il reste d'anciennes politiques plus larges, par ex. « select using (true) »,
--     elles s'ajoutent aux nouvelles : à supprimer)
-- ─────────────────────────────────────────────────────────────
select tablename, policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public'
 order by tablename, policyname;
