import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      /* Deshabilitar Inyectar el SW al 100% durante DEV para evitar problemas de caché con HMR */
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'CompraFlash',
        short_name: 'CompraFlash',
        description: 'Tus listas de compras ultrarrápidas y offline.',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        // Enforce caching for all important network assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            // Cache requests to the backend /api implicitly (though manual fetch queues are better for POST, GETs can be cached here)
            urlPattern: /^https?:\/\/localhost:5001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'compraflash-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
