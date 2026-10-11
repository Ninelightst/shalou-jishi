import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['hourglass.svg', 'pwa-64x64.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '沙漏记事',
        short_name: '沙漏记事',
        description: '离线可用的个性化日程与计时应用',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: './',
        theme_color: '#F7F5F0',
        background_color: '#F7F5F0',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
