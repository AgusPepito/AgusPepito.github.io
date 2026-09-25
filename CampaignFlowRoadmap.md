# Campaign flow — roadmap

## Goal

Make the 24-course campaign turn, roll and combine skills throughout play. Only the first course in an area introduces its new demand; courses two to four immediately reuse earlier mechanics.

## Assumptions

- Keep six areas, four courses each and existing completion IDs.
- Reset the best-time layout revision, preserve unlocks and the pending boost-input fix.
- Use existing obstacles and ship physics. No new meshes or camera effects.
- The user owns all testing. Agent verification is source review and a production build only.

## Phases

### Phase 1 — Shared track motion

**Implementation checklist**

- [x] Add authored bends and banking to `track.js`, including the cached geometry sampler.
- [x] Send the same motion through `levels.js`, snapshots and `campaign-worker.js`.
- [x] Keep gate instancing accurate on banked surfaces and exclude unsupported GPU deformation.

**Tests / verification checklist**

- [x] Review render, collision, camera and worker source paths for a shared track frame.

### Phase 2 — Mixed encounter routes

**Implementation checklist**

- [x] Reauthor `campaign.js` with one introduction per area and mixed demands thereafter.
- [x] Add sustained rotations, reversals, phase passages, jump combinations and earlier tube transitions.
- [x] Retain short checkpoint exits and stable launch/landing corridors; bump layout revision.

**Tests / verification checklist**

- [x] Review encounter order, hint timing, surface transitions and jump spacing in source.
- [x] Review stable completion IDs and updated best-time revision wiring.

### Phase 3 — Delivery

**Implementation checklist**

- [x] Update `docs/CAMPAIGN_AREAS.md` to describe the revised progression.

**Tests / verification checklist**

- [x] Rebuild the playable preview with `npm.cmd run build -- --configLoader native`.
- [x] Leave gameplay and visual evaluation to the user; do not run tests or simulations.

## Delivery

Production build passed with 209 modules. The existing shared Three.js chunk-size warning remains. Source review covered shared track motion, gate repetition, gap caps, encounter spacing, progression IDs and best-time revision. No tests, simulations or gameplay/visual inspection were performed.
