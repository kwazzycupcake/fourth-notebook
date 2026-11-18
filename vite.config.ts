/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'

// GitHub Pages serves the app from https://<username>.github.io/<repo-name>/,
// so every asset path starts with the repo name. If you rename the repo,
// change this line to match.
const base = '/fourth-notebook/'

export default defineConfig({
  base,
  // Let other devices on your Wi-Fi (like your phone) open the dev server.
  server: { host: true },
  plugins: [
    react(),
    // GitHub Pages shows 404.html for any address it doesn't have as a file
    // (like /fourth-notebook/library). Making 404.html a copy of the app means
    // refreshing any page still opens the app, which then shows that page.
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
    // The Home link is /fourth-notebook (no slash). GitHub Pages adds the slash
    // itself; the local server doesn't, so add it here too.
    {
      name: 'add-trailing-slash',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === base.slice(0, -1) || req.url?.startsWith(`${base.slice(0, -1)}?`)) {
            res.writeHead(302, { Location: req.url.replace(base.slice(0, -1), base) }).end()
            return
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === base.slice(0, -1)) {
            res.writeHead(302, { Location: base }).end()
            return
          }
          next()
        })
      },
    },
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Cache the app and the Latin font files so it opens offline.
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*-latin-[0-9]*.woff2'],
      },
      manifest: {
        name: 'The Fourth Notebook',
        short_name: 'Notebook',
        description: 'A personal dictionary that quizzes you back.',
        theme_color: '#2E4A3B',
        background_color: '#F5F0E6',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
