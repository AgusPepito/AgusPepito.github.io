# Remaining campaign areas — roadmap

## Goal
Complete the six-area campaign with sixteen distinct authored levels across Broken Span, Relay Grid, Outer Ring and Nexus, matching area artwork and gradual mastery of jumps, phase/steering combinations, exterior tubes and mixed surfaces.

## Assumptions
- Keep the eight revised courses, their saved clears and best times intact.
- Retain four levels per area and sequential area unlocks, for 24 total courses.
- Keep the denser obstacle pacing and short checkpoint exits requested by the user.
- The user owns all testing; use source review and a production build only.

## Out of scope
- Expert remixes, new physics, new obstacle models and mid-level respawns.

## Phases

### Phase 1 — Surface support and authoring
**Implementation checklist**
- [x] Support authored mixed-surface sections consistently in the track, worker and render paths for the Nexus layouts.
- [x] Add the sixteen courses and their contextual keyboard/touch prompts in `campaign.js`.
- [x] Handle incompatible surfaces at checkpoint handoffs without carrying an invalid pose.

**Verification checklist**
- [x] Source-review jump distances, landing clearance, boost supply, passage placement and transition margins against existing movement/collision code.
- [x] Source-review worker/renderer surface agreement and handoff logic.

### Phase 2 — Area identity and progression
**Implementation checklist**
- [x] Generate and save four project-local area banners; record final prompts.
- [x] Add area definitions, image references and dynamic campaign-completion text.

**Verification checklist**
- [x] Review generated artwork only; do not inspect gameplay.
- [x] Source-review six-area unlocking, practice access, final completion and bounded current/next prefetch.

### Phase 3 — Delivery
**Implementation checklist**
- [x] Update campaign delivery notes with all 24 courses and their design intent.

**Verification checklist**
- [x] Build the preview without running tests or visual playtesting.

Production build passed on 2026-09-25 with the existing shared Three.js chunk-size warning. All four banner files and their built-in image-generation prompts are recorded in `docs/art/ui/remaining-campaign-area-images-r1.md`. Difficulty and visual gameplay evaluation remain user-owned.
