import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Treino — Painel do Personal',
        short_name: 'Treino',
        description: 'Monte treinos, acompanhe alunos e marque exercícios feitos.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#12141a',
        theme_color: '#12141a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cacheia o "casco" do app (HTML/CSS/JS) para abrir instantâneo;
        // os dados (treinos, alunos) sempre vêm da rede, direto do Supabase.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
