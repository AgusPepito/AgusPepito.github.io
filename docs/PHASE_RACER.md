# Phase Racer 002 — separate racing pivot

The highway combat experiment is preserved at `90f2982` and remains playable at `index.html`. This version is a separate entry at `racer.html`; it does not load the highway combat simulation or camera.

## Intended loop

Read the road, choose a line, match a phase, carry speed. Automatic forward acceleration with lateral momentum, rechargeable boost, a permanent chase camera, and track-relative gravity. The ship stays attached to the surface in this first version: no jumping, falling off tubes, or flight controls. The surface constraint represents gravity/adhesion; this is not a free-body gravity simulation. Camera orientation follows the local normal and turns with the ship around tubes. Reduced-motion preference removes hover bob, boost vignette, camera shake, wind streaks, and speed-dependent FOV expansion; necessary tube camera rotation remains.

Three phases: Ion/circle/cyan, Sol/triangle/amber, Flux/diamond/violet. Select directly with 1/2/3, numpad, or touch. Matching strips accelerate toward 154 m/s; regular speed is 110 m/s, starting at 95 m/s. Hold Space/Shift or touch BOOST for 170 m/s, or 190 m/s on a matching strip. The existing BoostMeter supplies four seconds of boost, a 2.5-second recharge delay, 20-second full recharge, and release-to-rearm behavior after exhaustion. Normal acceleration is 24 m/s², strip acceleration 38 m/s², and manual boost acceleration 56 m/s². Excess speed decays at 8 m/s². Mismatched strips give no strip boost. There are no brakes. Steering targets 30 m/s on flat roads and smoothly increases with surface curl to 52 m/s on either tube type. Steering response is 14/s, with 20/s release damping for precise stopping. Visual ship banking is capped at 0.32 radians. Edge contact scrubs speed.

Gates occupy a specified surface sector, or the entire width/circumference. Mismatched overlap ends the run; crossing is evaluated at the exact gate distance with interpolation and ship-width allowance. Matched gates pass freely. Full-width gates require a phase choice, while partial gates permit avoidance. Gates are signposted by repeating shapes and a HUD warning within 430 course metres. Restart is one key/button away, without a countdown.

## Track representation

`track.js` owns section shape, positions, local frames, boost strips and gates. A signed cross-section curvature smoothly transitions from flat to negative curvature (outside tube), back to flat, then positive curvature (inside tube). At full curvature, the circumference closes and lateral position wraps. During opening/closing sections the ship remains within the physical edges. Width grows from 36 m to the circumference of an 18 m radius tube. Continuous positional derivatives determine the forward, right and surface normal directions. Longitudinal movement accounts for the length of the local path, including the surface deformation. The renderer samples these same functions for track, markings, strips, barriers, ship and camera.

Course stations (parameter metres, rather than exact odometer length on every line):

- 0–850: flat launch and first phase gate.
- 850–1300: roll outward.
- 1300–2500: exterior tube, spiral boost strip and full-width gate.
- 2500–2950: open to flat.
- 2950–3500: sweeping connector.
- 3500–3950: curl inward.
- 3950–5400: interior tube, alternate strips and gates.
- 5400–5850: open to flat.
- 5850–6600: final sprint and finish.

Sector splits are at 2500, 5400 and 6600. A completed phase run saves its total and cumulative splits as a single local best-run record. Driving-only mode hides strips and gates and does not update the phase leaderboard. Storage failure does not block play.

## Implementation boundaries

- `simulation.js`: racing state, movement, phase rules, gate crossing, finish and splits.
- `view.js`: temporary geometry, track-relative chase camera, surface decorations and phase symbols. Nearby chunks only are rendered.
- `main.js`: fixed-step loop, keyboard/multi-pointer controls, pause/focus lifecycle, local records, and UI.
- No combat systems, enemies, weapons, upgrades, resource meters, ghosts or jump physics.
- No tests created or run; no gameplay screenshots, browser playtests or visual review performed. Production compilation only. User feedback should guide camera, steering, transition feel, readability and difficulty.
- The initial graybox is not submission-ready recipe art. Existing jam requirements still apply.

## Speed effects revision

The racer imports the original SpeedEffects implementation with its existing 18% shake and 30% wind settings, including boost amplification. Camera-local effects follow the tube orientation. A separate unshaken camera quaternion prevents feedback into camera smoothing. FOV grows from 78 to 91 degrees with speed (fixed 80 with reduced motion). Manual boost works in both course modes. Best times use a new versioned storage key so the faster rules do not compete against previous runs.


