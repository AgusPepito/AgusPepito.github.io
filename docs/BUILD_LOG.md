# Build receipts

## 2026-09-24 — civilian traffic on shortcuts

Each bypass now has five staggered pairs of small blue-gray civilian cars, with the open lane changing between groups and mirrored between routes. Cars follow the branch, never attack or change lanes, and travel at 8 m/s in cruise or up to 30 m/s in fast mode so the player must overtake. They are seeded ahead when the route is prepared and begin moving at the junction; survivors merge back onto the main highway. Cars have 100 HP to discourage clearing the path by holding still and firing. Contact costs 18 health in cruise, scales with speed, and briefly slows the player using the existing damage grace period. Yellow truck behavior is unchanged. Signs and route captions advertise slow traffic. Tuning is centralized in `src/bypass-traffic.js`. No tests created or run, and no visual gameplay inspection; the earlier test exception was limited to the steering bug.

## 2026-09-24 — bypass steering fix

Reproduced the sticking in focused simulation tests before changing movement: the bypass center moved across the main-road lateral coordinate, repeatedly clamping the car to the inner wall and damping steering velocity. Forward movement now carries the car with the bypass center; input changes its offset within the bypass. The same correction covers entry, fore/aft repositioning and the final rejoin step, preserving world continuity. Wall collision and damage still apply to genuine outward steering.

The user explicitly authorized focused tests for this bug. All four tests in `tests/fork-steering.test.js` pass, covering both bypass directions, cruise/fast/boost, 60/120 Hz wall escape, lane-position drift, entry/rejoin, and steering reversal after wall contact. No full-suite run or visual playtest.

## 2026-09-24 — lane-selected shortcut forks

Added two optional main-level routes: a left Dart bypass and a right Mine-layer bypass. Advance signs follow the nearest entry lane, show remaining distance and turn green when aligned. Crossing the split in that lane commits to a distinct narrow winding road. Shared branch geometry supplies pavement, guardrail openings, collision boundaries, player heading and camera tracking; approach/rejoin preserve world position. The shortcut suppresses its encounter, records a bypass at rejoin without combat rewards, then resumes the finite route. The route map shows available and taken branches and follows the player's branch progress. No tests created or run and no visual inspection, per the standing user instruction.

## 2026-09-24 — route strip and finite main run

Added the requested subway-style highway strip: six stations from Start through the four encounters to a larger Finish node, distinct encounter icons, current/next labels, player triangle, and clear/bypass history. Progress follows the encounter schedule, holding during fights and moving through driving breaks. Replaced the mixed level's repeating cycle with a final driving stretch and completion result. Updated results handling for completing a main run without an active encounter. Mobile puts the route below the header and keeps live messages in its caption area; duplicate sector text and the mixed run's old distance strip are hidden. Future lane-selected narrow bypass forks and boss-node replacement are documented, not implemented. No tests created or run; no visual inspection.

## 2026-09-24 — experiment 012: mixed main level and tunnel exits

Lowered merge-road pavement and its markings below the main highway to avoid overlap flicker. Added road-aligned primitive tunnel exits with covered approaches, dark interiors and lit mouth frames. Added a default continuous main-level selection rotating through Darts, Interceptors, miners and convoys, with driving breaks and persistent health/boost/score. Existing individual tests and the original highway remain selectable. Normal red-car encounter reinforcements remain disabled. No new tests, existing test runs, browser checks or visual gameplay inspection, at the user's request.

## 2026-09-24 — experiment 011: soften scouts and separate Dart attacks

Responding to the user's playtest: red cars now fire at 12 rather than 17 m/s, with neighboring bullets 0.3 rather than 0.15 radians apart. Individual reload increased to 2.8 seconds. A shared 0.9-second volley interval prevents multiple cars firing together, even across spawn groups; both encounter reinforcements and highway scouts use the same tuning. Darts share one rotating attack turn across all active waves, retaining direct bursts, prediction and fans. Each turn has 0.7 seconds of locked aim preparation; after firing, the next ship waits 0.25 seconds before preparing. Hidden/dead attackers cancel their turn without accumulating shots.

Dart health, wave count, movement and rewards remain as in lab 010. Interceptors, miners and convoy attacks are unchanged so the next test isolates the red-scout contribution. Validation: 71 tests and production build pass. No agent visual gameplay review.

Nonvisual encounter browser smoke passes all four encounter flows and mobile touch selection without runtime errors. Preview rebuilt as lab 011.

## 2026-09-24 — experiment 010: visible attackers and combined encounter pressure

