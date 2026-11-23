-- SafeStart : points fixés côté serveur + vraie réinitialisation du portfolio
-- À exécuter une fois dans Supabase > SQL Editor (après 20261123_simulated_transactions.sql).

-- ─────────────────────────────────────────────────────────────
-- 1. Les points ne sont plus un paramètre envoyé par le navigateur
-- ─────────────────────────────────────────────────────────────
drop function if exists public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text, int
);

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
security invoker            -- les policies RLS de l'utilisateur s'appliquent
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cost    numeric := coalesce(p_amount_eur, 0) + coalesce(p_fees_eur, 0);
  v_balance numeric;
  c_points  constant int := 10;   -- points fixés côté serveur, non modifiables par le client
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;
  if p_type not in ('buy', 'send', 'swap') then
    raise exception 'Type de transaction invalide' using errcode = '22023';
  end if;
  if coalesce(p_amount_eur, 0) <= 0 then
    raise exception 'Montant invalide' using errcode = '22023';
  end if;

  -- Verrouille la ligne profil pour éviter deux débits concurrents
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
    p_to_address, p_gas_fee_eur, p_from_crypto_symbol, p_to_crypto_symbol,
    p_slippage_percentage, p_security_score, p_security_score_label, p_ai_comment
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

grant execute on function public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text
) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Réinitialisation : solde à 1 000 € + portfolio vidé
--    (historique, points et badges conservés)
-- ─────────────────────────────────────────────────────────────
create or replace function public.reset_simulation()
returns numeric
language plpgsql
security definer          -- ne touche que les lignes de l'utilisateur connecté (auth.uid())
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

  delete from public.portfolio_assets where user_id = v_uid;

  update public.profiles p
     set simulated_balance_eur = 1000
   where p.id = v_uid
  returning p.simulated_balance_eur into v_balance;

  return v_balance;
end;
$$;

revoke all on function public.reset_simulation() from public, anon;
grant execute on function public.reset_simulation() to authenticated;