## Solid obstacles — revision 003

Seven authored obstacles add lateral dodges and framed openings on every surface type: launch wall at 460; exterior wall at 1690 and opening at 2070; flat opening at 3080; interior wall at 4180 and opening at 4780; final flat wall at 6040. Walls are opaque coral structures with horizontal warning bands and five metres of thickness. Opening walls have a 3.5 m high passage beneath a solid lintel, white edges, and approach guide lines. The opening stays at driving height; jumping is unnecessary. All solid impacts end the run regardless of phase. Driving-only mode retains the empty course.

The shared obstacle definitions supply both solid geometry spans and swept collision. Collision includes ship nose/tail, wings, wall thickness, lateral movement during the crossing, and wrapped tube coordinates. The inside-tube hover radius is included in the lateral clearance allowance. Obstacles are placed on fully flat or fully closed tube sections. The nearest wall or phase barrier receives the HUD warning within 560 course metres; openings show the steering direction and whether the current line clears the passage. Best times use a separate revision-003 key. No tests or visual playtesting; production rebuild only.


## Passage arrows

Wall faces now carry repeated high-contrast white arrows pointing toward the nearest usable passage. Tube signs use the shorter wrapped route to the opening; flat signs never direct players off the road. Opening lintels have downward markers over the actual hole. Signs are unlit and exempt from fog dimming. A large fixed-size HUD arrow gives the same steering direction for the nearest upcoming wall, so distant or opposite-side openings can be anticipated without seeing the opening itself. The arrow becomes forward when the line clears the wall. Advance warnings now begin at 650 course metres. Empty driving mode hides all obstacle guidance. Source review and production build only; no tests or visual playtesting.

## Required phase chains — revision 004

Four authored chains now require two full-width phase gates followed by a physical obstacle: Sol → Flux → exterior dodge (1340/1500/1690); Ion → Sol → road opening (2710/2880/3080); Ion → Flux → interior opening (4420/4580/4780); Flux → Ion → final dodge (5680/5850/6040). The former partial Ion gate at 4420 is now mandatory as part of the interior chain. Gates remain globally sorted by distance. The chain preview appears 650 m before its first gate, shows both required phases and the final passage direction, and dims completed gates. This gives advance lateral guidance while the main warning is still describing a phase gate. Minimum inter-gate spacing is 160 course metres, about 0.84 seconds at maximum forward speed before path-length effects. No tests or gameplay inspection were performed; timing and difficulty await the user's feedback. Personal bests are separated under revision 004.

## Hard boost — revision 005

Manual boost now accelerates at 150 m/s² (previously 56), toward 250 m/s alone or 285 m/s on a matched strip (previously 170/190). Cruise and strip-only speeds remain 110/154. Steering retains the faster tube response. Boost stays a four-second rechargeable burst. Releasing coasts down at 28 m/s² above 154, then the normal 8 m/s²; release ahead of technical sections rather than expecting instant slowing. The existing 160 m phase interval is now about 0.56 s at combined maximum speed, deliberately making boost through sequences risky.

A separate manual-thrust envelope ramps up quickly, adding camera pullback, FOV expansion up to 102 degrees, substantially stronger existing shake/wind, a longer/wider exhaust, and a stronger vignette. Reduced motion suppresses camera pullback, shake, wind, FOV changes and vignette. Records use revision 005. Any future endless generator must budget around the new 285 m/s maximum rather than the old 190. Production build only; user owns gameplay evaluation.

## Dynamic passage guide

`guidance.js` draws a reusable dynamic ribbon mesh and animated arrow triangles toward the next obstacle passage. The curve interpolates in track coordinates before mapping onto the surface, preventing world-space splines from cutting through tube walls. Initial curvature incorporates current lateral velocity. An endpoint ring marks the target. The guide offers a desired route, not a simulated future trajectory or guaranteed reachable path; players must still steer and match any phase gates along it. It is visible within 650 m, handles closed-tube wrapping, and respects open-track edges. Reduced motion uses stationary arrows. No automatic tests or visual inspection were run.

## Jump and missing track — revision 006

