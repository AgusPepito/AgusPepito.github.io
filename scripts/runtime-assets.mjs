import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// Files requested by runtime URLs rather than imported into Vite's module graph.
// Procedural model source is bundled by Vite; its raw public copies are omitted.
const publicFiles = [
  'assets/areas/dockyards-r1.webp',
  'assets/areas/conduits-r1.webp',
  'assets/areas/broken-span-r1.webp',
  'assets/areas/relay-grid-r1.webp',
  'assets/areas/outer-ring-r1.webp',
  'assets/areas/nexus-r1.webp',
  'assets/space/planet-backdrop-r1.ktx2',
  'assets/space/planet-stars-r2.ktx2',
  'assets/music/menu.mp3',
  'assets/music/race-01.mp3',
  'vendor/basis/basis_transcoder.js',
  'vendor/basis/basis_transcoder.wasm',
  'vendor/basis/LICENSE',
];

export function runtimeAssetsPlugin() {
  return {
    name: 'racer-runtime-assets',
    async writeBundle(options) {
      const output = resolve(root, options.dir);
      for (const name of publicFiles) {
        const destination = resolve(output, name);
        await mkdir(dirname(destination), { recursive: true });
        await cp(resolve(root, 'public', name), destination);
      }
      const licenseDir = resolve(output, 'licenses');
      await mkdir(licenseDir, { recursive: true });
      await cp(resolve(root, 'node_modules/three/LICENSE'), resolve(licenseDir, 'three.txt'));
      await cp(resolve(root, 'node_modules/@supabase/supabase-js/LICENSE'), resolve(licenseDir, 'supabase.txt'));
      await cp(resolve(root, 'src/vendor/404/LICENSE'), resolve(licenseDir, '404-recipe.txt'));
    },
  };
}
