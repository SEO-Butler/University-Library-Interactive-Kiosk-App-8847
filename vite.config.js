import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Two pages share one build: the kiosk (index.html) and the CMS (cms/index.html).
// In development /api is proxied to the API server (npm run dev:server).
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API ?? 'http://127.0.0.1:8080',
        changeOrigin: false
      }
    }
  },
  build: {
    outDir: 'dist',
    // No source maps in the published build: they expose the full source.
    sourcemap: false,
    rollupOptions: {
      input: {
        kiosk: path.resolve(__dirname, 'index.html'),
        cms: path.resolve(__dirname, 'cms/index.html')
      }
    }
  }
});
