import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const configuredSiteUrl = process.env.VITE_SITE_URL || fileEnv.VITE_SITE_URL
  const siteOrigin = (configuredSiteUrl || process.env.CF_PAGES_URL || 'http://localhost:5173').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'struktur-seo-origin',
        transformIndexHtml(html) {
          return html
            .replaceAll('__SITE_ORIGIN__', siteOrigin)
            .replaceAll('__ROBOTS_DIRECTIVE__', configuredSiteUrl ? 'index, follow, max-image-preview:large' : 'noindex, follow')
        },
      },
    ],
  }
})
