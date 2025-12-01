import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Vite dev server proxy to avoid CORS when calling OpenAQ during development.
export default defineConfig(({ mode }) => {
  // When building for production in CI/GitHub Pages, set base to repository name.
  const isProd = mode === 'production'
  return {
    base: isProd ? '/Weather-App/' : '/',
    server: {
      proxy: {
        '/openaq': {
          target: 'https://api.openaq.org',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/openaq/, ''),
        },
      },
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Check Weather',
          short_name: 'CheckWeather',
          start_url: '.',
          display: 'standalone',
          background_color: '#071426',
          theme_color: '#0ea5a4',
          icons: [{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }],
        },
      }),
    ],
  }
})
