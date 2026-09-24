import { cp, readFile, writeFile } from 'node:fs/promises';

// Package a separate site folder so local preview keeps its original URLs.
await cp(new URL('../dist/', import.meta.url), new URL('../pages-dist/', import.meta.url), { recursive: true });
const site = new URL('../pages-dist/', import.meta.url);
await cp(new URL('index.html', site), new URL('highway.html', site));
const racer = (await readFile(new URL('racer.html', site), 'utf8'))
  .replace('href="./index.html"', 'href="./highway.html"');
await writeFile(new URL('index.html', site), racer);
await writeFile(new URL('racer.html', site), racer);
await writeFile(new URL('.nojekyll', site), '');
