# Approved track library and procedural level handoff

Implementation update, 2026-09-25: the existing campaign now has a library renderer adapter. See [campaign integration delivery](art/track/campaign-library-integration.md) for scope and limitations. The snapshot and proposed combined-course architecture below describe the handoff before this integration; the editor/generator remain proposals.

Snapshot: 2026-09-25. User approved the current delivered assets in phases **01–13**: “all the phases except 14 are done.” Phase **14 is deferred**, with interest in returning to landmarks later. Phase **15 has a documentation handoff; the combined course and campaign integration remain to be built**.

This document records the existing code and proposes the next implementation. Proposed interfaces below are not implemented APIs. The latest approval ledger in [TRACK_MODULE_WORKLIST.md](TRACK_MODULE_WORKLIST.md) supersedes historical “awaiting review” wording in earlier delivery notes.

## Start here

- Work in `game/`. `recipe/` is the separate official tooling checkout. Read [AGENTS.md](../AGENTS.md) before making changes.
- **The user owns testing. Do not create or run tests, browser smoke checks, gameplay screenshots, or visual review loops without explicit new authorization.** Source review and rebuilding the playable preview are allowed. Deliver a playable result for the user to assess.
- Target `racer.html` and `src/racer/`. The `index.html` application has other gameplay systems; do not assume it uses this track renderer.
- Individual assets: `library.html`, implemented in `src/library/main.js` and `src/library/review-assets.js`. Category courses: `racer.html?review=01` through `review=13`, with category-specific options.
- The current local preview uses port **4174**. A future session should check its availability; the port is not a permanent service guarantee. Build with `npm run build`; if needed start `npm run preview -- --port 4174` from `game/`.
- Latest local commit at this snapshot: `cda7883`, containing approved slabs and earlier stages. Later assets and integration changes are present in the working tree, including untracked source files. Preserve them. A clean checkout of that commit alone is **not** this complete library.

**Recommended first deliverable:** one deterministic, editable construction course that goes flat → outside → flat → inside → flat and uses every approved asset family. Feed both physics and rendering from its data. Let the user iterate that course before adding random encounter selection or expanding the art library.

## Approved visual language

Graphite brushed metal slabs, ivory structural plates, steel recesses and restrained brass fittings form the base. Large plates and deliberate structural intervals provide readability; small recesses, fasteners, louvers and optical details support them. Use the approved roughness/normal maps and reflection environment rather than returning to plain flat-shaded slabs.

Mechanical detail can extend **into** the driving surface because the ship hovers. Keep safe hardware below the driving skin; obstacles are the explicit exception. Cut actual apertures through all covering layers so details are visible. The earlier white-plate z-fighting was corrected through geometry separation and real openings, not overlapping coplanar skins.

Phase colors identify gameplay requirements: ION cyan, SOL amber, FLUX violet. Preserve independent material ownership for dynamically colored stations. Neutral construction and obstacles use pearl-white lights. Checkpoints deliberately have a **white gameplay curtain**, broad ivory/graphite checkers, recessed circular instruments and lamp cassettes. No letters or numbers on checkpoint geometry. Do not replace them with an uncolored copy of the phase emitter.

The user repeatedly enlarged features because they passed too quickly. Preserve these approved travel footprints:

| Feature | Along-track footprint |
| --- | --- |
| Tube service belt | 12 m |
| Gap takeoff / landing apron | 12 m each |
| Phase emitter station | 24 m: 15 m before crossing, 9 m after |
| Checkpoint station | 30 m: 15 m on each side |

Do not add invisible interiors or detailed undersides. Exposed gaps need their approved end treatment: opaque outer-tube caps and thick inner-tube collars. Full-height bay connectors join adjacent families; tapered ramp caps terminate exposed runs. Do not place ramp caps at every chunk boundary.

## Library inventory and entry points

Files under `public/assets/track/` are procedural JavaScript mesh factories, normally receiving `THREE` and returning a `Group`; this is not a folder of exported GLB meshes. Runtime kit files assemble and place those factories. Read the actual module before assuming its options or origin.

