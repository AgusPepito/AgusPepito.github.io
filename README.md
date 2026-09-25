# VECTOR SHIFT — mechanics prototype

## Play online

GitHub Pages: https://aguspepito.github.io/ — Phase Racer is the homepage. The release package contains only the racer; the preserved highway prototype and asset inspectors remain available through the local development server.

Pushing `main` publishes through `.github/workflows/pages.yml`. The workflow installs dependencies, builds the racer and its runtime media, packages `pages-dist/`, and deploys to Pages. It does not run tests. `npm run build` produces the final game in `dist/`; `npm run build:tools` preserves the full development build separately in `tools-dist/`. The racer production preview remains `/racer.html`. Progress and local records are stored per browser/site. Online leaderboards share published scores, but local preview and hosted-game player identities are separate. See [release packaging](docs/RELEASE_PACKAGE.md).

**Per-level leaderboards:** Set your **Pilot name** on the main menu. The **Top times** chart automatically loads submitted records for the selected course. Local example pilots fill any remaining places until ten real players have submitted times; they are never uploaded or counted as records. Campaign completions publish automatically under your saved pilot name. Activate the database with `supabase/leaderboard.sql` and enable anonymous sign-ins first; see [leaderboard setup](docs/LEADERBOARDS.md). Practice runs remain unranked.

## New: Phase Racer

Open `/racer.html` for the racer. On the development server, the original highway game remains at `/index.html`, preserved before the pivot in commit `90f2982`. Only the racer is included in the final production build.

The campaign contains **24 authored levels across six areas**: **Dockyards** (banked slaloms, phases and early tube folds), **Conduits** (rotating phase passages), **Broken Span** (tube jumps and landing routes), **Relay Grid** (phase rhythm, steering and hurdles), **Outer Ring** (exterior helices and flight), and **Nexus** (combined skills and surface transitions). Each area's first course introduces its focus; the other three immediately mix previously learned skills. Authored bends and banking replace long straight runs. Clear an area's four levels to unlock the next. Checkpoints refill boost and continue within an area; incompatible starting surfaces reset the ship pose. Area boundaries stop at a completion screen. Retries restart the current level. The previous campaign and repeating Overload rounds have been removed.

Use **Practice** to select any of the 24 courses without recording completion or best times. A direct example is `/racer.html?practice=1&level=conduits-spiral`. Completion uses stable course IDs, so existing clears and unlocks remain intact. Best times use the R3 layout revision; earlier records remain stored separately. Each area has representative artwork and four level buttons, with a total cleared/24 counter. Contextual teaching prompts appear in area introductions; later courses retain the live action cues. See `docs/CAMPAIGN_AREAS.md` for the level list and tuning notes.

The mechanics include three phases, manual boost, braking, surface-relative jumping and 360-degree tube steering. The first eight levels require no jumps or boost-assisted gaps. Broken Span introduces those in order; powered approaches supply the long-gap launches even with an empty battery. Cruise is 110 m/s, matching lanes reach 154 m/s, manual boost reaches 250 m/s, and both together reach 285 m/s. Boost lasts four seconds and speed decays gradually on release. Existing models, movement rules and construction-review routes remain in use. Nexus adds authored surface schedules shared by collision, rendering and worker geometry. Geometry loading retains the current course and a bounded next-course prefetch; the former all-level cache has been removed.

Controls: **A/D or left/right** steer; **Space, Up, or J** jump; **W or Shift** boost; **1/2/3** select Ion/Sol/Flux; **S or Down** triggers a short brake pulse; **R** retries the current checkpoint; **P/Escape** pauses. Touch pads support simultaneous steering, boosting, and phase selection. Focus loss pauses the race.

The racer uses separate `src/racer/` modules. These are temporary procedural prototype visuals, not final recipe art. User-owned gameplay testing remains pending; no tests or visual gameplay review were performed. See `docs/PHASE_RACER.md` for implementation details and tuning.

If the default Vite config bundler encounters restricted-directory access on Windows, use `npm run build -- --configLoader native` (and the same flag for dev/preview).

## Preserved highway prototype

A ground-skimming scrolling shooter with cruise, unlimited fast mode, deliberate braking, and a separate rechargeable boost. Speed modes are player-controlled anywhere on the track.

**Agent workflow:** Read `AGENTS.md`. The user owns testing. Agents review source and rebuild playable changes, without running tests or visually reviewing gameplay.

This is a **temporary primitive-only mechanics study**, not a submission-ready art build. The name is a working title.

## Development

Requires Node 22.12 or newer.

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






