import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Petit check de sécurité pour t'aider à débugger dans la console
if (!url || !key) {
  console.error("🚨 ATTENTION : Les variables d'environnement Supabase sont manquantes !");
}

// On exporte le client directement
export const supabase = createClient(url, key)