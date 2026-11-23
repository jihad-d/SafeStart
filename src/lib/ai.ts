import { supabase } from '@/lib/supabase'

export interface SafeBotReply {
  answer: string
  used: number
  limit: number
}

export class SafeBotLimitError extends Error {}

// Appelle la fonction serverless /api/safebot : la clé IA ne quitte jamais le serveur.
export async function askSafeBot(question: string): Promise<SafeBotReply> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Connecte-toi pour discuter avec SafeBot.')

  const response = await fetch('/api/safebot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  })

  const body = await response.json().catch(() => ({}))
  if (response.status === 429) throw new SafeBotLimitError(body.error ?? 'Limite journalière atteinte.')
  if (!response.ok) throw new Error(body.error ?? 'Erreur SafeBot')
  return body as SafeBotReply
}
