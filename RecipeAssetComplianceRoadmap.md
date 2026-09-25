# Recipe asset compliance — roadmap

## Goal
Make every active reusable model a self-contained recipe module, preserving the final racer's geometry, batching, effects and placement.

## Assumptions
- Source review and builds only. The user owns tests and visual gameplay verification.
- Historical, unused studies are not submission assets; identify the active set explicitly.
- Surface finishes and animation belong to game loading/rendering, outside standalone models.

## Phase 1 — Standalone models
**Implementation checklist**
- [x] Inline procedural geometry helpers in active `public/assets/track` modules.
- [x] Split compact passage, decorations and asteroid prototypes into individual modules.
- [x] Return Groups with standard materials and vertex-measured ground origins.
**Verification checklist**
- [x] Review generated source interfaces, material declarations and origin handling.

## Phase 2 — Runtime integration
**Implementation checklist**
- [x] Add explicit placement adapters and shared surface/effect application.
- [x] Update consumers, worker material transfer and scenery prototype extraction.
- [x] Preserve material names, shared resources, merging and instancing.
**Verification checklist**
- [x] Review import consumers and serialization paths from source.

## Phase 3 — Delivery
**Implementation checklist**
- [x] Document the active asset manifest and remaining user verification.
- [x] Rebuild release and playable preview.
**Verification checklist**
- [x] Production build and release packaging complete.
- [x] Record package size and hand off gameplay verification to the user.
