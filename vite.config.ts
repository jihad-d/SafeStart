import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// En dev, sert les fonctions de /api comme le ferait Vercel (évite d'avoir besoin de `vercel dev`).
function devApi(): Plugin {
  return {
    name: 'safestart-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/safebot', async (req, res) => {
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          })
          const mod = await server.ssrLoadModule('/api/safebot.ts')
          const response: Response = req.method === 'POST'
            ? await mod.POST(request)
            : new Response('Method Not Allowed', { status: 405 })
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Erreur serveur de développement.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Rend les variables serveur (sans préfixe VITE_) disponibles pour /api en dev.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), devApi()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 3000,
    },
  }
})
