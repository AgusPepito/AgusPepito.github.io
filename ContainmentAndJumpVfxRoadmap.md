# Road containment and jump feedback — roadmap

## Goal

Explain the existing road-edge constraint with translucent fields wherever side walls are absent, and give jumps clear launch, flight and landing effects. Use glowing shapes only, with no text on the fields.

## Assumptions

- Procedural opacity patterns suit the existing shader/worker pipeline; no raster asset is required.
- Preserve collision, steering, jump height and difficulty.
- Fields follow banked road edges, stop at real gaps and disappear as the road becomes a closed tube.
- Agent verification is source review and a build. The user owns testing and visual evaluation.

## Phase 1 — Exposed-edge fields

**Implementation checklist**

- [x] Generate lightweight field planes from the same wall layout as `campaign-kit.js`.
- [x] Add translucent chevrons, shield shapes, edge light and a localized contact ripple.
- [x] Integrate worker material restoration and runtime updates into `RaceView`.

**Tests / verification checklist**

- [x] Review wall/gap/closed-tube exclusion and shared track-frame placement in source.
- [x] Review material transfer, fog, depth, culling and reduced-motion behavior.

## Phase 2 — Jump feedback

**Implementation checklist**

- [x] Add launch jets and an energy ring, persistent airborne trails and a landing burst.
- [x] Trigger from accepted jumps/landings, including edge-grace jumps; avoid effects on falls and resets.
- [x] Keep effects bounded and readable in Light graphics and reduced motion.

**Tests / verification checklist**

- [x] Review effect event handling, pause/reset behavior, pooling and resource disposal.
- [x] Build with `npm.cmd run build -- --configLoader native`; run no tests or gameplay inspections.

## Feedback iteration — hazard language and jump finish

**Implementation checklist**

- [x] `road-edge-fields.js` — overlap full terminal wall bays, merge overlapping runs, and retain gap/closed-tube exclusions.
- [x] `edge-field-r1.js` — use red warning triangles/hatching beside blocked routes and broken spans, amber lift symbols before jump barriers, and cool guidance elsewhere.
- [x] `jump-vfx.js` / `race-vfx.js` — replace the persistent hoop and cone jets with feathered lift exhaust, a brief nozzle flash, tapered streaks and a restrained surface ripple.

**Tests / verification checklist**

- [x] Source-review chunk seams, hazard-side selection, custom attribute transfer, effect timing, reset and reduced-motion behavior.
- [x] Rebuild the playable preview. Production build passed (212 modules); only the existing bundle-size warning remains. No tests or visual gameplay inspection; appearance remains user-owned.

## Previous delivery

Production build passed (212 modules). Source review covered field placement and worker restoration, shared track frames, accepted jump transitions, effect pools, pause/reset handling and scene disposal. The existing shared Three.js chunk-size warning remains. No tests, simulations, browser checks or gameplay/visual reviews were run. Glow balance and gameplay readability remain for user feedback.
