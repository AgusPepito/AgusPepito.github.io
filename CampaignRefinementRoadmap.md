# Campaign refinement — roadmap

## Goal
Show complete area cards with clear navigation and campaign completion, make hints and loading readable, and give all eight courses more active steering/phase patterns with short checkpoint exits.

## Assumptions
- Keep the existing two-area progression and saved clears; count actual implemented courses.
- The user owns testing. Agent verification is source review and a production build only.
- Keep mechanics, collision rules and construction-review layouts unchanged.

## Phases

### Phase 1 — Area navigation
**Implementation checklist**
- [x] Update `campaign-menu.js`, `menu.css` and `racer.html` for full cards, prominent arrows, eased browsing and dynamic total completion.

**Verification checklist**
- [x] Source-review browsing, selection, locked areas, touch, keyboard and reduced motion.

### Phase 2 — Notices and loading
**Implementation checklist**
- [x] Give gameplay hints a contrasting solid surface and readable hierarchy.
- [x] Replace the loading toast with a course-specific loading panel, progress and clear error state in `loading-ui.js` / `main.js` / `racer.html` / `menu.css`.

**Verification checklist**
- [x] Source-review menu/race loading, buffering, errors and progress semantics.

### Phase 3 — Course pacing
**Implementation checklist**
- [x] Retune all `campaign.js` courses, with separated tube openings, increasing turns/reversals and short exits.
- [x] Update campaign and UI documentation.

**Verification checklist**
- [x] Review authored widths, steering distances, hint timing and checkpoint clearances against physics source.
- [x] Rebuild the playable preview; run no tests or visual gameplay inspection.

Production build passed on 2026-09-25 with the existing shared Three.js chunk-size warning. User evaluation of difficulty and appearance remains pending.

## Risks
- Difficulty is a tuning pass for user evaluation, not a claim of playtested balance.
- Existing clears remain valid; timing records must distinguish the revised layouts.
