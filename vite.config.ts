import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:4747',
      '/mcp': 'http://127.0.0.1:4747',
      '/robots.txt': 'http://127.0.0.1:4747',
      '/sitemap.xml': 'http://127.0.0.1:4747'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
