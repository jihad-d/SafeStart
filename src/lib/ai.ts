export async function askSafeBot(question: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Tu es SafeBot, un assistant pédagogique spécialisé en crypto pour les débutants.
          Réponds en français, de manière simple et courte (3-4 phrases max).
          Ne donne jamais de conseils financiers directs.
          Question : ${question}`
        }
      ]
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    console.error("Anthropic error:", err)
    throw new Error(err.error?.message ?? "Erreur API")
  }

  const data = await response.json()
  return data.content[0].text
}