Addressed the user's top-down feedback by moving encounter staging into the camera's forward view and requiring full-body projection within playable margins for 0.7 seconds before any encounter bullet can spawn. Visibility loss resets exposure; Interceptors also wait for visibility before preparation. The actual render camera supplies this check, covering camera toggles/transitions without changing the camera framing.

Darts now have twice the health (6 HP) and two additional waves. Interceptor side dashes increased from 0.45 to 1.05 seconds and from 8 to 14 metres. Mine layers increased from 10 to 30 HP, drop clusters every 1.3 seconds and add warned rotating walls: four groups wide, two narrow, with individual shootable mines and persistent gaps. Mine arming is 0.85 seconds for the closer threat distance. Doubled the convoy to four independently targetable rear-row turrets with staggered roles. Recurring pairs of normal red scouts weave and shoot alongside every main encounter; they do not turn clearing the main objective into endless reinforcement cleanup.

Validation: 67 tests, production build and nonvisual encounter/browser/touch smoke pass. Interceptor staging includes player-travel feed-forward so boost speed cannot collapse its intended gap. Updated preview and test guide; no visual gameplay inspection performed.

## 2026-09-24 — experiment 009: mixed attacks, orbit mines and armed convoy

Implemented the user-approved encounter redesign after lab 008 still felt easy. Six fragile Darts now mix direct three-shot bursts, capped prediction shots, and three-bullet fans with role colors and staggered release. Three Interceptors stage farther ahead and alternate a charge followed by a separately warned, locked side dash; engines open afterward. Two Mine layers now deploy drifting three-mine orbits with stable directions, visible paths, persistent shot-out gaps and gradual road-width adjustment. Mines no longer chain-clear their clusters.

Replaced convoy escorts with two independently targetable rear turrets: tracking and sweeping bursts, cargo-triggered defensive volleys with warnings, and signaled truck lane changes. Cargo locks still end the encounter without another hull-health grind. Cyan pickups now read SALVAGE +600 and announce collection. Increased combat rewards relative to passing and added a one-time 2,000-point clear bonus. No generated assets, upgrades, extra cluster sizes or side-deployed vehicles were added in this first behavior test.

Validation: 60 unit tests, production build and nonvisual encounter/menu/touch/runtime smoke pass. Gameplay visuals and feel remain for the user's playtest. Preview rebuilt; no visual inspection performed.

## 2026-09-24 — experiment 008: encounter difficulty

User found all four encounters trivial and approved a substantial pressure increase. Darts now have three eight-ship waves, seven seconds apart, with faster sequential shots alternating convergence and straight sweeps. Spawn distance and first-shot timing let them threaten maximum-speed approaches. Interceptors retain a readable speed-independent lock warning, occupy the charged lane longer, prepare the next attack during recovery and expose engines for less time. Colliding does not grant an automatic clean pass; a successful dodge still does.

Two Mine layers replace the single layer, deploying paired trails beyond a six-row field with lane gaps. Chains travel only 5.5 m and stop after two links; dropping farther behind prevents the first shot from automatically killing the layers through their fresh mines. Larger proximity rings communicate the trigger area. Convoy escorts now guard rear firing lines, alternate aimed/straight bursts, and warn before swapping sides. The hauler warns before slowing; locks require 16 hits, escorts 8, and base collision damage is unchanged.

Results distinguish clear, escape with incomplete objective, and partial convoy raid. Updated encounter guide and menu descriptions. Validation: 58 unit tests, production build and nonvisual encounter/menu/touch/runtime smoke pass. No visual playtesting performed. Preview rebuilt for the user.

## 2026-09-24 — experiment 007: four selectable enemy encounters

Implemented the user's supplied encounter descriptions with temporary primitive models: five Darts changing from V to staggered columns with sequential rearward fire; two alternating armored Interceptors with tracking/locked charge warnings and exposed rear engines after misses; a zigzagging Mine layer with arming rings, persistent mines and delayed chain reactions; and a Convoy with three independently destructible rear locks, alternating escort bursts and forward-ejected cyan score pickups. Interceptor warning duration is independent of player speed. Convoy cruise following gives time to target locks; no extra hull-health grind follows the third lock.

Added start-menu encounter selection, isolated test sessions, completion results, retry and return-to-selection controls. The original highway remains a separate menu choice. Retained player controls and red/green health bars. No final assets or upgrade mechanics added. Convoy salvage currently awards 250 points per collected pickup.

Validation: 52 unit tests, production build, existing nonvisual PC/touch regression smoke and the new encounter/menu/runtime smoke pass. Preview rebuilt for the user. No visual gameplay testing or screenshot inspection performed.

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
# 2026-09-24 — Phase Racer 001

