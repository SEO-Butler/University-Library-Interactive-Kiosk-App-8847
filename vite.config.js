import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
   build: {
    outDir: 'dist',
    // No source maps in the published build: they expose the full source.
    sourcemap: false
  },
});