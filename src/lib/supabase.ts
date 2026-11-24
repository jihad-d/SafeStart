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

export const supabase = createClient(url || '', key || '')
