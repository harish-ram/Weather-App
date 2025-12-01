import { defineConfig } from 'vite'

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
    plugins: [],
  }
})
