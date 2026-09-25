# Dashed shoulder module and side-wall lights

Implemented 2026-09-25 at the user's request, using the supplied orbital-racing images as visual references. Procedural recipe route B: agent-authored Three.js constructors and operations; no downloaded meshes, textures or encoded geometry.

## Modules

- `public/assets/track/edge-light-r1.js`: standalone 12.5 m repeat, 1 m wide, 0.18 m high. A dark recessed channel, two thin outer trims, two 3 m pearl/cool-white luminous dashes, and terminal joints. Dashes repeat every 6.25 m across neighboring bays. An `illuminated` option provides powered/unpowered variants.
- `public/assets/track/sidewall-lights-r1.js`: four shallow recessed lamp cassettes per existing R3 wall bay, seated on its upper/lower lips. The 2.1 m diffusers sit behind their narrow frame edges. Every fixture follows the existing 30-degree face and ramp-end taper; individual lamps do not cross the ramp shoulder.
- Small additive gradients supply localized spill beside the dashes without adding point lights. The existing Rich-mode bloom supplies the wider halo. Light mode keeps the luminous surfaces and faint spill. No flashing, phase-color changes or new gameplay cues.

## Mounting and behavior

`roadside-lighting.js` defines the shared shoulder width and wall offset. The shoulder overlaps the road edge by 0.2 m and extends 0.8 m outward. The wall pivot is now 2.2 m beyond the road half-width: its 1.4 m inward foot meets the shoulder's outer edge. Campaign wall housings therefore move outward by 1 m. The road's driving/collision width and scrape boundaries are unchanged.

`campaign-kit.js` adds the shoulder only beside existing wall bays, sharing their globally aligned 12.5 m pitch and encounter exclusions. It follows the same track frame/deformation as the road and housing. Gaps, gates, obstacles, checkpoints and bare stretches already remove nearby wall bays; the lights stop with those bays. No artificial side-wall seam is introduced on fully closed tubes.

`detailed-kit.js` applies the same light cassette assembly to all active pipe/grille/cover wall variants. `mixed-kit.js` and the R3 review assemblies use the same shoulder spacing. The original wall source files and silhouette are retained.

Material batching, indexed geometry, worker generation and in-memory attribute transfer remain in use. The new spill uses vertex colors rather than a texture slot or custom worker shader. Materials are distinct from phase-lane materials and remain visible in driving-only mode. The earlier sun/reflection glare reduction remains unchanged.

## User preview

- Play: `http://127.0.0.1:5173/racer.html`
- Standalone module: `http://127.0.0.1:5173/library.html?category=05&asset=edge-light`
- Combined sample: `http://127.0.0.1:5173/library.html?category=05&asset=lit-roadside`
- Existing side-module catalog now also includes the wall lamps.

Source review and `npm run build -- --configLoader native` completed. The build retains the shared Three.js chunk-size warning. No tests, automated gameplay checks, browser inspection or visual playtesting were performed. User review remains pending for brightness, spacing, joins, curves and performance.
