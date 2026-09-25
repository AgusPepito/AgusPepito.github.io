# Phase Racer visual style — roadmap

## Goal

Develop the supplied concepts into a readable orbital racer: convincing metal and painted armor, a consistent sun and planet light, bright controlled energy effects, a large planetary backdrop, and deliberate station/asteroid compositions. Recommended baseline: image 3 for everyday gameplay, image 1 for lighting and thrust, image 2 for tube-road scale, and image 4 for occasional landmark sections.

## Assumptions

- Originally a proposed plan. On 2026-09-25 the user authorized lighting/rendering, VFX, materials and background changes that do not require revising asset meshes. Implementation details are recorded in `docs/art/visual-style-r1.md`; mesh authoring remains deferred and all visual checks remain user-owned.
- Preserve handling, collision dimensions, phase colors/symbols, and course layout. Cyan, amber and violet continue to communicate gameplay; decorative lights stay subordinate.
- Laptop/mobile remain targets. Quality tiers are proposed; their cost and final settings require user measurements. No performance gains or screenshot-level fidelity are promised.
- Follow the repository's procedural asset/recipe workflow for mesh revisions and record new external/generated texture sources. Existing approved assets are starting points.
- The user owns all testing and visual approval under `AGENTS.md`. Agents may review source and build the preview, but must not create/run tests, simulations, browser checks, or visual review loops. All manual checks below are for the user.

## Current implementation

| Area | Source finding | Implication |
| --- | --- | --- |
| Rendering | `src/racer/view.js` uses direct rendering, sRGB output, multiple fill lights, and no explicit tone mapping. | Establish exposure and lighting before tuning glow or surface colors. |
| Reflections | `src/racer/slab-kit.js::applySlabEnvironment` creates a static softbox environment only for materials tagged `slabFinish`. | The ship and other hardware need a coherent reflection environment too. |
| Surfaces | `public/assets/track/slab-surface-r1.js` already has procedural normal/roughness maps and multiple finishes. | Improve the existing surface system rather than adding a duplicate. |
| Meshes | Procedural ship/track detail, indexed batching and instancing already exist. | Concentrate new geometry on silhouettes, bevels and visible recesses. |
| Effects | `ship-kit.js` uses cone exhausts and additive halos; `view.js` drives their scale/color and existing speed effects. | Layered plumes and persistent trails offer a concrete upgrade. |
| Background | `space-sky.js` maps a perspective image onto a curved panel; `view.js` keeps it aligned to the camera. `space-scenery.js` already places instanced rocks and shared ring stations. | Separate sky layers for orientation/depth; refine existing scenery composition. |

## Definition of done

- The user approves a consistent look on flat roads, outside tubes and inside tubes, including all three phases.
- Ship, road and hardware respond coherently to lighting, with readable openings, gap edges and phase symbols.
- Boost, phase changes and surface contact have distinct visual feedback.
- Planet, star field and scenery establish scale without obscuring upcoming hazards.
- User measurements support the selected laptop/mobile quality presets and loading behavior.

## Out of scope

- New mechanics, course redesign, automatic camera/handling changes, or a complete asset replacement.
- Initial reliance on screen-space reflections, full-scene dynamic shadows, depth of field, full-screen motion blur, or dense particle fields. These would require separate justification and user performance feedback.

## Phases

### Phase 1 — Calibrate lighting and exposure

**Deliverable:** One lighting configuration with a clear key direction and useful shadow-side detail.

**Implementation checklist**

- [ ] In `src/racer/view.js`, explicitly set tone mapping and exposure; start with ACES filmic as a candidate and retain phase-color identity while tuning emission.
- [ ] Rebalance the current hemisphere, ambient and directional lights into a slightly warm sun and restrained cool planet fill. Keep inside-tube illumination adjustable without making every surface equally bright.
- [ ] Store the sun direction for later use by the planet and visible sun. Reduce foreground fog only alongside a plan to conceal the existing track draw-distance cutoff.

**Verification checklist**

- [ ] Agent: source review and production build only; confirm the implementation leaves simulation and collision code unchanged.
- [ ] User: compare a flat, outside-tube and inside-tube section; approve hull highlights, dark recesses and all three gate colors.

### Phase 2 — Unify reflections and material finishes

**Deliverable:** Ship, road and roadside hardware belong to the same lighting environment.

**Implementation checklist**

