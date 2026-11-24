-- SafeStart : les envois et les swaps modifient enfin le portfolio
-- À exécuter une fois dans Supabase > SQL Editor.
--
-- Achat  : euros → crypto.   Solde -= montant + frais ; crypto += quantité.
-- Envoi  : crypto → adresse. Crypto -= quantité ;       solde -= frais de gas.
-- Swap   : crypto A → B.     A -= quantité ;            B += montant × (1 − slippage) / prix de B.
--          Le prix de revient de A est transféré à B (le P&L reste cohérent).

drop function if exists public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text
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
  p_ai_comment           text,
  p_to_crypto_id         text    default null,
  p_to_crypto_name       text    default null,
  p_to_crypto_image      text    default null,
  p_to_price_eur         numeric default null
)
returns table (new_balance numeric, new_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_balance    numeric;
  v_eur_cost   numeric;
  v_quantity   numeric := p_quantity;
  v_held       numeric;
  v_avg        numeric;
  v_cost_basis numeric;
  v_to_qty     numeric;
  c_points     constant int := 10;
begin
  -- ── Contrôles communs ──
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;
  if p_type not in ('buy', 'send', 'swap') then
    raise exception 'Type de transaction invalide' using errcode = '22023';
  end if;
  if coalesce(p_amount_eur, 0) <= 0 or coalesce(p_price_eur, 0) <= 0 or coalesce(v_quantity, 0) <= 0 then
    raise exception 'Montant invalide' using errcode = '22023';
  end if;
  if p_security_score not between 0 and 100
     or p_security_score_label not in ('safe', 'warning', 'danger') then
    raise exception 'Score invalide' using errcode = '22023';
  end if;
  if abs(v_quantity * p_price_eur - p_amount_eur) > p_amount_eur * 0.01 then
    raise exception 'Quantité incohérente' using errcode = '22023';
  end if;

  -- Coût en euros selon le type
  v_eur_cost := case p_type
    when 'buy'  then p_amount_eur + coalesce(p_fees_eur, 0)
    when 'send' then coalesce(p_gas_fee_eur, 0)
    else 0
  end;
  if v_eur_cost < 0 or coalesce(p_fees_eur, 0) > p_amount_eur or coalesce(p_gas_fee_eur, 0) > 50 then
    raise exception 'Frais invalides' using errcode = '22023';
  end if;

  select p.simulated_balance_eur into v_balance
    from public.profiles p where p.id = v_uid for update;
  if v_balance is null or v_balance < v_eur_cost then
    raise exception 'Solde insuffisant' using errcode = 'P0001';
  end if;

  -- ── Envoi / swap : il faut détenir la crypto ──
  if p_type in ('send', 'swap') then
    select a.quantity, a.avg_buy_price into v_held, v_avg
      from public.portfolio_assets a
     where a.user_id = v_uid and a.crypto_id = p_crypto_id
     for update;

    -- Tolérance d'arrondi (bouton « Max ») : 0,0001 %
    if v_held is not null and v_quantity > v_held and v_quantity - v_held <= v_held * 0.000001 then
      v_quantity := v_held;
    end if;
    if v_held is null or v_quantity > v_held then
      raise exception 'Quantité insuffisante' using errcode = 'P0001';
    end if;

    v_cost_basis := v_quantity * v_avg;

    if v_held - v_quantity <= 0.000000000001 then
      delete from public.portfolio_assets where user_id = v_uid and crypto_id = p_crypto_id;
    else
      update public.portfolio_assets
         set quantity = quantity - v_quantity
       where user_id = v_uid and crypto_id = p_crypto_id;
    end if;
  end if;

  -- ── Swap : crypto de destination ──
  if p_type = 'swap' then
    if p_to_crypto_id is null or p_to_crypto_id = p_crypto_id or coalesce(p_to_price_eur, 0) <= 0
       or coalesce(p_slippage_percentage, -1) not between 0 and 50 then
      raise exception 'Swap invalide' using errcode = '22023';
    end if;

    v_to_qty := p_amount_eur * (1 - p_slippage_percentage / 100) / p_to_price_eur;

    insert into public.portfolio_assets as a (
      user_id, crypto_id, crypto_symbol, crypto_name, crypto_image,
      quantity, avg_buy_price, current_price
    ) values (
      v_uid, p_to_crypto_id, p_to_crypto_symbol, coalesce(p_to_crypto_name, p_to_crypto_symbol), coalesce(p_to_crypto_image, ''),
      v_to_qty, v_cost_basis / v_to_qty, p_to_price_eur
    )
    on conflict (user_id, crypto_id) do update
      set avg_buy_price = ((a.quantity * a.avg_buy_price) + v_cost_basis) / nullif(a.quantity + v_to_qty, 0),
          quantity      = a.quantity + v_to_qty,
          current_price = excluded.current_price;
  end if;

  -- ── Achat ──
  if p_type = 'buy' then
    insert into public.portfolio_assets as a (
      user_id, crypto_id, crypto_symbol, crypto_name, crypto_image,
      quantity, avg_buy_price, current_price
    ) values (
      v_uid, p_crypto_id, p_crypto_symbol, p_crypto_name, coalesce(p_crypto_image, ''),
      v_quantity, p_price_eur, p_price_eur
    )
    on conflict (user_id, crypto_id) do update
      set avg_buy_price = ((a.quantity * a.avg_buy_price) + (excluded.quantity * excluded.avg_buy_price))
                          / nullif(a.quantity + excluded.quantity, 0),
          quantity      = a.quantity + excluded.quantity,
          current_price = excluded.current_price;
  end if;

  -- ── Historique ──
  insert into public.transactions (
    user_id, type, crypto_name, crypto_symbol, amount_eur, quantity, fees_eur,
    to_address, gas_fee_eur, from_crypto_symbol, to_crypto_symbol,
    slippage_percentage, security_score, security_score_label, ai_comment
  ) values (
    v_uid, p_type, p_crypto_name, p_crypto_symbol, p_amount_eur, v_quantity,
    case when p_type = 'buy'  then p_fees_eur end,
    case when p_type = 'send' then left(p_to_address, 120) end,
    case when p_type = 'send' then p_gas_fee_eur end,
    case when p_type = 'swap' then p_crypto_symbol end,
    case when p_type = 'swap' then p_to_crypto_symbol end,
    case when p_type = 'swap' then p_slippage_percentage end,
    p_security_score, p_security_score_label, left(p_ai_comment, 300)
  );

  -- ── Solde et points ──
  return query
  update public.profiles p
     set simulated_balance_eur = p.simulated_balance_eur - v_eur_cost,
         total_points          = p.total_points + c_points
   where p.id = v_uid
  returning p.simulated_balance_eur::numeric, p.total_points;
end;
$$;

revoke all on function public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text, text, text, text, numeric
) from public, anon;
grant execute on function public.record_simulated_transaction(
  text, text, text, text, text, numeric, numeric, numeric, numeric, text, numeric,
  text, text, numeric, int, text, text, text, text, text, numeric
) to authenticated;
