import { defineConfig } from 'vite';
import { runtimeAssetsPlugin } from './scripts/runtime-assets.mjs';

// Enables the browser's optional whole-page memory estimator on localhost.
// All game assets and workers are same-origin runtime resources.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};
export default defineConfig(({ command, mode }) => {
  const release = command === 'build' && mode !== 'tools';
  return {
  base: './',
  server: { port: 5173, strictPort: true, headers:isolationHeaders },
  preview: { port: 4173, strictPort: true, headers:isolationHeaders },
  plugins: release ? [runtimeAssetsPlugin()] : [],
  build: {
    outDir: mode === 'tools' ? 'tools-dist' : 'dist',
    copyPublicDir: !release,
    chunkSizeWarningLimit: 650,
    rollupOptions: { input: release ? { racer: 'racer.html' } : {
      highway: 'index.html', racer: 'racer.html', shipyard: 'shipyard.html', library: 'library.html',
      roadInspector:'road-inspector.html', gateInspector:'gate-inspector.html', slowAssets:'slow-assets.html', sideModules:'side-modules.html',
    } },
  },
  };
});
