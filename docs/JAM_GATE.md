# Racer jam gate integration

The racer exposes the official gate hooks in normal play, without a special test mode:

- `window.__READY__` starts false and becomes true after course assets and shader preparation are ready, a frame has rendered, and the menu's Race button is enabled. Loading or initialization failure does not report readiness.
- `window.__GAME__.pos` is the real player's track-surface world X/Z position in metres, computed from the simulation. Menu-demo movement never changes it.
- `fps` uses the actual animation-frame interval, before the simulation's time clamp or review slow motion.
- `draws` and `tris` come from the renderer after the full frame, including postprocessing passes. The existing pipeline resets its counters once per frame.
- `speed` and `status` report simulation state; loading during a race reports `buffering`.

New visitors can leave the pilot name blank and tap Race immediately. Their campaign times remain queued locally until they save a name; the leaderboard service does not upload unnamed times. Entered names still receive normal validation.

## Official command

From an installed checkout of the official `404-game-recipe`, use the real racer controls:

```sh
node harness/jam.mjs https://aguspepito.github.io/ --commit=<deployed-full-sha> --start="#start" --hold="#thumbpad"
```

The selectors are necessary because the official defaults refer to differently named controls. Include this command with the submission so the organiser can reproduce it. Use the normal phone run, without `--desktop`, and paste its verdict unedited.

For a local production preview, the racer is at `http://127.0.0.1:4173/racer.html`; only Pages packaging promotes it to the homepage. A local result does not replace the required deployed-URL verdict.

Implementation source-reviewed and production build performed on 2026-09-25. No gate, tests, browser smoke checks, or visual gameplay review were run, following the user's standing instruction. This integration is not a gate PASS or a claim that size/loading/render budgets have been met.
