-- SafeStart : nettoyage des anciennes politiques RLS (doublons) + table ai_conversations
-- À exécuter une fois dans Supabase > SQL Editor, APRÈS 20261126_security_rls.sql.

-- ─────────────────────────────────────────────────────────────
-- 1. Anciennes politiques remplacées par les politiques « safestart_* »
--    (elles autorisaient aussi l'écriture directe : déjà bloquée par les droits,
--     on les retire pour garder une configuration claire)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "own portfolio"                      on public.portfolio_assets;
drop policy if exists "own transactions"                   on public.transactions;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "manage_own_profile"                 on public.profiles;

do $$
begin
  if to_regclass('public.user_badges') is not null then
    execute 'drop policy if exists "own badges" on public.user_badges';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 2. ai_conversations (ancien historique SafeBot, IA suspendue)
--    Accès réservé à son propriétaire, rien pour les visiteurs anonymes,
--    et effacement lors de la suppression du compte (RGPD).
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.ai_conversations') is not null then
    execute 'alter table public.ai_conversations enable row level security';
    execute 'revoke all on public.ai_conversations from anon';
  end if;
end $$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

  if to_regclass('public.user_badges') is not null then
    execute 'delete from public.user_badges where user_id = $1' using v_uid;
  end if;
  if to_regclass('public.ai_conversations') is not null then
    execute 'delete from public.ai_conversations where user_id = $1' using v_uid;
  end if;
  delete from public.support_messages where user_id = v_uid;
  delete from public.transactions     where user_id = v_uid;
  delete from public.portfolio_assets where user_id = v_uid;
  delete from public.profiles         where id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Vérification finale
-- ─────────────────────────────────────────────────────────────
select tablename, policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public'
 order by tablename, policyname;
