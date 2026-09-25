# Off-track dressing — selected model study R1

Procedural models made from the user's R2 concept-sheet selections on 2026-09-25: **R2 Broken arc**, **P3 Relay crown**, and **S3 Service boom without hanging cylinders**. Material direction follows the corrected references: exposed gunmetal/silver structure, white metal cladding, cyan/blue lenses and amber markers.

## Preview

Open [the model preview](http://127.0.0.1:4187/). Choose a model in the selector, drag to orbit, wheel to zoom, or right-drag to pan. Fit model resets framing; Scenery distance pulls back. Optional 36 m track guide illustrates scale and separation. Glow, bloom, background and rotation can be toggled individually. Geometry counts in the sidebar exclude the guide and postprocessing.

- [Broken arc](http://127.0.0.1:4187/?asset=ring)
- [Relay crown](http://127.0.0.1:4187/?asset=pylon)
- [Service boom](http://127.0.0.1:4187/?asset=boom)

From the repository root:

```powershell
node node_modules/vite/bin/vite.js build --config art-studies/off-track-dressing-r1/vite.config.js --configLoader native
node node_modules/vite/bin/vite.js preview --config art-studies/off-track-dressing-r1/vite.config.js --configLoader native
```

Port 4187 is strict. Build output stays in this directory's ignored `build/`. The viewer remains isolated; the approved models are now also reused by the game's [sparse scenery placement](../../docs/art/space/off-track-dressing-r1.md).

## Models

`models.js` exposes import-free factories accepting Three.js: `brokenArc(THREE)`, `relayCrown(THREE)`, `serviceBoom(THREE)`, or default `generate(THREE, {kind:'ring'|'pylon'|'boom'})`. Each returns named meshes in a group. Metres, Y up, base Y=0, centered X/Z. `userData.dimensions` contains exact transformed-vertex dimensions; `originOffset` records centering. Ring `apertureCenter` is in authoring coordinates and must receive `originOffset` when used after centering, as the preview does.

- **Broken arc:** nominal 254 m outer diameter, 216 m inner diameter, 80° opening. Four steel chords, open radial and diagonal webs, alternate armor bays, cyan recessed light strips and two thick amber-lit terminals. Aperture is six times the 36 m guide width. Placement should preserve that generous clearance; this preview does not approve actual course clearance.
- **Relay crown:** approximately 134 m high, three raised prongs and a central lit cage, six service pipes, three stepped armor collars and a tapered lower counterweight. Lights use segmented lenses rather than a continuous glowing body.
- **Service boom:** approximately 146 m wide and 51 m high. Nine open truss bays, armored roof, cyan lower rails, amber markers, end vents and one support mast. No suspended pods or cylinders beneath the arm.

Geometry uses boxes, modest 8–24-sided cylinders and annular extrusions with low curve segmentation. Broad details carry the forms; no hidden fastener forests or imported meshes/textures in the model factories. Each model shares seven materials internally. The preview bakes transforms and merges each material into one indexed mesh, welding unindexed annular sectors while preserving normal/UV seams. Future placement should reuse batched geometry/materials rather than call the factories per instance.

Lighting uses MeshStandardMaterial emissive lenses (cyan 3.4, amber 2.8) and threshold bloom, following the game's rendering approach. No point lights, shadow maps, animated shaders or transparent per-lens halos are added to the models. The standalone viewer uses one static warm/cool PMREM reflection capture and a reused existing space image for the backdrop. Bloom falls back to direct emissive rendering if HDR color buffers are unavailable.

## Delivery status

### Detail revision 2

User approved the three overall models and requested a little more detail. Added shallow service vents, panel seams and locks to selected ring armor bays, short paired conduits with clamps inside alternate open bays, and large terminal fasteners. The pylon gains pipe coupling sleeves, spine and crown cooling panels, collar latches and core retainers. The boom gains roof vents, truss joint plates, light-end bezels, collar catches and crosshead vents. Its underside remains free of hanging pods.

These are bounded secondary geometry additions using the same seven materials, so material batch count and model light count are unchanged. Ring aperture, main proportions and light intensity remain unchanged. Factory `userData.revision` is now 2; folder and import paths remain stable. Source review and isolated rebuild only; user visual review is pending.

Source review and isolated production build completed. Vite reports the Three.js/postprocessing viewer bundle above its default 500 kB advisory. Tests, simulation checks, browser inspection and visual playtesting were not performed, per the user-owned testing instruction. The user subsequently approved the models and authorized sparse level placement; see the linked integration notes for current behavior.