- [ ] Generalize the cached environment in `slab-kit.js` into a shared scene reflection source: broad planet light, dark space and restrained bright accents. Remove or retune slab-specific overrides deliberately; reuse/dispose the environment with the retained renderer.
- [ ] Establish a small material palette: painted ivory armor, exposed alloy, graphite road, dark rubber/recesses, canopy and energy. Use low metalness for paint and high metalness for exposed metal; avoid uniform intermediate settings.
- [ ] Tune road roughness variation before lowering its overall roughness. Starting candidates: paint roughly 0.4–0.6, alloy 0.2–0.4, road 0.35–0.6; these are art-tuning ranges, not final values. Keep polish localized and joints matte.
- [ ] Extend existing procedural maps for broad wear and fine grain. Before adding atlases/AO/emissive maps, extend `asset-transfer.js` to restore textures by resource identity: it currently accepts only slab normal/roughness slots and reconstructs both from `surfaceMaps()`.

**Verification checklist**

- [ ] Agent: source review/build; check newly streamed materials get the same resources and shared maps survive level transitions.
- [ ] User: approve a sample ship, road tile and barrier together; confirm metal, paint and recesses remain visibly distinct under different track orientations.

### Phase 3 — Add controlled bloom and a rendering quality option

**Deliverable:** Energy feels luminous while track detail and symbols remain sharp.

**Implementation checklist**

- [ ] Introduce an HDR composer in `view.js`: scene render, luminance-threshold bloom, then `OutputPass` for tone mapping/output conversion. Retune emissive values so chosen energy sources cross the threshold and ordinary white paint generally does not.
- [ ] Start with reduced-resolution bloom. Keep phase symbols and hazard openings readable; do not expand every bright edge into a large halo.
- [ ] Provide antialiasing for the offscreen render path; canvas `antialias: true` alone does not cover composer targets. Select supported target MSAA or a suitable postprocess fallback.
- [ ] Handle resize, renderer reuse, warmup and disposal of targets/passes. Account for all render passes in `performance-panel.js` rather than reporting only the last pass.
- [ ] Add a lightweight preset with no bloom and existing/local halos, plus a richer preset. Explicitly handle the backdrop's color response: `toneMapped: false` on its material does not exempt a finished scene texture from the final output pass.

**Verification checklist**

- [ ] Agent: source review/build, including resize/disposal and output-conversion paths.
- [ ] User: compare quality settings, readability and performance on laptop/mobile; inspect thin rail edges, distant markings and phase colors during boost.

### Phase 4 — Separate planet, stars and sun

**Deliverable:** A composed orbital sky with consistent orientation and planetary scale.

**Implementation checklist**

- [ ] Replace the single perspective panel in `space-sky.js` with separate star/nebula and planet layers. Use a proper panoramic star asset; do not stretch the existing perspective artwork into a panorama.
- [ ] Make the star field translation-free but world-oriented. Give the planet its own large distant placement, day/night boundary, cloud detail and thin atmospheric rim; align its illumination with the scene sun. Significant planet translation parallax is unnecessary at orbital scale.
- [ ] Use image 3's large planet as a proposed composition target. Keep the road vanishing point clear and the central star density quieter than the image edges. Preserve a lightweight texture-based option.
- [ ] Add a small sun halo/flare only when the sun is visible; suppress it when occluded by track or structures. Use selective bright stars and a faint dust band rather than uniform star noise.
- [ ] Record texture provenance and download sizes. Keep new sphere/atmosphere geometry within the project's procedural asset workflow.

**Verification checklist**

- [ ] Agent: source review/build; check asset URLs, sky depth behavior and retained-resource ownership.
- [ ] User: approve planet scale, portrait cropping, tube-roll orientation and obstacle readability. This intentionally changes the existing camera-following background behavior.

### Phase 5 — Refine one hero mesh and one track module

**Deliverable:** A visible improvement to the ship and a representative roadside module before extending the style.

**Implementation checklist**

- [ ] Revise a candidate from `public/assets/ships/reference-reconstruction.js`: bevel prominent armor edges, deepen nozzle/canopy recesses, and clarify panel overlaps while preserving its silhouette, dimensions and engine anchors.
- [ ] Add a consistent bevel/recess language to one existing roadside family. Add occasional panel labels or service markings; reserve large warning signs for real course information.
- [ ] Keep silhouette-changing detail in geometry; use maps or color variation for tiny seams, wear and fasteners. Preserve smooth normals on rounded parts and hard boundaries on panel breaks.
- [ ] If texturing the ship, author UVs and preserve them through `ship-kit.js`, which currently copies only position/normal attributes. Keep map metadata compatible with the Phase 2 texture registry.
- [ ] Preserve indexing/instancing and use simpler distant variants where justified. Carry successful treatments to other families only after the user approves the sample.