| Phases | Approved asset family | Runtime entry point | Source / delivery |
| --- | --- | --- | --- |
| 01–04 | Detailed raised frame, pipe, grille and cover families; corrected ramp ends | `src/racer/detailed-kit.js`: `detailedKit`; `mixed-kit.js`: `mountDetailedBay` | `raised-*-r3.js`; [R3 delivery](art/track/01-04-detailed-r3.md) |
| 05 | Mixed bay runs, shared spacing and family connections | `mixed-kit.js`: `expandRuns`, `mixedBayAt`, `addMixedBays` | [05–06 delivery](art/track/05-06-mixed-lanes-r1.md) |
| 06 | Phase lane start / middle / end and neutral edge markers | `lane-kit.js`; `phase-lane-r1.js` factory | [05–06 delivery](art/track/05-06-mixed-lanes-r1.md) |
| 07–08 | Outer / inner tube skins, service belts and approved brushed slabs | `tube-kit.js`: `tubeAssembly`, `tubeChunk`; `slab-kit.js`: `slabAssembly`, `slabChunk`, `applySlabEnvironment` | `slab-surface-r1.js`, `tube-surface-r1.js`, `tube-service-belt-r2.js`; [slabs](art/track/slab-candidate-r1.md), [service variations](art/track/07-08-service-variations-r2.md) |
| 09–10 | Flat ↔ outside and flat ↔ inside transitions | `transition-profile.js`; `transition-kit.js`: `transitionAssembly`, `transitionChunk` | [Transition delivery](art/track/09-10-transitions-r1.md) |
| 11 | Full / partial gaps, lit takeoff chevrons, landing strips, borders, tube terminations | `gap-kit.js`: `gapEnd`, `gapAssembly`, `gapChunk`; `gap-geometry.js` | `gap-edge-r1.js`, `gap-surface-r2.js`, `gap-border-r1.js`, `tube-gap-termination-r1.js`; [complete R3 set](art/track/11-complete-gap-set-r3.md) |
| 12 | W4 repeatable buttressed walls | `wall-kit.js`: `wallAssembly`, `wallObstacle`, `conformWallParts`, `mergeWallParts` | `buttressed-wall-r1.js` contains the approved R2 refinement; [walls](art/track/12-walls-r1.md) |
| 12 | P3 service passage with wall infill | `passage-kit.js`: `passageAssembly`, `passageObstacle` | `service-passage-r1.js`; [passages](art/track/12-passages-r1.md) |
| 12 | F1/F2 recessed phase emitter stations | `phase-emitter-kit.js`: `emitterAssembly`, `emitterGate`, `emitterCutRanges`, `setEmitterColor` | `phase-emitter-r1.js`; [emitters](art/track/12-phase-emitters-r1.md) |
| 12 | J3 low barrier, opening-only, jump-or-opening, jump-only | `obstacle-kit.js`: `barrierAssembly`, `obstacleAssembly`, `modeledObstacle` | `jump-barrier-r1.js`; [assemblies](art/track/12-obstacle-assemblies-r1.md) |
| 13 | C1/C2 checkered checkpoint, circular optics and white curtain | `checkpoint-kit.js`: `checkpointAssembly`, `checkpointStation`, `checkpointCutRanges` | `checkpoint-r1.js`; [checkpoints](art/track/13-checkpoints-r1.md) |

Use current source plus delivery notes, not the filename suffix alone. Some filenames stayed at `r1` while their content was revised. R1 shallow bays, intermediate R2 housings, early gap studies and the original G2 upright phase fins are historical alternatives; they are not the current defaults. Keep reference/history files rather than silently deleting them.

## Coordinates, dimensions and attachment rules

| Contract | Current implementation |
| --- | --- |
| Units / travel | Metres; station `s` increases forward. Straight-road world Z is `-s`. |
| Road cross-section | Flat width 36 m. Tubes radius 18 m; unwrapped circumference `2 * Math.PI * 18`. |
| Lateral coordinate | `u` is normalized against section half-width. Closed tubes wrap with period 2. A full physical width W becomes normalized half-width `W / (2 * halfWidth)`. |
| Surface frame | `track.js`: `section(s)`, `point(s,u)`, `frame(s,u)`. Use frame normal for height/depth; global Y is not the surface normal on tubes. |
| Curl sign | Outside `-1`, inside `+1`, flat `0`; cross-section curvature is curl / 18. |
| Lane width | Standard physical width 6.48 m on all shapes. Preserve physical width through a transition. |
| Bay repeat | Detailed source repeat axis is local X, source pitch 12 m; mixed kit mounts at 12.5 m. Use its mounting helper, not a generic Z-only placement assumption. |
| Wall / passage | Wall bay nominal width 4.5 m, height 7 m, depth 5 m. Passage clear height 3.5 m. |
| Low obstacle | Jump barrier height 2.4 m; compact jump-or-opening total height 4.2 m, clear opening height 3.5 m. |
| Chunking | Current road generation normally uses 100 m chunks. Features and run boundaries must use global station coordinates. |

