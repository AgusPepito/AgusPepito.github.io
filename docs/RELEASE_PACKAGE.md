# Final game package

`npm run build -- --configLoader native` builds only `racer.html` and its imported dependency graph. Vite still bundles every imported procedural model and the campaign worker; these source modules must not be deleted from the repository merely because they live under `public/assets/`.

Automatic copying of the entire public folder is disabled for the final build. `scripts/runtime-assets.mjs` copies the explicit runtime URL dependencies:

- Six 480 × 160 WebP area thumbnails.
- Two KTX2 sky textures.
- The 90-second looping menu song and race-01.
- The matching Basis JS/WASM transcoder and license.
- Three.js, Supabase and recipe license notices.

When adding a runtime file loaded by a URL string rather than a JavaScript import, update this list. Imported code and worker dependencies remain managed by Vite.

The final package excludes original sky PNGs, the ship concept image, raw copies of bundled model source, candidate ships/expectations, inspector pages and their worker, the highway prototype, and development styles/bundles. Original sources and historical art records remain in the repository. They are not published by this workflow.

Construction-review query parameters are enabled only on the development server and the tools build, preventing the release from presenting links to omitted inspector pages. Normal campaign and practice remain available.

## Local development and publication

- `npm run dev`: the complete source workspace, including the original highway, shipyard and inspectors.
- `npm run build`: final racer in `dist/`.
- `npm run preview`: final racer at `/racer.html`.
- `npm run build:tools -- --configLoader native`: full development build in `tools-dist/`; serve using `npm run preview -- --mode tools --configLoader native --port 4174` if needed.
- `node scripts/prepare-pages.mjs`: recreates `pages-dist/` from the final build, adds the racer as `index.html`, and retains `/racer.html` compatibility.

Publication cleanup is restricted to the exact project `pages-dist` folder and rejects a linked directory. A previous full development package cannot leave obsolete files behind. GitHub Actions already invokes the normal build and packaging script, so subsequent pushes use the smaller package automatically.

Source review and production rebuilding/packaging only. No tests or gameplay inspection were run. The official live-URL gate still requires user authorization and has not been claimed as passed.

## Size recorded 2026-09-26

The previous all-pages `dist` folder totaled 17,095,071 bytes. The racer-only `dist` totals 8,665,681 bytes, and the publication package totals 8,677,496 bytes across 22 files (including the homepage copy). This is approximately 8.68 decimal MB and a 49.2% reduction from the prior all-pages build. It includes all final runtime media plus license notices. It is a filesystem inventory, not the official gate's network measurement; duplicate requests and API responses can still affect that measurement.