Preserved the highway combat version at commit `90f2982`. Added a separate `/racer.html` entry with a continuous flat/outside-tube/inside-tube course, surface-relative steering and chase camera, three phases, sustained boost strips, lethal matching gates, braking and speed carry, finish/sector times, and local personal-best storage. Added a driving-only option for evaluating the empty track. Existing highway game remains accessible and builds alongside the racer. New visuals remain procedural placeholders pending the recipe art pass. User owns testing: no tests or gameplay visual review performed. Production build uses Vite's native config loader to avoid a restricted-directory error in the default config bundler.

## 2026-09-24 — Phase Racer 002: speed and manual boost

Removed all racer braking controls and behavior. Space/Shift and touch BOOST use the original four-second rechargeable boost; phase strips stack for extra speed. Raised cruise/strip/manual/combined speeds to 110/154/170/190 m/s and lateral steering to 24 m/s. Reused the highway SpeedEffects module and defaults for camera-local shake and wind, with boost amplification and reduced-motion suppression. Stored the unshaken camera orientation separately to avoid accumulating vibration. Updated instructions, boost charge/status feedback, and the versioned personal-best record. Production build only; no tests or visual gameplay inspection.

## 2026-09-24 — Phase Racer 003: solid walls and openings

Added lateral-dodge walls and thick walls with one framed opening on flat, outside-tube and inside-tube sections. Geometry and swept collision share normalized surface spans, including wraparound handling. Solid impact is lethal in every phase. Added white opening guides, nearest-obstacle warnings, distinct wall crash feedback, and a new personal-best version. Driving-only mode stays empty. User owns testing; no tests or gameplay visual inspection performed.

## 2026-09-24 — Faster tube steering

User feedback: opposite-side tube openings could not be reached quickly enough. Increased lateral speed from 24 m/s to 30 m/s on flat roads and 52 m/s on full tubes, smoothly blended by surface curl. Increased steering response from 9/s to 14/s and release damping to 20/s to reduce overshoot. Capped visual banking at 0.32 radians so faster steering does not over-tilt the ship. Source review and production rebuild only; no tests or visual gameplay inspection.

## 2026-09-24 — Visible passage direction

Added repeated white directional signs to solid wall faces and downward signs above framed openings. Shared guidance selects valid clear sides on flat roads and the shortest route around tubes. Added a large distance-independent HUD arrow and extended the warning range to 650 metres. Arrow materials remain bright through fog. Rebuilt the preview without tests or gameplay visual inspection.

## 2026-09-24 — Required phase sequences

Added four authored full-width phase → different phase → solid obstacle chains and an advance three-action preview with passage direction. Preserved the empty driving option. Replaced the isolated partial gate at 4420 with its mandatory chain gate, sorted all gates, and versioned personal bests. Recorded an endless-generation proposal separately; the playable course remains finite. Production rebuild only, no tests or visual gameplay review.

## 2026-09-24 — Stronger, riskier boost

Raised manual boost from 170 to 250 m/s, combined boost from 190 to 285, and acceleration from 56 to 150 m/s². Added recoverable high-speed coast after release, stronger camera pullback/FOV/shake/wind/exhaust effects, and separated boost records. Cruise, strip-only speed and steering are unchanged. Rebuilt without tests or gameplay visual inspection.

## 2026-09-24 — Dynamic passage spline

Added a live white guidance ribbon from ahead of the ship to the next wall's opening or clear side, with flowing arrowheads and an endpoint ring. A track-coordinate Hermite curve incorporates current lateral motion and remains on the road/tube surface. Full closed-tube approaches take the shortest wrapped route; approaches spanning open sections stay within edges. The guide updates continuously inside the 650 m warning horizon, never skips an uncleared wall, and disappears while crossing the target. It is guidance only: no automatic steering, phase changes, or safety guarantee. Reduced motion stops arrow flow; driving-only mode hides the guide. Rebuilt without tests or visual gameplay review.

## 2026-09-24 — Simplified passage guidance

Removed the upper progress strip, wall-direction HUD arrow/text, repeated arrows mounted on wall faces, and opening arrow plaques. The dynamic passage spline is the navigation guide. Phase-gate warnings, sequence previews, opening edge markings and collisions remain. Removed unused arrow texture creation. Production rebuild only; no tests or visual gameplay review.

## 2026-09-24 — Jump, gaps and obstacle height

