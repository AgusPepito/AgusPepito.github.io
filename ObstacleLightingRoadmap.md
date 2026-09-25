# Obstacle lighting — roadmap

## Goal
Make jump barriers and blocking walls communicate their action through integrated white symbols and red obstruction boundaries, with a shared route and speed-aware jump cue.

## Assumptions
- Preserve collision volumes and controls. White means action; red means solid obstruction. Phase colours retain their existing meaning.
- Source review and rebuilding are allowed; the user owns all testing and visual review.

## Phases

### Phase 1 — Asset signals
**Implementation checklist**
- [x] Add broad upward chevrons and a top rail to `jump-barrier-r1.js`.
- [x] Add boundary brackets and directional displays to blocking wall assemblies, keeping passage infill free of bypass arrows.
- [x] Preserve signal shader settings through worker transfer and module instancing.

**Verification checklist**
- [x] Review mounting depths, curvature, batching and material serialization in source.

### Phase 2 — Action guidance
**Implementation checklist**
- [x] Share a stable, clearance-aware wall exit between road guidance and asset signals.
- [x] Add a conservative barrier takeoff window from the existing jump trajectory and speed model.
- [x] Animate only the active obstacle, support pause/restart and reduced motion, and show the signals in the asset library.

**Verification checklist**
- [x] Review cue calculations against collision dimensions and movement source; do not run tests.

### Phase 3 — Delivery
**Implementation checklist**
- [x] Document the light vocabulary and user review links.

**Verification checklist**
- [x] Rebuild the preview and deliver it for user testing. `npm.cmd run build -- --configLoader native` passed; the existing shared-chunk size warning remains. No tests or visual playtesting were run.
