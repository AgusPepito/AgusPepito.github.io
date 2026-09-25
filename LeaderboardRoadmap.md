# Per-level leaderboards — roadmap

## Goal
Publish each player's fastest campaign completion per course revision and display a Top 10 for all 24 levels.

## Assumptions
- Reuse `Race.time`: active simulation time, excluding pause and asset loading.
- Campaign completions only; practice and construction reviews remain unranked.
- Anonymous browser identity and a public pilot name set on the main menu before campaign racing; no email registration.
- This is a casual leaderboard with client-reported times, not verified competitive runs.
- User owns all testing. Agents only review source and build the preview.

## Phases

### Phase 1 — Database and client
**Implementation checklist**
- [x] Add SQL with private tables, bounded public read function and authenticated personal-best submission.
- [x] Add Supabase configuration, persistent anonymous identity and retryable pending scores.

**Tests / verification checklist**
- [x] Review SQL grants, ownership, revision separation and atomic best-time updates in source.

### Phase 2 — Game integration
**Implementation checklist**
- [x] Hook `src/racer/main.js` campaign completion before automatic checkpoint handoff.
- [x] Add nickname and Top 10 dialog using the existing ivory/graphite menu style.
- [x] Document Supabase activation and the timing/identity limitations.

**Tests / verification checklist**
- [x] Review asynchronous failure handling and keyboard/modal interaction in source.
- [x] Build the playable preview without running tests or visual review.
- [ ] User: activate SQL and anonymous sign-ins, then try publishing and viewing times.

### Phase 3 — Main-menu timing chart
**Implementation checklist**
- [x] Move pilot-name entry above the main-menu course picker; save it on Race.
- [x] Replace the dialog with a responsive elapsed-time chart that follows course selection.
- [x] Populate all 24 courses with ten stable invented pilots in a clearly marked Mock view; keep actual records in Live view.
- [x] Keep fixtures out of Supabase and the score upload queue; document the new flow.

**Tests / verification checklist**
- [x] Source review of course selection, name validation, asynchronous live requests and mock-data isolation.
- [x] Rebuild the playable preview; no tests or visual gameplay inspection.
- [ ] User: assess main-menu layout, chart, name entry and course switching.

### Phase 4 — Approved live-background menu concept
**Implementation checklist**
- [x] Restyle the existing live menu with separate area navigation and four named level rows.
- [x] Preserve completion/lock rules, readiness, practice, pilot setup, music and fullscreen controls.
- [x] Add the selected course to Race and show the actual personal best separately from Top time.
- [x] Match the approved graphite/cyan/amber concept with responsive panels and an open center.

**Tests / verification checklist**
- [x] Review selection, loading, score and navigation paths in source.
- [x] Build the playable preview without tests or visual inspection.
- [ ] User: review the implemented menu in the preview.

### Phase 5 — One leaderboard with temporary fillers
The user clarified that examples only fill unused space; this supersedes the separate Mock/Live modes from Phase 3.

**Implementation checklist**
- [x] Remove source selection and load online records automatically.
- [x] Fill remaining rows with unranked local examples, giving real players priority.
- [x] Keep example times out of record summaries, personal bests and database writes.
- [x] Retain cached real scores if refreshing fails and update documentation.

**Tests / verification checklist**
- [x] Source review of automatic fetching, filler replacement and refresh focus handling.
- [x] Rebuild the playable preview without tests or visual inspection.
