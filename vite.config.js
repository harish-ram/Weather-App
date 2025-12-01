import { defineConfig } from 'vite'

// Vite dev server proxy to avoid CORS when calling OpenAQ during development.
export default defineConfig({
  // When building for production in CI/GitHub Pages, set base to repository name.
  // This uses the NODE_ENV variable — GitHub Actions sets NODE_ENV=production during build.
  base: process.env.NODE_ENV === 'production' ? '/Weather-App/' : '/',
  server: {
    proxy: {
      // any request to /openaq/* will be forwarded to https://api.openaq.org/*
      '/openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openaq/, ''),
      },
    },
  },
})