For constant curl, the existing wrap maps unwrapped lateral X to `(sin(k*x)/k, (1-cos(k*x))/k)`, keeping longitudinal Z. This is sufficient for straight tube sections. It is **not** a general placement function for bent centerlines or changing curl. Extend a shared sampler so visuals and physics agree; do not move already-wrapped models along a curved course by Z translation alone.

The current helpers are not a universal socket schema. The next registry should explicitly describe each asset's source axis, crossing origin, travel bounds, lateral bounds, surface support, collider preset, cutout footprint and end rules. Keep crossing plane `s` separate from the front and rear mesh bounds.

Surface ownership matters: generate one base surface, reserve apertures for stations and gaps, cut every affected slab/marking/service layer, then install the corresponding module. Do not overlay a complete `tubeAssembly` skin on a `slabAssembly` skin. Native radial tube caps/collars must not be wrapped a second time.

For curved details, subdivide broad faces before deforming. Keep rigid fittings tangent to the surface and connect them with articulated sleeves where necessary. The corrected R3 ramps derive beam and panel splits from the same taper intervals; do not regress to straight chords across profile changes.

## What is integrated today, and what is still demo-specific

`levels.js` configures authored campaign levels and category review courses. `track.js` owns track sampling and exported gameplay arrays. `view.js` builds their visual representation; `main.js` controls progression and review UI. `obstacles.js` and `jumps.js` own collision/jump rules.

The category review flags select most of the new detailed rendering. **The ordinary campaign does not yet consistently use the approved library**: it retains fallback road, gate, obstacle and finish visuals. A working category URL is not evidence that the same asset appears in campaign levels.

The all-surface phase 12 and 13 demos switch between separate courses by disposing and rebuilding `RaceView`. They are not one connected flat/tube course. Existing campaign progression also rebuilds between levels. There is currently no general seeded course generator or reusable course-definition loader.

### Adapter work that must not be missed

| Area | Current limitation | Needed before general placement |
| --- | --- | --- |
| Course profiles | `track.js` has named profiles; 09/10 use authored transition tables. | Compile segment definitions into one shared sampling profile, preserving continuous positions and frames at joins. Outside → inside goes through flat. |
| Transition assemblies | `transitionAssembly` uses category-specific services and lane paths. | Accept the compiled course sampler and feature list rather than choosing an entire canned category layout. |
| Gaps | `gapAssembly({start,end,shape})` crops the fixed review course; `start/end` are **not arbitrary gap endpoints**. It calls `gapReviewGaps`. | Accept actual gap entities, apron/collar ownership and shared cut masks. Preserve full/partial and tube seam behavior. |
| Phase emitters | `emitterGate` sizes from `gate.width` but does not place at `gate.center`; `emitterCutRanges` reserves full-width station strips. | First combined course can use centered full-width gates. Offset/partial stations need matching lateral placement and rectangular masks. |
| Checkpoints | `checkpointStation` and `checkpointCutRanges` are fixed at station 350. | Parameterize station positions; add checkpoint entities distinct from lethal phase gates. |
| Obstacle dimensions | `modeledObstacle` selects compact passages by exact `height === 4.2`; the P3 model otherwise uses 7 m. Existing campaign holes can be 9 m. | Select supported collider/model presets explicitly or parameterize both together. Never silently pair a 9 m collision wall with 7 m art. Use `wallObstacle` for solid walls. |
| Lane width | Gameplay accepts `widthMeters`; several mesh assemblers still derive width from normalized `strip.width`. | Normalize physical width in the compiler and make every consumer use the same result. |
| Curve support | Constant-shape wrappers are not arbitrary centerline deformation. | Initially keep stations, gaps and obstacles on constant-shape sections; only place on transitions after a matching surface adapter exists. |

