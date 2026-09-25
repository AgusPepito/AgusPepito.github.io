# Phase wall VFX — roadmap

## Goal
Give phase walls a taller, legible silhouette, animated projector streams and a local crossing response while preserving visibility through the field.

## Assumptions
- The user owns testing. Source review and a production build are the only agent verification.
- Keep phase colours, collision rules and recessed emitter hardware unchanged.
- Use an 11 m field on open/exterior road, tapering to 9 m inside tubes.

## Phases

### Phase 1 — Field silhouette and flow
**Implementation checklist**
- [x] Replace the static fade in `public/assets/track/phase-emitter-r1.js` with a shared procedural field shader: visible upper edge, projector-aligned streams and phase-specific motion.
- [x] Preserve the effect through campaign worker transfer and curved/tube assemblies.

**Verification checklist**
- [x] Review UV preservation, material serialization and tube clearance in source.

### Phase 2 — Crossing response and lifecycle
**Implementation checklist**
- [x] Animate cached field materials in `RaceView`, including a matching-pass ripple and a temporary local opening.
- [x] Handle pause, restart, driving mode, closed tube seams and reduced motion.
- [x] Animate the same effect in the asset library.

**Verification checklist**
- [x] Review event conditions against existing gate overlap rules and check disposal ownership in source.

### Phase 3 — Delivery
**Implementation checklist**
- [x] Document the effect and its tuning parameters.

**Verification checklist**
- [x] Build the playable preview without running tests or inspecting gameplay. `npm.cmd run build -- --configLoader native` passed; existing shared-chunk size warning remains.
- [x] Deliver the local URL for user testing; appearance remains user-reviewed.
