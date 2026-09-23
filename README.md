# VECTOR SHIFT — mechanics prototype

A ground-skimming scrolling shooter. Hold Space, either Shift key, or the on-screen OVERDRIVE button to lower the camera and accelerate anywhere on the track. Release to return to combat. Narrow bends and barriers make holding overdrive more dangerous; zones never activate it automatically.

**Agent workflow:** Read `AGENTS.md`. The user is the sole visual gameplay tester; agents perform nonvisual checks and hand over playable changes for user feedback.

This is a **temporary primitive-only mechanics study**, not a submission-ready art build. The name is a working title.

## Development

Requires Node 20 or newer.

```sh
npm install
npm run dev
```

Use WASD / arrows or drag on the play area. Hold Space / Shift / OVERDRIVE to race. On touchscreens, steer with one finger and hold OVERDRIVE with another. Weapons fire automatically. P / Escape pauses; R restarts. The settings panel allows camera and speed changes to be compared independently.

The first approved build is preserved at Git tag `prototype-01-zone-transitions` (commit `23ed7a1`). The current experiment is mechanics lab 005: slow neutral yellow vehicles with 160 HP, six enemy merge ramps per lap, and purple shield rows firing from left to right. Race past a formation before it deploys, or release overdrive and shoot a gap. Destroyed slots stay open as the road narrows and leave holes in the firing sequence. Yellow vehicle contact remains fatal except in practice mode. Drops and upgrades are not implemented yet. Tune includes independent camera-shake and wind-streak sliders (18% and 30% defaults; zero disables each).

The ship follows bends automatically; steering moves across the road. Ships, camera, lane marks, barriers, and shots share the road's local orientation. Shots leave along that direction and then fly straight.

Shield-row balance revision: carriers now have half their original health and travel closer to combat speed. Release overdrive to brake and match the intact carrier ahead while shooting. Destroying it restores normal speed; contact gives a brief recovery slowdown instead of immediately trapping you against the row.

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