`configureLevel` updates `GATES`, `STRIPS`, `OBSTACLES`, `GAPS` and `PHASE_CHAINS` by splicing the existing arrays. Imported consumers rely on those identities. Preserve that contract in an initial adapter, or migrate all consumers deliberately. The module also snapshots authored arrays with `structuredClone`; injecting generated data into only one consumer will not replace those snapshots.

Obstacle widths and centers are normalized lateral values. `kind:'hole'` means the wall around an opening, not a road gap; `kind:'wall'` means a solid lateral span. Current `kind:'jump'` collision spans the whole road, regardless of center/width. Collision also accounts for ship clearance, tube geometry and travel depth: do not infer collision from visible mesh bounds alone.

The 75 m full/partial review gaps and 18 m partial opening are approved examples, not a universal jump guarantee. Jump timing, speed, boost and approach state affect reach. Use encounter presets with deliberate recovery space; leave playability assessment to the user.

Checkpoint review currently refills boost and shows confirmation on crossing without stopping the ship. It does not implement new campaign respawn/save behavior. Decide those semantics explicitly during integration rather than copying the review-only event or routing it through phase matching.

## Proposed level-building architecture

Use four small layers, with plain data at the boundary:

1. **Course definition:** schema version, seed, ordered surface segments, explicit feature placements and decorative runs. Serializable, stable IDs, independent of Three.js objects. Store authoring dimensions in metres and convert once at the runtime boundary.
2. **Course compiler:** resolve segment-local stations, construct the common surface sampler, produce gameplay arrays and render placements, calculate occupied footprints and cut masks. Report unsupported placements clearly instead of silently falling back to placeholder art.
3. **Asset registry / renderer:** choose approved factories, deform or mount geometry, own materials and chunk visibility. Render from the same compiled entities that physics uses. Generation and gameplay must not independently randomize choices.
4. **Iteration controls:** select a preset, edit/save/load its JSON, regenerate with the same seed, choose a new seed, retry, and start at a chosen encounter with explicit initial speed/phase. Add sliders only where their effect is clear.

Illustrative authoring fragment — **design proposal, not valid input to the current game**:

```json
{
  "schemaVersion": 1,
  "id": "combined-library-course",
  "seed": 404,
  "segments": [
    { "id": "flat-a", "type": "flat", "lengthMeters": 1000 },
    { "id": "curl-out", "type": "transition", "from": "flat", "to": "outside", "lengthMeters": 400 },
    { "id": "outside-a", "type": "outside", "lengthMeters": 1000 },
    { "id": "uncurl-out", "type": "transition", "from": "outside", "to": "flat", "lengthMeters": 400 },
    { "id": "flat-b", "type": "flat", "lengthMeters": 500 },
    { "id": "curl-in", "type": "transition", "from": "flat", "to": "inside", "lengthMeters": 400 },
    { "id": "inside-a", "type": "inside", "lengthMeters": 1000 },
    { "id": "uncurl-in", "type": "transition", "from": "inside", "to": "flat", "lengthMeters": 400 },
    { "id": "finish", "type": "flat", "lengthMeters": 500 }
  ],
  "features": [
    { "id": "gate-a", "type": "phase-gate", "segment": "flat-a", "atMeters": 350, "span": "full", "phase": 0 },
    { "id": "timing-a", "type": "checkpoint", "segment": "outside-a", "atMeters": 500 }
  ]
}
```

This fragment illustrates addressing and units; it is not the complete encounter layout or an approved difficulty preset. Segment lengths must be adjusted through user feedback. Expand it with all approved families, spaced encounters and lane guidance for the first combined course.

Keep collision obstacles, phase interactions and road gaps as distinct feature types. Decorations reference explicit intervals and allowed variants. Record a generator version as well as a seed once random generation exists. Derive independent random streams for geometry layout, encounters and decoration from stable IDs, so changing a service-bay variant does not move every obstacle.

Before introducing free random placement, define a small set of authored encounter templates: opening-only, jump-or-opening, jump-only, phase change with approach lane, full gap, partial gap and recovery/checkpoint. Each specifies supported surfaces, required approach/recovery, lane/phase state and occupied bounds. Difficulty can then vary spacing, repetition and combinations while keeping a readable route. Compare spacing in travel time at intended cruise/turbo states, not only metres.

