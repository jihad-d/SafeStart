-- SafeStart : modules d'apprentissage terminés, points et badges associés
-- À exécuter une fois dans Supabase > SQL Editor, APRÈS 20261128_badges.sql.

-- ─────────────────────────────────────────────────────────────
-- 1. Modules terminés (lecture seule pour l'utilisateur)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.module_completions (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module_id    text not null check (module_id in ('wallet', 'fees', 'chain', 'defi')),
  best_score   int  not null check (best_score between 0 and 3),
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table public.module_completions enable row level security;
revoke all on public.module_completions from anon;
revoke insert, update, delete on public.module_completions from authenticated;
grant select on public.module_completions to authenticated;

drop policy if exists "safestart_modules_select_own" on public.module_completions;
create policy "safestart_modules_select_own" on public.module_completions
  for select to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 2. Valider un module : points crédités une seule fois (≥ 2 bonnes réponses sur 3)
-- ─────────────────────────────────────────────────────────────
create or replace function public.complete_module(p_module_id text, p_score int)
returns table (first_completion boolean, points int, new_total_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_points int;
  v_new    boolean := false;
  v_total  int;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

  v_points := case p_module_id
    when 'wallet' then 50
    when 'fees'   then 60
    when 'chain'  then 70
    when 'defi'   then 100
  end;
  if v_points is null then
    raise exception 'Module inconnu' using errcode = '22023';
  end if;
  if p_score is null or p_score not between 2 and 3 then
    raise exception 'Score insuffisant' using errcode = '22023';
  end if;

  insert into public.module_completions (user_id, module_id, best_score)
  values (v_uid, p_module_id, p_score)
  on conflict (user_id, module_id) do nothing;
  v_new := found;

  if v_new then
    update public.profiles p set total_points = p.total_points + v_points where p.id = v_uid;
  else
    update public.module_completions
       set best_score = greatest(best_score, p_score)
     where user_id = v_uid and module_id = p_module_id;
    v_points := 0;
  end if;

  select p.total_points into v_total from public.profiles p where p.id = v_uid;

  first_completion := v_new;
  points := v_points;
  new_total_points := v_total;
  return next;
end;
$$;

revoke all on function public.complete_module(text, int) from public, anon;
grant execute on function public.complete_module(text, int) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Deux badges liés aux modules
-- ─────────────────────────────────────────────────────────────
insert into public.badges (name, icon, description, points_reward, category, code)
select v.name, '', v.description, v.points, v.category, v.code
  from (values
    ('Premier module', 'Premier module d''apprentissage validé.', 50,  'apprentissage', 'first_module'),
    ('Studieux',       'Les 4 modules d''apprentissage validés.', 150, 'apprentissage', 'scholar')
  ) as v(name, description, points, category, code)
 where not exists (select 1 from public.badges b where b.code = v.code);

-- award_badges : mêmes règles qu'avant + les deux badges des modules
create or replace function public.award_badges()
returns table (badge_code text, badge_name text, points int, new_total_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_earned  text[] := '{}';
  v_points  int := 0;
  v_total   int;
  v_modules int;
  r         record;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

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

  select count(*) into v_modules from public.module_completions where user_id = v_uid;
  if v_modules >= 1 then v_earned := v_earned || 'first_module'; end if;
  if v_modules >= 4 then v_earned := v_earned || 'scholar'; end if;

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

  update public.profiles p
     set total_points = p.total_points + v_points
   where p.id = v_uid
  returning p.total_points into v_total;

  new_total_points := v_total;
  badge_code := null; badge_name := null; points := v_points;
  return next;
end;
$$;

revoke all on function public.award_badges() from public, anon;
grant execute on function public.award_badges() to authenticated;
