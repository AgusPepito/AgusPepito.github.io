import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { chunkSizeWarningLimit: 650, rollupOptions: { input: { highway: 'index.html', racer: 'racer.html', shipyard: 'shipyard.html', library: 'library.html' } } },
});
