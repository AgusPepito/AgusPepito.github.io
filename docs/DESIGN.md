# Mechanics experiments

## Route strip and lane-selected bypasses

The mixed main level is now a finite route: Start → Darts → Interceptors → Mine layers → Convoy → Finish. A compact subway-style strip at the top shows station icons, a larger final station, current/next labels, and a player triangle. Its spacing represents encounter progression rather than literal road distance: the triangle travels during driving breaks and holds at the active encounter. Clears receive checks; escaped/partial encounters receive dashes. After the convoy and its remaining hazards/salvage resolve, the player drives the final stretch to a completion screen. No boss is implemented, so the final node is honestly labeled Finish. The repeating original highway remains available separately.

Two bypass forks are implemented in the main level: left before Darts and right before Mine layers. A road-aligned sign and painted outer lane warn at least 420 metres ahead (over three seconds even at full boost). Occupying that nine-metre entry corridor at the split commits to the branch; other lanes retain the encounter route. The sign turns green when aligned. Branch roads separate from the highway, provide three marked lanes across nine metres, weave through two bends, and rejoin after 560 metres. The middle corridor runs farther outside the tunnel approaches; junction placement reserves 24 metres around both crossing corridors and advances them past conflicting same-side tunnel/ramp complexes. Outer guardrails continue around the union of the roads, while inner rails begin only after separation. Steering must follow the changing corridor; wall impacts use normal damage rules, and braking is the intended way to handle tight bends. Rendering, collision boundaries, forward heading and camera use the shared branch sample. No encounter or new traffic spawns on the bypass. Rejoining records the skipped station without combat/clear rewards and resumes the next encounter. The map shows both loops, highlights the chosen branch, and moves its player marker along it. Isolated encounters and the original highway retain their prior routes. Boss mechanics remain deferred.

## Current experiment: 012 — continuous mixed level and ramp exits

The new default main level rotates through all four encounters with 160-metre/four-second minimum driving breaks. Existing clear/escape rules resolve each fight without opening a results screen; health, boost and score persist. Yellow traffic streams between fights. Normal red reinforcements remain removed from encounters, and the original highway with scout/shield ramps remains a separate choice. Four isolated encounter tests remain available. Ramp pavement and markings sit below the main road, with a covered primitive tunnel approach at each ramp's start. The user requested no new tests or test runs for this iteration; rebuild only, with gameplay testing owned by the user.

## Experiment 011 — room between attacks

User feedback identified overly effective red scouts and synchronized Dart walls. Red scout fans now travel at 12 m/s with 0.3-radian spacing and a 2.8-second individual reload. A shared 0.9-second volley interval prevents synchronization across cars and reinforcement pairs, also in the highway run. All Dart waves share a rotating attack turn: 0.7-second locked aim warning, the existing role attack, then a 0.25-second pause before the next ship prepares. Hidden/dead ships cancel their turn instead of accumulating shots. Dart health, waves, rewards and movement remain as before. Interceptors, miners and convoy attacks retain the prior tuning so the user can evaluate them with the reduced red-car pressure.

## Experiment 010 — top-down visibility and combined threats

User testing found shooters outside the top-down view and requested more endurance and simultaneous threats. Staging now fits the top-down camera, and a full-body camera projection gate with 0.7 seconds of readable exposure controls all encounter shooting. Interceptor preparation also requires visibility. Darts have 6 HP and three six-ship waves. The side dash lasts 1.05 seconds across up to 14 metres. Miners have 30 HP, faster orbit drops, and a separately warned wall of counter-rotating clusters. The convoy carries four rear turrets. Normal red scouts reinforce all four tests independently of the main objective.

Mine walls scale group count/radius to road width, keep shootable gaps, and arm after 0.85 seconds to remain relevant at the closer staging distance while preserving fast crossings before arming. Agents validate projection and simulation numerically; the user remains the sole gameplay visual tester.

## Previous experiment: 009 — attacks that disrupt firing position

User feedback: repeated volleys remained predictable, Interceptor contact felt incidental, straight autofire solved mine trails, and the convoy lacked its own attacks or understandable rewards. Implemented the approved first tests: six Darts split between direct burst, capped predictive aim and three-shot spread roles; three serialized charge/side-dash Interceptors; three-mine rotating clusters that retain shot-out gaps; and a lane-changing hauler with targetable tracking/sweeping turrets instead of escorts. Destroying cargo triggers a warned defensive fan. Roles, warnings, orbit motion and salvage value have explicit presentation cues.

Kills and objectives now pay much more than bypassing enemies, with a 2,000-point full-clear bonus and labeled +600 salvage. Two-/four-mine cluster variants and side-deployed convoy vehicles remain follow-up experiments. This version intentionally focuses the six-Dart squad and turret-only convoy before mixing more units into them. Nonvisual tests check behavior, not human challenge; the user remains sole visual gameplay tester.

## Previous experiment: 008 — encounter pressure

