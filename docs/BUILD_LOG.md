# Build receipts

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