Jump is now available on W, Up, J, or the touch JUMP button. Space/Shift remains boost. Input is a one-shot request; holding jump does not bounce automatically and airborne presses cannot double-jump. A surface-relative ballistic arc uses 14 m/s launch velocity and 20 m/s² gravity, giving 1.4 seconds of airtime and 4.9 m peak displacement above hover height. Lateral steering remains available in the air. Airborne boost accelerates forward using the existing rechargeable meter; phase strips only accelerate grounded ships. Camera height follows part of the jump and a ground shadow helps show separation. This is track-relative arcade physics, not unconstrained world-space flight.

Missing road uses shared longitudinal boundaries and lateral masks for pavement, markings, strips and support checks. Full cross-section gaps occur at 540–670 (flat), 1760–1940 (outside), and 4890–5120 (inside). Partial missing pieces occur at 2180–2290 (outside), 3370–3490 (flat), and 4260–4360 (inside). Approaches/landing edges have gold trim. Jump near the departure edge to retain enough airtime. The longest gaps exceed the cruise-speed jump range; saving boost or carrying speed from strips helps bridge them. Missing a landing or driving off unsupported track produces a gap crash. The imaginary track frame continues across the missing section for movement orientation, but supplies no ground support. Driving-only mode restores pavement and removes hazards while leaving jump available.

Obstacle collisions now sweep height as well as forward/lateral movement, including the ship body and the roof over an opening. Tall 9 m walls at 2070 and 4780 require their openings. The 4.2 m wall at 3080 can be cleared with a well-timed jump or passed through its opening. Full-width 2.4 m barriers at 240 and 3990 must be jumped. Other existing tall side-dodge walls remain. Gold obstacle trim identifies jumpable geometry; tall wall trim stays coral. Matching phase remains required through phase gates while airborne.

The dynamic guide now selects the next wall or gap. Gold arcs show intended jump routes toward landing markers; white routes still lead to wall passages. It remains a suggested path rather than an exact future trajectory or a guarantee of sufficient speed. HUD prompts describe jump-only barriers, missing pieces, edge distance, and landing distance. Gameplay feel, jump timing and landing readability await user feedback. No tests, simulations or visual gameplay inspection were performed; source review and production compilation only. Personal best records use revision 006.

### Current keyboard mapping

Space jumps; hold W for turbo. Up/J remain alternate jump keys and Shift remains alternate boost. These supersede the initial revision-006 bindings above. Touch controls are unchanged.

### Current jump feel

Jump now uses an authored asymmetric height curve: 0.32 s quadratic ease-out ascent to 4.9 m, then 0.98 s accelerating descent with an immediate downward velocity at the apex. Total airtime is 1.3 s, preserving most of the original reach. Guidance arcs use the same curve. Failed jumps continue into a gravity-driven fall, and valid landings briefly compress the hover height for feedback. Reduced motion suppresses that landing dip. This supersedes the symmetric revision-006 jump arc described above.

### Landing fairness revision 007

The exterior gap still ends at 1940, but its following tall opening wall is now at 2370 (430 metres after the landing edge). Removed the intermediate partial gap and standalone phase gate from this stretch. The live guide previews a following hole wall during a gap approach when no other wall or gap intervenes, with separate landing and opening rings. The height arc ends at the landing and the remaining line continues along the surface to the opening. This replaces the previous gap-only target that concealed the next steering requirement. Records use revision 007.

### Edge grace

A jump pressed within 100 ms of driving off a track edge still launches. This applies to full-width and partial gaps on all surfaces. It only rescues an unintentional edge departure, not a completed/failed jump, and does not allow double jumps. Launch starts at the current slightly lowered height. The timer freezes with the simulation when paused and resets with the run.

### Current boost recharge

Racer boost regenerates at 6 percentage points per second, filling from empty in about 16.7 seconds after the unchanged 2.5-second delay. Burst duration, power, and rearm rules are unchanged. The original highway retains its previous recharge rate.

### Tap brake

Tap S or Down for a quarter-second brake pulse (28% speed reduction, minimum 65 m/s). Holding does not extend it or repeat pulses. Release the brake keys before another press; pulses have a 0.65-second minimum interval. It works in the air too, so it reduces jump range. Braking cancels active turbo; release/repress turbo to rearm. All timers pause with gameplay and reset on restart.

## Current progression — checkpoint campaign 001

The previous one-course ending is replaced by checkpoint handoffs. Completing a level pauses at its checkpoint with Continue; the next level starts with full boost. R and Retry restart the current level, not the entire campaign. The furthest next checkpoint is saved locally; choosing an earlier level does not overwrite it. Driving-only completion does not save campaign progress. Best times are per-level and separate from previous prototypes. Starting levels can also be selected from the menu.