Implemented surface-relative jump on W/Up/J and touch, with in-air steering/boost and no repeat/double jump. Added full and partial track gaps on flat/exterior/interior surfaces; cut pavement and decorations from the same masks used for support. Added height-aware swept wall/roof collision, jump-only low barriers, a jump-or-opening wall, and tall opening-only walls. Added gold jump guidance arcs, gap/landing prompts, ground shadow, adjusted camera follow, updated controls and revision-006 records. Driving-only mode fills gaps and supports practice jumps. No tests or gameplay visual inspection; rebuild only.

## 2026-09-24 — Jump/boost key swap

Changed the racer to Space for jump and W for boost. Up/J remain alternate jump keys; Shift remains alternate boost. Updated the intro, button hints, live boost status and jump warnings. Original highway controls unchanged. Production rebuild only; no tests or visual playtesting.

## 2026-09-24 — Snappier jump curve

Replaced the symmetric ballistic jump with a fast ease-out rise (0.32 s to peak instead of 0.7 s) and an accelerating quadratic descent without an apex hold. Peak remains 4.9 m; total airtime is 1.3 s versus 1.4 s. Added a brief 0.14 m landing compression, suppressed under reduced motion. The guide uses the same height curve, and failed jumps continue falling below missing track. Landing support uses within-step contact interpolation. Rebuild only; no tests or visual gameplay review.

## 2026-09-24 — Fair landing-to-opening approach

User reported insufficient room and missing passage guidance after the exterior tube jump. Moved the opening-only wall from 2070 to 2370, increasing landing-edge clearance from 130 to 430 metres. Removed the intervening 2180–2290 partial gap and the 2350 phase gate so the recovery stretch remains clear. The passage spline now extends across a gap to a nearby following opening-only wall, showing its target throughout the airborne approach with a separate landing ring. The jump arc still ends at the landing, rather than stretching to the wall. Continuation does not skip intervening walls or gaps. Personal bests use revision 007. Source review and production rebuild only; no tests or visual gameplay inspection.

## 2026-09-24 — Edge jump grace

Added a 100 ms grace window after driving off supported track into a gap, allowing a slightly late jump. Grace is consumed on takeoff, expires during the fall, clears on landing/reset, and is never granted after an intentional jump, preventing double jumps. Launch starts from the current height to avoid a visible snap upward after leaving the edge. Jump hint remains available during grace. Production rebuild only; no tests or visual gameplay inspection.

## 2026-09-24 — Slightly faster boost recharge

Increased racer recharge from 5 to 6 percentage points per second: empty-to-full refill now takes about 16.7 seconds instead of 20, after the same 2.5-second delay. Boost duration and power are unchanged. BoostMeter accepts an optional regen override; the original highway retains its default rate. Production rebuild only, no tests run.

## 2026-09-24 — Tap brake pulse

S/Down now triggers a 0.25-second brake pulse, shedding 28% of current speed with a 65 m/s floor. It stops automatically and normal acceleration resumes. Holding/repeating a key cannot sustain or retrigger braking; both brake keys must be released before a fresh press, with a 0.65-second retrigger interval. Brake overrides strip acceleration and cancels held turbo through the existing boost meter; release/repress turbo to rearm. Added HUD pulse feedback and control instructions. Source review and production rebuild only; no tests or visual gameplay inspection.

## 2026-09-24 — Phase-colored guidance and checkpoint progression

The dynamic ribbon and flowing arrows now preview required gate phases by segment, changing to the next phase after a gate, with white passage/gold jump guidance after the last gate. Isolated gates receive a guide even when no physical obstacle is nearby.

Added level configuration and checkpoint progression: First Shift (2.4 km flat, isolated phase gates and one dodge); Around the Tube (6.6 km, wide spaced walls/openings and no gaps); Take Flight (3.4 km flat, spaced jump challenges); Combinations (the developed 6.6 km course); then indefinitely repeatable Overload rounds with three-phase chains, phase permutations, mirrored layouts, bounded narrowing, and bounded gap/spacing changes. Retries restart the current level with full boost. Checkpoint completion saves the furthest reached next stage and per-level best times. The menu allows choosing early stages or jumping directly to the developed challenge. Old geometry/materials/textures are disposed at level changes instead of retaining an ever-growing course. Sequence preview handles three gates plus the obstacle. No tests or visual gameplay inspection; source review and production rebuild only.

## 2026-09-24 — Drive-through checkpoints

Checkpoint crossings now save progress/time and automatically advance to the next stage before showing any results UI. Added a three-second notification at the top. Carry forward speed, lateral position/momentum, selected phase, jump state and brake state; held controls stay active, and boost refills. Explicit retries still reset at the current checkpoint. Source review and production rebuild only; no tests or visual gameplay inspection.

