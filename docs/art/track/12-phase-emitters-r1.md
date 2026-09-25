# Phase 12 — recessed phase emitters R1

The user selected a mixture of F1 cable manifolds and F2 capacitor banks, requesting the same detail level as the latest walls and passages and dynamic phase colors. This first modeled set is ready for user review. The tall G2 fin direction is superseded.

## Geometry

- Flat, outside-tube and inside-tube sets share a repeatable nominal six-metre cartridge, adapted to close the radius-18 tube circumference exactly.
- After the user approved the appearance and requested longer visibility, each station was doubled from twelve to twenty-four metres: fifteen metres of approach machinery and nine metres after the crossing line. A six-metre capacitor/cable bay was added to each end, preserving component proportions. The gate crossing stays at the existing gameplay station. Road cutouts and the road-mounted library assembly use the extended bounds.
- Deep wells contain paired capacitor cells, colored energy bands, stepped terminal couplings, mounting saddles, busbars and engraved identification tabs.
- Three routed charging cables per cartridge have phase-colored jackets, brass connectors, ribbed sleeves, retaining combs and return feeds.
- Ivory frames have real apertures for the machinery, service hatches, vents and crossing lights. Fasteners, lens bezels, reflector beds, glass segments and optical filaments are modeled separately, with separated surface depths.
- Hardware remains below the nominal driving skin. The surrounding road is cut through all visual layers before curving, exposing the actual machinery instead of covering it with a slab.
- A translucent light curtain fades away from the projector row. It curves radially outward on outside tubes and inward on inside tubes, without posts or hard crossbars. The projection is seven metres high, leaving the inner bore open beyond it.

## Dynamic colors

`setEmitterColor(root, color)` updates the phase-tinted material colors and emissive colors in place. Cables, capacitor bands, lens glass, crossing strips and projected light change together. Ivory, graphite, steel and brass remain neutral. Each station owns its material set, so changing one gate does not recolor its neighbors. No phase color is baked into geometry or textures.

The asset library has a **Live gate phase** selector for cyan/ION, amber/SOL and violet/FLUX. The existing mesh is recolored without regeneration. Runtime review gates also synchronize their materials when the underlying gate's `phase` changes; the ship's chosen phase does not recolor the gate.

## Review links

| Surface | Complete gate | Detailed module | Playable course |
| --- | --- | --- | --- |
| Flat | [Gate](http://127.0.0.1:4174/library.html?category=12&asset=flat-gate&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=12&asset=flat-gate-module&revision=r1) | [Drive](http://127.0.0.1:4174/racer.html?review=12&element=gates&shape=flat) |
| Outside | [Gate](http://127.0.0.1:4174/library.html?category=12&asset=outside-gate&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=12&asset=outside-gate-module&revision=r1) | [Drive](http://127.0.0.1:4174/racer.html?review=12&element=gates&shape=outside) |
| Inside | [Gate](http://127.0.0.1:4174/library.html?category=12&asset=inside-gate&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=12&asset=inside-gate-module&revision=r1) | [Drive](http://127.0.0.1:4174/racer.html?review=12&element=gates&shape=inside) |

Each shape also has a hardware-only assembly and a gate seated in a cut road section. Complete assemblies merge geometry by material; the individual module retains named component meshes for inspection.

Courses contain cyan, amber and violet full-width gates at 350, 850 and 1350 metres. The Play flow now cycles flat → outside → inside after each completed sample, starting at the shape requested in the URL. A starting-surface selector and an always-available Next surface button allow immediate comparison. Match with 1/2/3; T toggles quarter speed and R retries the current surface. Existing phase-crossing rules remain in use. This first gate set is integrated into the dedicated phase-12 review, not the campaign's older gate visuals. Partial-width road installation remains a later assembly task.

Production build passed (`npm run build`); the existing Three.js bundle-size advisory remains. Source review only beyond that build: no tests, simulation checks or gameplay visual inspection, per the user's standing instruction. No commit requested.

Sources: `public/assets/track/phase-emitter-r1.js`, `src/racer/phase-emitter-kit.js`, the optional slab cut ranges in `src/racer/slab-kit.js`, and the library/review integration.
