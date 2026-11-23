-- SafeStart : suppression de compte (droit à l'effacement, RGPD art. 17)
-- À exécuter une fois dans Supabase > SQL Editor.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer          -- nécessaire pour supprimer la ligne dans auth.users
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;

  -- Données applicatives de l'utilisateur
  if to_regclass('public.user_badges') is not null then
    execute 'delete from public.user_badges where user_id = $1' using v_uid;
  end if;
  delete from public.transactions     where user_id = v_uid;
  delete from public.portfolio_assets where user_id = v_uid;
  delete from public.profiles         where id = v_uid;

  -- Compte d'authentification (email, mot de passe, sessions)
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
