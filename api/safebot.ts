// Fonction serverless Vercel : proxy sécurisé vers l'API Anthropic.
// La clé ANTHROPIC_API_KEY reste côté serveur et n'est jamais envoyée au navigateur.
import { createClient } from '@supabase/supabase-js'

const MODEL = 'claude-haiku-5-5'
const MAX_QUESTION_LENGTH = 500

const SYSTEM_PROMPT = `Tu es SafeBot, un assistant pédagogique spécialisé en crypto pour les débutants.
Réponds en français, de manière simple et courte (3-4 phrases max).
Ne donne jamais de conseils financiers directs ni de recommandation d'achat ou de vente.`

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export async function POST(request: Request): Promise<Response> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!supabaseUrl || !serviceKey || !anthropicKey) {
    console.error('safebot: variables d environnement serveur manquantes')
    return json(500, { error: 'Configuration serveur incomplète.' })
  }

  // 1. Authentification : jeton Supabase de l'utilisateur connecté
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Non authentifié.' })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) return json(401, { error: 'Session invalide.' })

  // 2. Validation de la question
  let question = ''
  try {
    const body = await request.json()
    question = typeof body?.question === 'string' ? body.question.trim() : ''
  } catch {
    return json(400, { error: 'Requête invalide.' })
  }
  if (!question) return json(400, { error: 'Question vide.' })
  if (question.length > MAX_QUESTION_LENGTH) {
    return json(400, { error: `Question trop longue (${MAX_QUESTION_LENGTH} caractères max).` })
  }

  // 3. Quota journalier (atomique, côté base)
  const { data: quotaRows, error: quotaError } = await admin.rpc('consume_ai_message', {
    p_user_id: userData.user.id,
  })
  if (quotaError) {
    console.error('safebot: quota', quotaError)
    return json(500, { error: 'Impossible de vérifier le quota.' })
  }
  const quota = Array.isArray(quotaRows) ? quotaRows[0] : null
  if (!quota) return json(429, { error: 'Limite journalière atteinte.' })

  // 4. Appel Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    }),
  })

  if (!response.ok) {
    console.error('safebot: anthropic', response.status, await response.text())
    return json(502, { error: 'SafeBot est indisponible pour le moment.' })
  }

  const data = await response.json()
  const answer = (data.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('\n')
    .trim()

  return json(200, { answer, used: quota.used, limit: quota.quota })
}
