import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Variables Supabase manquantes");
}

/**
 * Vrai si la page a été ouverte depuis le lien d'un email « Mot de passe oublié ».
 * Lu AVANT la création du client, qui efface ensuite les paramètres de l'URL.
 */
export const OPENED_FROM_RECOVERY_LINK =
  typeof window !== 'undefined' && /type=recovery/.test(window.location.hash + window.location.search)

/** Code d'erreur renvoyé par Supabase dans l'URL (ex. lien expiré ou déjà utilisé). */
export const AUTH_LINK_ERROR =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.slice(1) || window.location.search).get('error_code')
    : null

export const supabase = createClient(url || '', key || '')