A useful first editor is a small panel in the existing racer, not a separate level-editor application. Prioritize same-seed regeneration, JSON persistence, a feature list with jump-to controls, and the existing review-only `T` quarter-speed / `R` retry behavior. Quarter speed scales simulation time, preserving trajectories; do not implement it by changing only ship velocity. A collision overlay should be an optional user tool, not automatically shown over the art.

## Rendering cost and lifetime

The user observed a loading delay and frame hitch in the phase-gate demos and deferred optimization. This is a real reported symptom. The following are source-based investigation targets, not measured diagnoses:

- Course switching rebuilds detailed geometry synchronously. Avoid rebuilding the entire course for a phase-color edit or UI-only change. Keep the renderer alive where practical and prepare chunks in bounded work ahead of travel.
- Many helpers merge meshes by material. That reduces calls but is not instancing. Cache immutable canonical geometry for repeated rigid parts; clone before destructive deformation or cutting. `conformWallParts`, gap cutting and wrapping bake transforms into geometry.
- `mergeWallParts` groups by material name and disposes source geometry/materials. Do not merge independently colored gates into one shared mutable material. `setEmitterColor` uses materials marked `userData.phaseTint`; station phase is independent of the player's selected phase.
- Slab maps are cached, while view disposal traverses texture resources. Establish explicit shared-resource ownership before introducing cross-view caches; otherwise one view may dispose resources used by another. Keep PMREM/environment lifetime tied to its renderer.
- Existing culling uses approximate station windows: road chunks −180/+760 m, gates −30/+730 m, walls −40/+730 m, gap markers −50/+730 m around travel. Replace point-only assumptions with feature bounds for extended stations, aprons and collars.
- Start with one base road surface and cutouts. Hidden duplicate skins, repeated per-chunk end caps, and machinery buried under stations add cost and can cause artifacts.

Do not promise a frame-rate target from a successful build. Profiling or automated checks require authorization under the standing testing instruction; user feedback can guide the first integration pass.

## Suggested implementation order and delivery boundary

1. Introduce the plain course definition and shared compiler without changing collision dimensions. Keep the category demos accessible as reference pages.
2. Remove review-only assumptions from the required kit adapters. Use constant-shape placements first; retain approved 09/10 transitions for connecting them through a shared profile.
3. Build the single combined course with every family, including service variants, all obstacle types, lanes, both gap types and neutral checkpoints. Use one feature list for physics, guidance, cuts and art.
4. Add the minimal iteration controls and JSON save/load. Deliver a direct playable URL for user feedback. Resolve combined-course integration defects before multiplying random layouts.
5. Add deterministic encounter variation, then improve build time and runtime cost based on the user's feedback and any separately authorized measurements.

Completion of this handoff does **not** mean the combined course, procedural generator, main-campaign replacement, performance pass or official verification has happened. Phase 14 stays deferred and can be added later as optional decoration without changing course gameplay data.

The project's [jam requirements record](JAM.md) and `recipe/` tooling are the starting points for a separately authorized submission/compliance pass. Historical build results, visual approvals and unrelated checks in `docs/VALIDATION.md` do not establish current official asset or final gate compliance. No official verification was performed for this handoff, and current external requirements were not rechecked.

## Review references for the user

- [Asset library](http://127.0.0.1:4174/library.html)
- [Outside transition](http://127.0.0.1:4174/racer.html?review=09) and [inside transition](http://127.0.0.1:4174/racer.html?review=10)
- [Gaps](http://127.0.0.1:4174/racer.html?review=11&shape=outside)
- [Phase gates](http://127.0.0.1:4174/racer.html?review=12&element=gates&shape=flat)
- [Checkpoints](http://127.0.0.1:4174/racer.html?review=13&shape=flat)

These URLs depend on the local preview and are category references, not a delivered combined-course link.

## Copyable next-agent brief

Read `AGENTS.md`, `docs/TRACK_LIBRARY_HANDOFF.md` and the current worklist. Phases 01–13 are approved; phase 14 is deferred. Build an editable deterministic combined course using the approved factories, with flat → outside → flat → inside → flat, all asset families and shared physics/render placement data. First remove documented demo-only placement assumptions; preserve collision dimensions and the approved art/feature lengths. Keep category review pages available. Add a small same-seed/retry/encounter selection and JSON iteration workflow before general randomized generation. Preserve existing working-tree changes. Rebuild and deliver the playable URL to the user; do not create/run tests or visually inspect gameplay without explicit authorization.