1. First Shift: 2400 m, gently curving flat road, three isolated mandatory phases 600 m apart, then one broad side dodge. No jumps/gaps/tubes.
2. Around the Tube: 6600 m, full outside/inside geometry, spaced phase gates and wide passages. No gaps or jump-only barriers.
3. Take Flight: 3400 m, flat road, low barrier, short gap, one isolated phase gate, jump-or-hole wall, and a longer gap.
4. Combinations: the previously developed mixed course, including two-phase/obstacle chains and jumps.
5. Overload and subsequent rounds: three-gate chains, deterministic phase permutations and alternating mirrored layouts. Inter-gate spacing moves from 170 to a minimum 140 m; opening half-widths have a 0.115 floor; full gaps grow at most 20 m. Intensity caps after five increments while variations continue. Speed itself does not increase. This is a checkpointed series of authored-template variations, not an unconstrained random/streaming course generator.

`levels.js` preserves the original course as a template, then updates shared gate/strip/obstacle/gap/chain arrays in place for each stage. Only one level's meshes are kept; old GPU resources are disposed when loading another level. Level 1/3 use a flat profile. Normal steering, jump grace, brake pulse and boost behavior are retained.

Guidance now colors each approach segment for the next phase gate along that route, and switches to the following phase when the gate is passed. Beyond gates it uses the existing white passage or gold jump color. Existing phase symbols/buttons and sequence text remain to supplement color. Three-gate chain previews are supported. Gameplay pacing and difficulty await user testing; no tests, simulations or visual inspection were run.

### Drive-through checkpoint behavior

Checkpoint completion automatically advances into the next stage with a short top notification; there is no Continue screen. Current speed, steering momentum/position, phase, jump and brake state carry through, held inputs remain active, and boost refills. The per-level timer resets, and best time/furthest checkpoint are saved. This supersedes the earlier paused checkpoint handoff. Stage geometry is rebuilt at the boundary; gameplay performance at that handoff awaits user evaluation.

### Jump timing guidance
Track gaps now show a gold takeoff band around the current lane on flat, inside and outside surfaces. Guide chevrons gather toward it; SPACE / JUMP appears in the estimated takeoff window. Orange means build speed with W first. Airborne, the band clears and the landing ring remains highlighted. Partial gaps only cue when the current lane crosses missing pavement.
The shared cue uses analytic unboosted coast distance over the jump duration minus 50 ms, an 8 m landing margin, current brake target when braking, and the largest of nine track metric samples. The window is capped at the final 0.2 seconds before the edge. It assumes no further braking or steering; future turbo acceleration is not promised. Timing updates as speed changes. Reduced motion keeps the cue without pulsing. No automatic jump.


### Frequent boost for time chasing
Racer boost now regenerates 12% per second after a 0.8 second release delay (previously 6% and 2.5 seconds). Empty-to-full takes approximately 9.1 seconds including delay; minimum reusable charge takes approximately 2.05 seconds. Full burst remains four seconds, with the same speed, drain, and release-to-rearm behavior. Original highway defaults remain unchanged. Intended direction: learn a level safely, then master more boost for faster personal times. Long-gap tuning for fully boost-optional completion and competitive charts remain future work.


### Lane-powered turbo
Holding turbo while grounded on a matching phase strip now consumes no charge and works even with an empty battery. Charge is preserved, not refilled, during free turbo. Releasing turbo allows normal recharge; leaving the strip, changing to an unmatched phase, or jumping resumes normal battery rules. HUD labels matching lanes and free turbo. Original highway behavior is unchanged.


### Compact HUD and mobile thumbpad
Mobile uses a circular left thumbpad: analog horizontal steering with 12% dead zone, turbo engages beyond 62% forward and disengages below 38%, backward beyond 62% triggers one brake pulse and rearms below 25%. Pointer capture supports simultaneous right-side phase and jump input; cancellation, pause, crash, resize and focus loss reset steering. Three color-only phase buttons sit in a right column; separate round jump becomes retry on crash. The thumbpad ring shows remaining turbo and glows on matched lanes.
Both layouts now use a slim speed/time/pause row and checkpoint progress line. Level names appear briefly. Branding, original-game link and personal best move to menus. Removed gate/status/sequence text panels; world guidance retains phase previews. PC keeps numbered phase swatches and a slim boost meter, hiding touch controls. Coarse pointers and narrow screens select touch layout with touch-specific instructions. Browser safe areas and short landscape layouts are handled.

