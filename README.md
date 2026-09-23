# VECTOR SHIFT — mechanics prototype

A ground-skimming scrolling shooter. Wide track sections emphasize aiming and bullet dodging; narrowing bends, a lower camera, and increased speed emphasize choosing a safe racing line. The same controls work throughout.

**Agent workflow:** Read `AGENTS.md`. The user is the sole visual gameplay tester; agents perform nonvisual checks and hand over playable changes for user feedback.

This is a **temporary primitive-only mechanics study**, not a submission-ready art build. The name is a working title.

## Development

Requires Node 20 or newer.

```sh
npm install
npm run dev
```

Use WASD / arrows or drag on the play area. Weapons fire automatically. P / Escape pauses; R restarts. The settings panel allows camera transition and automatic speed changes to be compared independently.

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
