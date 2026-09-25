import { cp, lstat, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = resolve(root, 'dist');
const site = resolve(root, 'pages-dist');
// Read the completed build before replacing a previous local publish package.
const racer = await readFile(resolve(build, 'racer.html'), 'utf8');
// Only this exact generated folder can be removed; never follow a directory link.
if (dirname(site) !== resolve(root) || basename(site) !== 'pages-dist') {
  throw new Error('Publication folder is outside the project');
}
const previous = await lstat(site).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (previous?.isSymbolicLink()) throw new Error('Publication folder must not be a link');
await rm(site, { recursive: true, force: true });
await cp(build, site, { recursive: true });
// Keep racer.html for existing racer links; the same game is the public homepage.
await writeFile(resolve(site, 'index.html'), racer);
await writeFile(resolve(site, '.nojekyll'), '');
