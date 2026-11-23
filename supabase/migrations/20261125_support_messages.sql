-- SafeStart : messages envoyés depuis la page Aide (lisibles dans Supabase > Table Editor)
-- À exécuter une fois dans Supabase > SQL Editor.

create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email      text,
  topic      text not null check (char_length(topic) between 1 and 60),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Un utilisateur connecté peut envoyer un message en son nom, mais ne peut pas lire la table.
drop policy if exists "support_messages_insert_own" on public.support_messages;
create policy "support_messages_insert_own"
  on public.support_messages
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- La suppression de compte efface aussi les messages de support (RGPD).
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
  delete from public.support_messages where user_id = v_uid;
  delete from public.transactions     where user_id = v_uid;
  delete from public.portfolio_assets where user_id = v_uid;
  delete from public.profiles         where id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
