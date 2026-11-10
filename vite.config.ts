import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSiteConfig } from './scripts/site-origin.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const { siteOrigin, isIndexable } = resolveSiteConfig({ ...fileEnv, ...process.env })

  return {
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteOrigin),
      'import.meta.env.VITE_SITE_INDEXABLE': JSON.stringify(isIndexable),
    },
    plugins: [
      react(),
      {
        name: 'struktur-seo-origin',
        transformIndexHtml(html) {
          return html
            .replaceAll('__SITE_ORIGIN__', siteOrigin)
            .replaceAll('__ROBOTS_DIRECTIVE__', isIndexable ? 'index, follow, max-image-preview:large' : 'noindex, follow')
        },
      },
    ],
  }
})
