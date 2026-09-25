# Campaign areas — roadmap

## Goal
Deliver the first eight authored levels: Dockyards foundations followed by Conduits passage flow, with area selection, saved completion and safe area boundaries.

## Assumptions
- This implements the proposed first two areas, not all 24 levels at once.
- Existing flat and inside profiles cover these areas. Configurable mixed-surface courses belong to later areas.
- The user owns all testing. Agent verification is source review and production build only.
- User update: remove the old campaign and Overload entirely. New courses start with fresh saves and records.

## Out of scope
- New physics, models, mid-level respawns and the remaining four areas.

## Phases

### Phase 1 — Authored encounters
**Implementation checklist**
- [x] Add stable area/level definitions, deliberate encounter phrases and contextual teaching cues.
- [x] Route `src/racer/levels.js` through the new definitions, remove the old campaign and preserve construction reviews.

**Verification checklist**
- [x] Source-review passage widths, steering distances, safe approaches and the worker configuration path.

### Phase 2 — Area progression
**Implementation checklist**
- [x] Add stable-ID completion storage and area selection in `main.js` / `racer.html`.
- [x] Stop at area boundaries and the final level; preserve safe checkpoint flow within areas.
- [x] Bound next-level prefetch and remove the old unbounded all-level cache.

**Verification checklist**
- [x] Source-review unlocks, retries, reloads, final completion and construction-review branches.

### Phase 3 — Delivery
**Implementation checklist**
- [x] Update campaign documentation and provide normal/practice preview links.

**Verification checklist**
- [x] Production build passes; no tests or visual gameplay inspection.
- [x] Document remaining user-owned tuning feedback.

Build passed with the existing shared Three.js chunk-size warning. User gameplay evaluation remains pending, particularly passage rhythm, generous widths, recovery spacing and menu presentation.
