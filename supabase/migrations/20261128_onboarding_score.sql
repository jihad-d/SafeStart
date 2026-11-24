-- SafeStart : colonne du score de l'évaluation de niveau
-- À exécuter une fois dans Supabase > SQL Editor.
--
-- Sans cette colonne, l'enregistrement de fin d'évaluation (niveau + « terminée » + score)
-- était refusé en bloc : l'évaluation était redemandée à chaque connexion.

alter table public.profiles add column if not exists onboarding_score int;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