After the user found all four encounters trivial, added overlapping Dart waves and converging volleys; faster alternating Interceptor attacks with a longer collision corridor and shorter rear-engine opening; two Mine layers with overlapping fields and limited chain propagation; and rear convoy guards with alternating aimed/straight bursts, side swaps, and hauler speed changes. Collision damage stays unchanged. Cargo locks now need roughly 1.28 seconds of sustained twin-gun fire. Results distinguish clears, escapes and partial raids. See `ENCOUNTERS.md` for exact rules.

Nonvisual simulations specifically check that idle autofire incurs substantial damage, straight boosting cannot count as a clear, and a timed Interceptor dodge still permits an unharmed rewarded escape. These checks establish mechanical pressure and an available response, not human difficulty or visual approval.

## Previous experiment: 007 — selectable encounters

Four isolated tests focus on formation clearing (Darts), bait/dodge/rear-engine punishment (Interceptors), persistent hazards and chains (Mine layer), and optional multi-target reward extraction (Convoy). The start menu selects the next test; retry, completion and return-to-selection controls support quick comparisons. The previous highway run remains a fifth choice. See `ENCOUNTERS.md` for current rules and balance values. Convoy salvage awards score only; upgrades remain deferred.

## Previous experiment: 006 — shared drive controls and consumable boost

PC: WASD/arrows only reposition, Shift selects fast mode, Ctrl brakes, Space boosts. Mobile: a circular analog stick steers horizontally; moderate vertical motion repositions, its upper edge selects fast mode, and lower edge brakes. The independent thumb button now controls BOOST. Stick deadzone is 12%, mode entry 70%, exit 55%; this allows diagonal fast steering and prevents mode flicker. Outer speed zones do not also change longitudinal offset. Neutral/released controls return to cruise. Pause, tuning, focus loss, pointer cancellation, and restart clear held actions.

Cruise/fast speeds stay 26/82 m/s. Braking targets 12 m/s with stronger deceleration and overrides fast and boost. Boost targets 122 m/s from either cruise or fast, consumes 25% per second, and starts regeneration at 5% per second after a 2.5-second delay. Fresh activations require 15% charge; exhaustion or brake cancellation requires a release before rearming. Holding an empty meter cannot produce repeating micro-boosts. Meter timers freeze while paused. On release/exhaustion the underlying held drive mode resumes. Fast mode consumes no energy. Boost raises wind and shake within the existing settings; zero and reduced-motion suppression still apply.

HUD includes boost charge/status and current drive mode. Existing fast-mode camera/speed comparison remains available; the speed toggle controls fast mode alone. Drops, upgrade scaling and special recharge actions/lanes remain unimplemented.

## Previous experiment: 005 — firing rows and neutral traffic

Keep the established merge timing: the player can race past an arriving formation before it closes the road. Purple rows only arm after deploying and only when the player is behind them within 12–105 metres. They fire single rearward shots from left to right, with 0.18 seconds between slots and 3.8 seconds between sweep starts. A 0.7-second charge cue precedes the first shot. Destroyed carriers leave empty beats in the pattern. Passing the row cancels further fire; it does not chase or turn its guns around. Existing 12 HP, 22 m/s speed, combat following and contact recovery remain.

Yellow blocks are now neutral cargo vehicles moving at 8 m/s (29 km/h), with 160 HP. They follow the road and preserve their relative lane position as it narrows. Player shots damage them and are absorbed; destruction removes the vehicle. They neither shoot nor award enemy kills/score. Drops and weapon upgrades are deliberately deferred. Contact remains instant death except in practice mode, preserving the previously requested collision rule. Vehicles stream outside the visible road range, retain health while active, and never respawn at their old position after destruction.

## Previous experiment: 004 — merging traffic and shield rows

Yellow barriers end the run instantly at any speed, bypassing hit immunity. Explicit no-damage practice remains an exception. Walls and ordinary enemies retain recoverable, speed-scaled impact damage.

Six fixed side ramps per lap alternate left/right and scout/armored groups. Enemies travel the rendered ramp before deploying onto the highway. The rail opens where the ramp joins, and the connected apron uses shared collision bounds. Ramps repeat with distinct lap IDs and spawn once per encounter.

Purple armored groups deploy seven carriers into a full-width shield row. After user feedback that the first balance was too punishing, each carrier now has 12 HP (about one second of concentrated twin-gun fire), moves at 22 m/s versus the player's 26 m/s combat speed, and awards 400 points. Releasing overdrive applies stronger braking behind an intact deployed carrier and matches its speed with a 12-metre bumper gap. This only applies to carriers in the player's path; destroying one releases the limit. Holding overdrive bypasses following. Impact costs 18 shield before speed scaling, prevents phasing through the row during immunity, and applies 1.25 seconds of recovery slowdown to separate the vehicles. Repeated deliberate overdrive contact remains dangerous.

