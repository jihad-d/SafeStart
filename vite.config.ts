import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Les aperçus de partage exigent une URL absolue pour l'image.
// Sur Vercel, VERCEL_PROJECT_PRODUCTION_URL est fourni automatiquement au build ;
// sinon SITE_URL peut être défini à la main (ex. https://safestart.vercel.app).
function siteUrl(): Plugin {
  const raw = process.env.SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  const url = raw.replace(/\/$/, '')
  return {
    name: 'safestart-site-url',
    transformIndexHtml: html => html.replaceAll('%SITE_URL%', url),
  }
}

export default defineConfig({
  plugins: [react(), siteUrl()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
  },
})
