import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:7715', changeOrigin: true },
      '/login': {
        target: 'http://localhost:7715',
        changeOrigin: true,
        bypass(req) {
          if (req.method === 'GET') return req.url;
        },
      },
      '/register': {
        target: 'http://localhost:7715',
        changeOrigin: true,
        bypass(req) {
          if (req.method === 'GET') return req.url;
        },
      },
      '/logout': { target: 'http://localhost:7715', changeOrigin: true },
    },
  },
});
