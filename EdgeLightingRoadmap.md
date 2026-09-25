# Roadside lighting — roadmap

## Goal

Add a simple repeatable module carrying illuminated dashes between the road and side-wall foot, and recessed light cassettes on the existing wall frames. Use steady pearl/cool-white light distinct from phase colors. Preserve the recent reduction in frontal glare.

## Scope

The user explicitly requested implementation, including the new module and small wall changes. Keep track collision width, obstacles, gaps, phase rules and driving behavior unchanged. The user owns testing; agents review source and build only.

## Phases

### Phase 1 — Procedural light assets

**Implementation checklist**

- [x] Add a 12.5 m edge module with a dark housing, thin trim and two luminous dashes.
- [x] Add reusable recessed lamps for existing R3 wall variants, including their tapered ends.

**Verification checklist**

- [x] Source review: matching repeat pitch, recessed emitters, stable material names and no external assets.
- [ ] User: approve module proportions and light placement.

### Phase 2 — Course and library integration

**Implementation checklist**

- [x] `campaign-kit.js`: install modules beside existing wall runs, moving wall housings outward to make room.
- [x] `detailed-kit.js` / `mixed-kit.js`: share the illuminated wall treatment and module mounting with review assemblies.
- [x] `review-assets.js`: expose standalone illuminated/unlit module and a combined wall sample.

**Verification checklist**

- [x] Source review: follow course deformation and existing encounter/gap exclusions; preserve worker transfer and batching.
- [ ] User: inspect joins, curves, ramp ends and gameplay readability.

### Phase 3 — Build and deliver

**Implementation checklist**

- [x] Record module dimensions, integration and glow behavior in `docs/art/track/roadside-lighting-r1.md`.
- [x] Build the playable preview.

**Verification checklist**

- [x] Production build completes; no tests or gameplay inspection performed.
- [ ] User: evaluate glow in Rich/Light modes and provide any desired intensity adjustment.
