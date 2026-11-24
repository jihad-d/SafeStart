-- SafeStart : badges attribués automatiquement à partir des vraies transactions
-- À exécuter une fois dans Supabase > SQL Editor.
--
-- • Chaque badge a un code stable (badges.code) relié à une règle calculée côté serveur.
-- • award_badges() vérifie les règles, débloque les badges manquants et crédite leurs points,
--   une seule fois par badge et par utilisateur.

-- ─────────────────────────────────────────────────────────────
-- 0. Vérification de la structure de user_badges
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'user_badges' and column_name = 'user_id')
  or not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'user_badges' and column_name = 'badge_id') then
    raise exception 'user_badges doit avoir les colonnes user_id et badge_id : envoie sa structure pour adapter la migration';
  end if;
end $$;

alter table public.user_badges add column if not exists earned_at timestamptz default now();
create unique index if not exists user_badges_user_badge_unique on public.user_badges (user_id, badge_id);

-- ─────────────────────────────────────────────────────────────
-- 1. Catalogue : code stable pour chaque badge
-- ─────────────────────────────────────────────────────────────
alter table public.badges add column if not exists code text;
create unique index if not exists badges_code_unique on public.badges (code);

update public.badges set code = 'first_transaction' where name = 'Première transaction' and code is null;
update public.badges set code = 'first_buy'         where name = 'Premier achat'        and code is null;
update public.badges set code = 'first_send'        where name = 'Premier envoi'        and code is null;
update public.badges set code = 'careful_trader'    where name = 'Trader prudent'       and code is null;
update public.badges set code = 'regular',
                         description = 'Des simulations sur 7 jours différents.'
                   where name = 'Régulier' and code is null;

-- Badges des challenges (ajoutés s'ils n'existent pas encore)
insert into public.badges (name, icon, description, points_reward, category, code)
select v.name, '', v.description, v.points, v.category, v.code
  from (values
    ('Acheteur prudent',        'Achat de BTC avec un score de sécurité d''au moins 70/100.', 100, 'sécurité',      'careful_btc_buyer'),
    ('Envoi sécurisé',          'Envoi avec un score de sécurité d''au moins 70/100.',        100, 'sécurité',      'secure_send'),
    ('Portefeuille diversifié', 'Au moins 3 cryptos différentes détenues en même temps.',     150, 'intermédiaire', 'diversified'),
    ('Swap intelligent',        'Swap avec un slippage inférieur à 1 %.',                     150, 'intermédiaire', 'smart_swap'),
    ('Explorateur DeFi',        '5 swaps entre des paires de cryptos différentes.',           250, 'avancé',        'defi_explorer')
  ) as v(name, description, points, category, code)
 where not exists (select 1 from public.badges b where b.code = v.code);

-- ─────────────────────────────────────────────────────────────
-- 2. Attribution
-- ─────────────────────────────────────────────────────────────
create or replace function public.award_badges()
returns table (badge_code text, badge_name text, points int, new_total_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_earned text[] := '{}';
  v_points int := 0;
  v_total  int;
  r        record;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

  -- Règles (mêmes critères que les challenges affichés dans l'application)
  select array_remove(array[
    case when count(*) >= 1                                                         then 'first_transaction' end,
    case when count(*) filter (where type = 'buy') >= 1                             then 'first_buy' end,
    case when count(*) filter (where type = 'send') >= 1                            then 'first_send' end,
    case when count(*) filter (where security_score_label = 'safe') >= 5            then 'careful_trader' end,
    case when count(distinct (created_at at time zone 'Europe/Paris')::date) >= 7   then 'regular' end,
    case when count(*) filter (where type = 'buy' and crypto_symbol = 'BTC' and security_score >= 70) >= 1 then 'careful_btc_buyer' end,
    case when count(*) filter (where type = 'send' and security_score >= 70) >= 1  then 'secure_send' end,
    case when count(*) filter (where type = 'swap' and slippage_percentage < 1) >= 1 then 'smart_swap' end,
    case when count(distinct (from_crypto_symbol || '>' || to_crypto_symbol)) filter (where type = 'swap') >= 5 then 'defi_explorer' end
  ], null)
    into v_earned
    from public.transactions
   where user_id = v_uid;

  if (select count(*) from public.portfolio_assets where user_id = v_uid and quantity > 0) >= 3 then
    v_earned := v_earned || 'diversified';
  end if;

  -- Débloque les badges manquants (une seule fois grâce à l'index unique)
  for r in
    insert into public.user_badges (user_id, badge_id, earned_at)
    select v_uid, b.id, now()
      from public.badges b
     where b.code = any (v_earned)
    on conflict (user_id, badge_id) do nothing
    returning badge_id
  loop
    select b.code, b.name, coalesce(b.points_reward, 0)
      into badge_code, badge_name, points
      from public.badges b where b.id = r.badge_id;
    v_points := v_points + points;
    return next;
  end loop;

  -- Crédite les points gagnés
  update public.profiles p
     set total_points = p.total_points + v_points
   where p.id = v_uid
  returning p.total_points into v_total;

  new_total_points := v_total;
  -- Ligne de synthèse (badge_code null) : toujours renvoyée, avec le total à jour
  badge_code := null; badge_name := null; points := v_points;
  return next;
end;
$$;

revoke all on function public.award_badges() from public, anon;
grant execute on function public.award_badges() to authenticated;
