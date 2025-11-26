import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
          manifest: {
            name: 'stoffanprobe.de - Stoffanprobe App',
            short_name: 'stoffanprobe',
            description: 'Stoffanprobe App - Visualisiere Stoffe in verschiedenen Räumen',
            theme_color: '#FAF1DC',
            background_color: '#FAF1DC',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: '/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icon-1024x1024.png',
                sizes: '1024x1024',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr
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
      define: {
        // API keys are now handled by the backend
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
