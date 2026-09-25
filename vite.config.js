import { defineConfig } from 'vite';

// Enables the browser's optional whole-page memory estimator on localhost.
// All game assets and workers are same-origin runtime resources.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true, headers:isolationHeaders },
  preview: { port: 4173, strictPort: true, headers:isolationHeaders },
  build: { chunkSizeWarningLimit: 650, rollupOptions: { input: { highway: 'index.html', racer: 'racer.html', shipyard: 'shipyard.html', library: 'library.html', roadInspector:'road-inspector.html', gateInspector:'gate-inspector.html', slowAssets:'slow-assets.html', sideModules:'side-modules.html' } } },
});
