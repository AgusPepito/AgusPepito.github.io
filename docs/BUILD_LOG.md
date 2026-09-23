# Build receipts

## 2026-09-24 — health-bar readability

Replaced small roof-mounted bars with camera-facing bars for scouts, shield carriers and neutral vehicles. Bars have a dark outline, red background and green left-anchored remaining-health fill, including a red rim at full health. Minimum screen height is seven CSS pixels plus outline; world lighting/fog and vehicle geometry cannot hide the bars. Yellow vehicles now display health before taking damage. Player HUD shield meter uses the same red/green convention. Visual testing remains with the user.

Production build and nonvisual browser runtime/input smoke pass; preview rebuilt without screenshot inspection.

## 2026-09-24 — experiment 006: analog speed zones and rechargeable boost

Implemented the user-approved shared control scheme: mobile circular stick uses moderate vertical motion for repositioning and outer forward/backward zones for fast/brake; PC uses WASD/arrows, Shift fast, Ctrl brake, Space boost. The independent mobile button is BOOST. Added deadzone/hysteresis, action-specific independent key/finger tracking, and held-action repeat suppression across pause/focus changes.

Added 12 m/s braking, separate 122 m/s consumable boost, four-second tank, 2.5-second recharge delay, 20-second refill, minimum activation charge, and brake/exhaustion rearm rules. Fast mode stays unlimited. HUD/hints document controls, meter state and stronger boost effects. No upgrades, drops or recharge lanes/actions added. Visual gameplay testing remains user-owned.

Validation: 41 unit tests, production build, and expanded nonvisual keyboard/touch/runtime smoke pass. Local preview rebuilt for user testing.

## 2026-09-24 — experiment 005: firing rows and moving neutral vehicles

User liked racing past enemies during their side entry and requested delayed left-to-right purple fire plus slow, heavily armored yellow vehicles. Preserved merge timing and bypass opportunity. Added a shared volley clock, per-carrier charge cue, one rearward shot every 0.18 seconds across the row, and 3.8 seconds between sweeps. Rows do not fire during entry or after the player passes; destroyed slots stay empty.

Replaced static yellow obstacles with moving neutral cargo primitives at 8 m/s and 160 HP. Vehicles follow curves and narrowing lanes, receive player-shot damage, absorb shots, and can be destroyed. Fatal contact and practice exception remain. No drops or upgrades added. New nonvisual tests cover motion/bounds, damage/destruction/reset, volley timing, destroyed gaps, entry/pass suppression, and actual simulation projectiles. Collision-following tests explicitly isolate incoming fire.

Validation: 34 unit tests, production build, and nonvisual keyboard/touch/runtime smoke pass. Preview rebuilt for the user; no visual playtesting performed.

## 2026-09-24 — shield-row fairness revision

User reported that purple carriers were too tough and slower traffic caused unavoidable repeated crashes. Halved carrier health from 24 to 12, increased row speed from 16 to 22 m/s, reduced base collision damage from 32 to 18, and added 1.25 seconds of recovery slowdown after contact. Releasing overdrive now brakes and follows an intact deployed carrier in the player's lane at a safe gap; destroyed slots immediately release that speed limit. Holding overdrive retains collision risk. HUD explains when speed matching is active.

29 nonvisual tests pass, including a full-speed release 25 metres behind a row, sustained following without firing, opening a gap within two seconds without damage, and recovery from a collision without repeated impacts after release. Visual feel remains for the user's playtest.

## 2026-09-24 — experiment 004: merge ramps, armored rows, speed effects

User requested instant-death yellow barriers, enemy entry via distributed highway ramps, subtle configurable shake/wind, and a stronger lane-blocking enemy that handles road narrowing. Added six shared simulation/render ramp paths with open merging rails and connected apron collision bounds. All enemy spawning uses these ramps. Purple armored carriers deploy into seven fixed slots, retract shield wings as width changes, and retain destroyed gaps. Yellow barrier contact bypasses damage immunity; explicit practice mode remains damage-free.

Added camera-relative fading wind streaks and subtle vibration, independently adjustable in Tune with low defaults and reduced-motion support. All geometry remains temporary primitives. Added nonvisual checks for fatal collisions at both speeds, lap-specific ramps, continuous deployment, usable gaps across every road width, sustained-fire destruction, collision blocking during immunity, apron bounds, and effect disabling/scaling. No visual gameplay testing is performed.

Validation: 26 unit tests, production build (about 0.54 MB), and extended nonvisual keyboard/touch/runtime smoke all pass. Preview rebuilt for the user's playtest; final jam gate is not claimed for this experiment.

## 2026-09-24 — experiment 003: road-relative movement

User identified world-forward alignment of ships and road markings on bends and approved moving to the road's local direction. Added a shared tangent/right frame, perpendicular road cross sections, road-relative steering, curvature-adjusted forward travel, and a camera that turns with the track. Ships, markings, barriers, shadows, posts, and speed streaks now align with the road. Shots launch along the local tangent, then continue straight. Swept collisions use rotated target frames and relative target motion.

19 nonvisual unit tests pass, including road/world coordinate round trips, lane-marking direction, holding a lateral line through the S-bend, straight shot trajectories, rotated/moving target collisions, and camera projection bounds. Visual gameplay testing remains solely with the user.

Production build and nonvisual keyboard/touch smoke check pass with no runtime errors. The local preview is rebuilt for the user's playtest.

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
