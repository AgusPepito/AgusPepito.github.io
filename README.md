# VECTOR SHIFT — mechanics prototype

## New: Phase Racer

Open `/racer.html` for the separate racing pivot. The original highway game remains at `/index.html`, preserved before the pivot in commit `90f2982`. Both pages are included in the production build and link to each other.

The racer now has checkpoint progression: First Shift (2.4 km), Around the Tube (6.6 km), Take Flight (3.4 km), Combinations (6.6 km), and repeating Overload rounds. The guide previews required phase colors; checkpoints save the next stage and refill boost, and retries restart the current level. The original mixed course is preserved as Combinations: flat launch, outside tube, open connector, inside tube, final sprint. Gravity and the chase camera follow the local surface; full tubes permit 360-degree steering. The ship can jump away from the local surface, with in-air steering and boost. Three instantly selectable phases match boost strips and lethal energy gates. Solid walls require lateral dodges or passing through a white-marked opening on flat roads and both tube types; all phases collide with them. Low barriers can be jumped, medium walls offer jumping or an opening, and tall opening-only walls cannot be cleared. Full-width and partial track gaps require timed jumps or lateral avoidance; boost helps reach longer landings. No enemies, shooting, health, upgrades, or phase resource meter. Hold W/Shift or touch BOOST for a four-second rechargeable boost, which stacks with matching strips. Cruise is 110 m/s, strips reach 154 m/s, manual boost reaches 250 m/s, and both together reach 285 m/s. Speed carries beyond boosts and decays gradually. The original highway camera shake and wind streaks intensify under boost, with reduced-motion suppression. Edge scrapes reduce speed. Full-width and partial-width gates use matching phase colors and symbols, with advance HUD warnings. Best times are saved per level, along with the furthest reached checkpoint, when storage is available.

Controls: **A/D or left/right** steer; **Space, Up, or J** jump; **W or Shift** boost; **1/2/3** select Ion/Sol/Flux; **S or Down** triggers a short brake pulse; **R** retries the current checkpoint; **P/Escape** pauses. Touch buttons support simultaneous steering, boosting, and phase selection. Focus loss pauses the race. Choose **Driving only** on the start screen for the continuous empty course with no strips, gates, walls, or gaps (jump remains available); these runs do not overwrite phase-race records.

The racer uses separate `src/racer/` modules. These are temporary procedural prototype visuals, not final recipe art. User-owned gameplay testing remains pending; no tests or visual gameplay review were performed. See `docs/PHASE_RACER.md` for implementation details and tuning.

If the default Vite config bundler encounters restricted-directory access on Windows, use `npm run build -- --configLoader native` (and the same flag for dev/preview).

## Preserved highway prototype

A ground-skimming scrolling shooter with cruise, unlimited fast mode, deliberate braking, and a separate rechargeable boost. Speed modes are player-controlled anywhere on the track.

**Agent workflow:** Read `AGENTS.md`. The user owns testing. Agents review source and rebuild playable changes, without running tests or visually reviewing gameplay.

This is a **temporary primitive-only mechanics study**, not a submission-ready art build. The name is a working title.

## Development

Requires Node 20 or newer.

```sh
npm install
npm run dev
```

PC: WASD / arrows reposition, Shift holds fast mode, Ctrl brakes, and Space holds boost. Mobile: steer with the circular stick (or drag on the play area); moderate up/down repositions, the forward edge activates fast mode, and the backward edge brakes. The other thumb holds BOOST. Braking cancels boost and requires releasing/repressing its button to reactivate. Weapons fire automatically. P / Escape pauses; R restarts.

The first approved build is preserved at Git tag `prototype-01-zone-transitions` (commit `23ed7a1`). The current experiment is mechanics lab 012: a continuous main level mixing all four encounters, with driving breaks and persistent health, score and boost. The main level is selected by default; individual encounters and the original highway remain available. Normal red reinforcements are disabled in encounters. Merge roads now sit below the highway and begin at primitive tunnel exits. Shooter visibility is checked against the actual camera before firing. Choose a test on the start screen; retry it or use **Encounters** to choose another. Kills and full clears pay substantially more than escapes; labeled salvage pays 600 points. **Highway run** keeps the existing traffic/ramp experiment available. See `docs/ENCOUNTERS.md` for behaviors and tuning values.

Speeds are 12 m/s braking, 26 cruising, 82 fast, and 122 boosting. A full boost tank lasts four seconds, recharges after a 2.5-second delay at 5% per second, and requires at least 15% to start a fresh activation. Empty tanks cannot pulse automatically while held. The HUD displays energy and recharge state. Boost strengthens the adjustable wind/shake effects.

In the highway run, slow neutral yellow vehicles have 160 HP and remain fatal on contact except in practice. Six ramps introduce scouts and purple shield rows, which fire left to right. Race past a merging formation or return to cruise and shoot a gap. Destroyed slots remain open through narrowing and leave holes in the firing sequence. Convoy encounters now drop score pickups; weapon upgrades and special recharge lanes/actions remain deferred.

The ship follows bends automatically; steering moves across the road. Ships, camera, lane marks, barriers, and shots share the road's local orientation. Shots leave along that direction and then fly straight.

Shield rows travel close to combat speed. Return to cruise to match an intact carrier ahead while shooting. Destroying it restores normal speed; contact gives a brief recovery slowdown. Fast mode and boost bypass following; brake always takes priority.

```sh
npm test
npm run build
npm run preview
```

## Project boundaries

- This repository is the game. `../recipe/` is a separate checkout of the official 404 recipe tooling, not an example game copied into this project.
- Simulation and hitboxes are independent of the replaceable render objects.
- All current visible geometry is marked as prototype geometry. Final 3D assets must go through the 404 recipe before submission.
- No reference-game code or assets are used.
- See `docs/JAM.md` for rules and the outstanding submission work; `docs/BUILD_LOG.md` records development.
- See `docs/DESIGN.md` for the mechanics experiment and `docs/VALIDATION.md` for the local gate result. A local PASS is not a submitted entry.