Shield wings and slot spacing contract with the road; a destroyed carrier leaves its slot vacant even after narrowing. The narrowest road still permits a 2.53-metre opening for the 1.3-metre ship. Ordinary pink scouts remain fragile, with 3 HP and 100-point kills.

Wind lines approach the camera and fade in/out. Camera vibration and wind increase with speed, with separate Tune sliders defaulting to 18% and 30%. Zero disables either; reduced-motion preferences disable both. Strength calculation accepts a future turbo multiplier, but turbo itself is not implemented.

Balance and visual feel remain for the user's playtest; automated checks cover lethal impacts, ramp placement, continuous deployment, gap geometry, sustained-fire kills, and nonvisual runtime behavior.

## Previous experiment: 003 — road-relative movement

Forward motion now follows the track centerline. Left/right input moves perpendicular to the road, preserving a selected lateral line through bends. Width changes can still force the player toward a gap. Hold-to-race, speed, and damage settings from experiment 002 are retained.

The road surface is built from perpendicular cross sections. Lane markings follow the local direction of their lanes, including widening/narrowing sections. Player/enemy ships, barriers, shadows, roadside posts, speed streaks, and the camera use the same road frame. Longitudinal speed accounts for centerline curvature.

Player shots launch along the local road tangent and keep straight world-space trajectories afterward. Hits use road-aligned collision boxes and swept relative movement so rotating the graphics does not leave world-aligned hitboxes behind.

## Previous experiment: 002 — player-held overdrive

The user activates racing by holding Space, either Shift key, or the OVERDRIVE button. Releasing returns smoothly to combat. The track still changes width and bends, but neither the camera mode nor speed mode depends on the zone.

- Combat speed: 26 m/s (94 km/h). Overdrive target: 82 m/s (295 km/h).
- Lower chase view, 55-to-73-degree field-of-view transition, brighter frequent ground marks, roadside posts, and peripheral speed streaks. Reduced-motion preference suppresses streaks and camera banking.
- Additional staggered barriers in both wide and narrow sections; more frequent enemy waves.
- Physical collision damage scales up to 1.8 times at maximum speed. Bullet damage is unchanged. Releasing overdrive before a bend is a deliberate risk-management choice.
- Keyboard and two-finger touch input remain independently held/released; pause, focus loss, and restart clear all held controls.
- Camera-only and speed-only tuning remain available, both activated by the same hold action.
- The user alone judges the visual result and gameplay feel. Agents run nonvisual correctness checks.

## Archived baseline: 001

The original zone-driven prototype below is preserved at tag `prototype-01-zone-transitions`.

## Hypothesis

A ship moving on a single ground plane can feel like a scrolling shooter on a wide road and a fast racer on a narrow road. Width, camera distance, and forward speed change continuously; the steering rules do not switch.

## The current experiment

- A 2,100-meter looping course with open combat, a funnel, an S-shaped channel, another open area, and a final chicane.
- Automatic forward travel: 26 m/s in open areas, rising toward 43 m/s as the road narrows. Steering reaches 19 m/s laterally with short acceleration/deceleration smoothing.
- WASD/arrows or an analog drag control move sideways and fore/aft. Fore/aft travel is bounded relative to the scrolling course.
- Auto-fire, three-enemy formations in open areas, sparse moving enemies in tight areas, and clearly contrasting static barriers.
- Shoot enemies for 100 points (180 for racers), overtake for 40, complete a lap for 1,000 and a small shield refill.
- Wall scrapes cost 8 shield; bullets 12; enemy contact 18; barriers 22. Brief invulnerability prevents stacked damage, and physical collisions briefly reduce speed. The player can recover from a mistake.
- The Tune panel independently toggles camera transition, speed transition, practice mode, and simple synthesized impact sounds. Tuning pauses a running game.

## First playtest questions

1. Does the narrowing road make you naturally prioritize a safe line?
2. Is the low view readable through bends and obstacles?
3. Does steering feel precise in combat and controllable at racing speed?
4. Does camera-only feel fast enough, or does acceleration improve it?
5. Does shooting still contribute during the racing sections?

## Deliberately unfinished

This build has no final art, bosses, progression, weapon upgrades, music, or submission deployment. Enemy balance and track pacing are starting values, not a finished difficulty curve. All visible geometry is a temporary mechanics placeholder.

## Implementation boundaries

- `src/track.js`: continuous width/center samples and obstacle data, shared by collision and presentation.
- `src/simulation.js`: fixed-step movement, enemies, projectiles, scoring, and collision; independent of Three.js.
- `src/camera.js`: view targets, independently testable across phone and desktop aspect ratios.
- `src/view.js` and `src/placeholders/`: replaceable visuals. The final 404 assets must preserve the simulation dimensions or change them deliberately.
- `src/main.js`: actual keyboard/pointer controls, lifecycle, HUD, sound, and the official gate's telemetry interface.

The official jam gate verifies loading and input, not the feel of the whole course. Real playtesting is still required.
