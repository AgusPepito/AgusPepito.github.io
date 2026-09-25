# Race screens — roadmap

## Goal
Apply the main menu and pause screen's graphite, cyan and amber styling consistently across player-facing overlays, including every crash and completion variant, controls, loading and errors.

## Phase 1 — Shared screen treatment
**Implementation checklist**
- [x] Update result markup and state labels in `racer.html` and `src/racer/main.js`.
- [x] Style result, pause, controls, loading and notices through shared screen styles; group leaderboard and menu secondary actions.

**Verification checklist**
- [x] Review source branches and responsive rules. User owns testing; no tests or visual playtesting.

## Phase 2 — Delivery
**Implementation checklist**
- [x] Rebuild the playable preview.

**Verification checklist**
- [x] Production build succeeds (`npm run build -- --configLoader native`). Existing bundle-size warning remains.
