# Build receipts

## 2026-09-23 — experiment 002: hold-to-race

User-approved baseline was already committed at `23ed7a1`; preserved with annotated tag `prototype-01-zone-transitions` before changing gameplay.

Racing is now activated only while Space, either Shift key, or the touch OVERDRIVE button is held. Camera and acceleration are independent of track zones. Raised overdrive target from the previous 43 m/s racing speed to 82 m/s, added frequent contrasting ground marks, roadside posts and peripheral streaks, widened the racing field of view, and lowered the chase camera. Added staggered barriers and increased physical impact damage with speed. Shooting remains automatic in both modes.

Independent held-input tracking prevents one finger/key releasing another. Pause, focus loss, and restart clear holds. Nonvisual unit checks cover hold/release, mode independence from zones, impact scaling, and camera projection bounds across transition values. No visual gameplay testing or screenshot inspection is performed, per the user's project instruction.

Validation: 13 unit tests pass; production build succeeds (about 0.52 MB). `scripts/input-smoke.mjs` passes actual keyboard hold/release, Shift, pause/resume, simultaneous touch steering and overdrive, independent finger release, and runtime-error checks. It captures no screenshots. The old jam verdict applies to experiment 001; this experiment has not been submitted or visually approved.

## 2026-09-23 — prototype brief

User direction: prototype the mechanics with primitive objects before generating art. A ship skims a wide track with scrolling-shooter movement; the track narrows and the camera approaches, turning the same controls toward racing and collision avoidance.

Tools: OpenAI Codex for implementation; Three.js for rendering; official 404 recipe repository for guidance and verification tooling. No example-game code/assets are copied. All prototype geometry is authored for this project and temporary.

First experiment: one looping course with wide combat areas, a funnel, narrow bends and obstacles, then another combat area. Auto-fire removes button timing from the initial movement experiment. Camera transition and speed increase can be toggled separately to distinguish their effect on perceived pace.

Initial source history is created before implementation and will be preserved.

## 2026-09-23 — first playable implementation

- Separate official recipe checkout at commit `4effad311c5e137bca316257259fe5bffd6737de`.
- Original Three.js simulation and presentation; no example-game sources or assets used.
- Wide-to-narrow course, fixed-step movement, auto-fire, enemies, swept projectile collisions, recoverable wall contact, score, death/restart, and pause.
- Keyboard and real pointer/touch steering, responsive phone/desktop layouts, optional synthesized sound.
- Separate controls for camera and speed transitions, plus a no-damage practice setting.
- Rendering uses constructor-generated primitive geometry and instancing for the temporary road, barriers, bullets, and effects.
- Camera review found that tracking forward position hid fore/aft movement; corrected by tracking course progress in open areas. A subsequent close-camera check exposed low framing. Revised camera targets and added full-course projection checks, including extreme steering positions and phone/desktop aspect ratios.
- Nine automated tests pass: track continuity, lap seam, frame-rate stability, collision tunneling, wall recovery, lifecycle/reset, obstacle repetition, combat scoring, speed toggle, with the camera sweep covered in its own test (nine test cases total).
- Official recipe self-tests pass, including known-bad fixtures, assets outside the recipe folder, expected sizes, and preservation of animated asset hierarchy.
- Initial local production jam gate passed using actual touch under the gate's mobile/4G conditions: 0.52 MB, 0.93 s ready, 16 peak draw calls, 9,820 peak triangles, no console errors or missing files. This is a development check, not a deployed entry verdict; camera refinements are followed by a fresh check.
- Final committed camera revision also passes the local mobile gate: 0.8 s ready, 0.5 MB, 15 peak draw calls, 9,772 peak triangles, zero errors. The exact verdict and scope are retained in `docs/VALIDATION.md`.
