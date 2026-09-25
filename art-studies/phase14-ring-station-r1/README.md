# Orbital ring station — isolated R1 model study

User rejected the complex distant-scenery sheets and requested one recognizable station from their small background-reference crop. This study stays entirely in this directory so another agent can refactor the game independently. No library registration, track placement, collision, level data, global materials, package files or shared build configuration is changed.

## Model

`station.js` is an import-free recipe-style default factory: `generate(THREE) -> THREE.Group`. Geometry is procedural Three.js primitives and extruded annular sectors. Materials use explicit colors and no textures. It needs no resources from the game. Metres, Y up, base Y=0, centered X/Z; nominal ring diameter 185 m. Factory parts are named; the isolated preview merges them by material into six meshes. Future integration should likewise batch the static geometry.

Reference priorities: a thin continuous circular ring, open wheel-like spokes, a shallow tiered central hub and a tall narrow asymmetric antenna spine, balanced by a shorter spindle below. Detail is deliberately large: 40 armor sectors, eight structural sockets, rim service blocks, stepped hub plates, mast collars, broad dark breaks and sparse window clusters. No close-up fasteners, dense greeble, luminous ring outline, phase colors or crossing curtain. It is noninteractive distant scenery and has no collision hooks. The source crop is saved beside this document as `reference.png`.

## Isolated preview

From `game/`:

```powershell
node node_modules/vite/bin/vite.js build --config art-studies/phase14-ring-station-r1/vite.config.js
node node_modules/vite/bin/vite.js preview --config art-studies/phase14-ring-station-r1/vite.config.js
```

URL: http://127.0.0.1:4186/. Outputs stay in this directory's ignored `build/`; the existing game's `dist/` and preview are unaffected. Port is strict to avoid displacing another service.

The initial background-distance view is 950 m from the station center. Controls provide Structure (380 m), Background (950 m) and Far (1800 m), a continuous distance slider, manual orbit and optional slow rotation. These are asset-inspection distances, not approved game placement distances. The frame is empty around the station so its silhouette can be judged. Controls and a technical geometry readout exist only in this separate art tool.

Status: geometry delivered for user review. The isolated production build passed, with Vite's bundle-size advisory for the Three.js viewer. Preview started on port 4186. Source review/build only; no tests, browser smoke checks, gameplay inspection or automatic visual review. Official recipe verification remains pending, as required by the standing user-owned testing rule. This is one candidate, not approval of phase 14 or authorization to integrate it into levels.
