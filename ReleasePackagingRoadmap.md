# Release packaging — roadmap

## Goal
Publish only the final racer and its runtime dependencies, preserving original assets, development tools and genuine history in source control.

## Phase 1 — Build separation
**Implementation checklist**
- [x] Make the normal Vite build racer-only with an explicit runtime media list.
- [x] Retain development entry points in a separate tools build and local dev server.
- [x] Disable construction-review URLs in the final build to avoid omitted inspectors.

**Verification checklist**
- [x] Source-review file loads, worker dependencies, licenses and page links.

## Phase 2 — Publishing package
**Implementation checklist**
- [x] Refresh pages-dist from the final build and promote racer.html to the homepage.
- [x] Prevent old publication files surviving a rebuild.
- [x] Update deployment documentation and record resulting size.

**Verification checklist**
- [x] Rebuild and package; inspect file inventory and byte totals.
- [x] No tests, automated gameplay or visual review; user owns testing.