**Verification checklist**

- [ ] Agent: source review/build; confirm unchanged collision envelopes and preserved material/geometry attributes.
- [ ] User: approve visible improvement at the normal chase-camera distance using the existing shipyard/library and the playable preview.

### Phase 6 — Rebuild thrust and trails

**Deliverable:** Exhaust communicates cruise, strip boost and manual boost convincingly.

**Implementation checklist**

- [ ] In `ship-kit.js`, replace the simple cone appearance with a bright narrow core, colored outer plume and soft nozzle halo; use inexpensive procedural meshes/sprites with controlled overlap.
- [ ] Add short history-based ribbons behind each engine, tapering in width and opacity. Keep them in world space so steering leaves a curve; clear them on retry/teleport/level change and freeze them with pause.
- [ ] Drive plume length, width and pulse from existing `race.thrustBlend` and boost state. Preserve the selected phase hue rather than making every phase cyan.
- [ ] Add restrained phase-colored light spill beneath the ship, aligned to the actual road/tube frame and attenuated with jump height. Treat this as an explicit effect: emissive materials alone do not illuminate adjacent geometry.

**Verification checklist**

- [ ] Agent: source review/build; check bounded history buffers and pause/reset lifecycle.
- [ ] User: approve thrust progression, trail behavior in turns/tubes, transparency ordering and reduced-motion behavior.

### Phase 7 — Add contact and phase-event feedback

**Deliverable:** Important actions have distinct, brief effects.

**Implementation checklist**

- [ ] Add a short hull/nozzle pulse on phase changes, a localized passing ripple for a matched gate, and a restrained boost-entry burst.
- [ ] Emit pooled directional sparks on actual edge scrapes and a brief surface-aligned pulse on landing; trigger from gameplay state transitions instead of continuous per-frame bursts.
- [ ] Improve the existing hover blob in `view.js` with a softer contact shape and height-dependent fade. Add restrained cavity shading to mesh recesses; retain readable shadow-side geometry.
- [ ] Gate strong flashes/streaks with reduced motion and effect settings; keep particles out of the obstacle-reading corridor and pause/dispose them with the view.

**Verification checklist**

- [ ] Agent: source review/build; confirm bounded pools and single event activation without simulation changes.
- [ ] User: confirm each effect clearly matches its action and leaves upcoming hazards readable.

### Phase 8 — Compose scenery and landmark sections

**Deliverable:** A few memorable orbital vistas with deliberate empty space between them.

**Implementation checklist**

- [ ] Refine `space-scenery.js` placements into quiet stretches, distant asteroid clouds and occasional station vistas. Reuse current rock/station prototypes; preserve the established course clearance.
- [ ] Add a small number of distinct asteroid silhouettes, with broad crater/fracture forms and subdued surface variation. Use instancing and distant simplification rather than increasing every rock's detail.
- [ ] Give a selected station visible structural hierarchy: ring, supports, docks, restrained windows and solar arrays. Place its silhouette away from the next gate/opening.
- [ ] Propose a rare near-field structure outside the playable envelope for strong parallax; keep current distant placements as the default until the user approves the composition.
- [ ] Check scenery bounds and distance fades against the camera far plane and existing culling. Keep the planet visually distant while stations/rocks provide motion cues.

**Verification checklist**

- [ ] Agent: source review/build; inspect source for geometry reuse, conservative bounds and loading/disposal behavior.
- [ ] User: approve one quiet stretch and one landmark stretch, then provide performance-panel reports before expanding density.

## Deferred rendering options

- A small local sun-shadow region could improve ship/obstacle contact if user performance reports support it. GPU-deformed gates need matching depth/shadow deformation; enabling shadows without that integration would produce mismatched silhouettes. Full-course shadow maps are not the first step.
- Use environment reflections and modest authored light spill first. Reflections of nearby moving objects would require a separate reflection technique; an environment map does not provide them automatically.

## Technical references

- Three.js [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html): environment lighting, roughness/metalness and texture roles.
- Three.js [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html): filtered environment reflections.
- Three.js [UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html): luminance threshold, strength and radius.
- Implementation compatibility was also reviewed against the installed Three.js 0.180.0 renderer, `EffectComposer` and `OutputPass` source. No packages were upgraded.
