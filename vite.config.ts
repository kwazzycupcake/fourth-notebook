/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// GitHub Pages serves the app from https://<username>.github.io/<repo-name>/,
// so every asset path starts with the repo name. If you rename the repo,
// change this line to match.
const base = '/sixth-notebook/'

export default defineConfig({
  base,
  // Let other devices on your Wi-Fi (like your phone) open the dev server.
  server: { host: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Cache the app and the Latin font files so it opens offline.
        globPatterns: ['**/*.{js,css,html,svg,png}', '**/*-latin-[0-9]*.woff2'],
      },
      manifest: {
        name: 'The Sixth Notebook',
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