### 2026-09-24 — Gap takeoff guidance
Preserved the previous campaign as commit 30579eb before implementing. Added shared conservative range estimation, surface-following takeoff band, gathering guide chevrons, jump/boost prompt and airborne landing ring. Source reviewed and production preview rebuilt; no tests or visual gameplay checks, per user instruction.


### 2026-09-24 — More frequent racer boost
Doubled racer regeneration to 12% per second and reduced its delay to 0.8 seconds. Made delay configurable on BoostMeter while retaining original highway defaults. Source review and production build only; no tests or visual playtesting.


### 2026-09-24 — Instant checkpoint retry
A fresh Space press after a crash instantly retries the current checkpoint; during racing it still jumps. Holding Space does not retry or jump repeatedly. The mobile jump button becomes RETRY above the crash overlay and restarts on touch-down. R and the result retry button remain available. Production build only; no tests or visual playtesting.


### 2026-09-24 — Free turbo on matched lanes
Added an optional free-power input to the boost meter, supplied by the racer's existing grounded phase-strip match. Free turbo bypasses battery availability and preserves charge; normal consumption resumes off-lane. Updated HUD wording. Production build only; no tests or visual playtesting.


### 2026-09-24 — GitHub Pages packaging
Prepared automatic Pages deployment and a separate site package with Phase Racer at the root and the original at highway.html. Production build and packaging completed; no tests or gameplay inspection. Remote repository creation awaits explicit approval for public source/history disclosure and the repository name.


### 2026-09-24 — Mobile controls and HUD redesign
Replaced touch arrow buttons with analog thumbpad, deliberate forward turbo and rearmed backward brake gesture. Added color-only vertical phase controls, jump/retry, and radial boost charge. Rebuilt compact HUD styles and removed redundant live text. Source review and production rebuild only; no tests or visual playtesting for this UI iteration.


### 2026-09-24 — Fullscreen control
Added an always-available fullscreen toggle beside pause, including on the start screen. It requests fullscreen on the whole document, resizes the renderer and resets touch input during transitions, and updates on browser-driven exits. Unsupported browsers receive a temporary home-screen hint; iOS standalone metadata is included. Build only; no gameplay tests or visual checks.


### 2026-09-24 — Larger jump target and sliding actions
Mobile Jump now spans the phase column height, inward of the edge-aligned colors (72 by 168 px, 66 by 148 px in short landscape). Captured right-hand gestures hit-test all action buttons: sliding through phases selects them immediately; entering Jump triggers once per touch until release. Sliding back to phases remains available after jumping. Pause, crash, retry and resize clear captures; stale pointer clicks do not reselect the starting phase. Source review and build only; no tests or visual playtesting.


### 2026-09-24 — Right action thumbpad
Replaced mobile phase column and jump target with one captured directional pad: up jumps, left Ion, down Sol, right Flux. Phase persists at center and on release. Jump fires once until centered or released, with a neutral dead zone and diagonal hysteresis. Left controls and PC keys are unchanged. Retry occupies the right pad location after crashes. Source review and build only; no gameplay tests or visual review.


### 2026-09-24 — Swap jump and turbo pads
Left pad now combines analog steering with one-shot upward jump (62% activation, rearmed below 38%) and backward brake. Right pad holds turbo in its upper sector while retaining the selected phase; center, release or another sector stops turbo. Moved charge ring and boost feedback to the right pad and updated instructions/cues. Build and source review only; no gameplay tests.


### 2026-09-24 — First recipe ship candidates
Created an original image reference and three independent code-built ship interpretations: Kestrel, Manta and Splitframe. Added a separate shipyard with orbit/view controls and phase-color previews, using the official recipe loader. Preserved source candidates, reference prompt, expectations and utility license. No candidate selected or integrated into gameplay yet; official verification remains pending. Production build only, no tests or visual gameplay review.


### 2026-09-24 — Detailed ship V2 and stronger phase energy
Added three detailed candidate revisions while keeping V1 for comparison. Corrected buried energy-strip placement, added prominent energy surfaces, and introduced adjustable tenfold emissive output plus bloom in the shipyard. No gameplay integration or automatic visual tests. Production build only.


### 2026-09-24 — Ship reconstructed from reference
Created an independent image-led ship rather than adding detail to the previous candidates. Added candidate D as shipyard default and an expandable source-picture comparison. Kept existing candidates and the gameplay ship. Production build only; no tests or visual gameplay inspection.

