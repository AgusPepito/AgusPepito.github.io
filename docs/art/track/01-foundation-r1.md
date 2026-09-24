# 01 — Flat foundation, revision 1

Status: approved by the user on 2026-09-24: “ok. its approved”. Category 02 authorized. Foundation asset R1 preserved unchanged.

Review: http://127.0.0.1:4173/racer.html?review=01

Original-surface comparison: http://127.0.0.1:4173/racer.html?review=01&surface=original

## Generation and scope

404 recipe route B: agent-authored JavaScript geometry. No hosted 404 model was called. Visual direction comes from `01-flat.png`: graphite road, ivory edge structure and shallow side service bays. This first construction revision implements the foundation, not the image's pipes, grilles or covers. One assembled candidate delivered for user iteration; official verification remains pending, including any required recipe candidate comparison.

Standalone source: `public/assets/track/flat-foundation-r1.js`, default function of THREE returning a Group. Runtime adapter: `src/racer/construction.js`. The adapter deforms the module along the existing road position function and batches its meshes by material per 100 m chunk. It preserves the driving surface at y=0.

## Dimensions and attachment convention

- Module: 100 m long, +Z entrance, centered X/Z, base y=0.
- Driving width: 36 m; local skin height 0.6 m. Collision envelope unchanged.
- Edge trim lies entirely beyond the playable boundary at x=±18 m.
- Bay centers: x=±20 m; z=-36, -12, 12, 36 m.
- Bay pitch 24 m; nominal width 3.2 m. Future inserts must leave room for the inner/outer trims, sockets and dividers.
- Backing height 0.15 m; nominal insert ceiling 0.6 m. Socket locations are visible on the inner edge at each bay center ±8 m along Z.
- Standard/long panel courses: 10/20 m; one shared generated pattern.

## Visibility decisions

Road top, bay tops/recesses, transverse divider faces and shallow outer fascia are visible from chase/edge/jump views. The surface has no underside mesh. No hidden skeleton, equipment behind panels, backside bolts, pipes or lower rooms were generated. Solid trim uses simple closed sections for clean visible ends; it has no underside detail.

## Review segment

1.8 km flat course with the existing gentle bends, real chase camera, steering, jump, turbo and brake. No hazards or phase lanes. Frames stop at 550 m and restart at 750 m, exposing their end caps. Four adjacent empty bays repeat on each framed side. End of sample restarts it; R or Pause → Retry restarts early. The review has its own URL and does not save campaign progress or times.

Assess road width, frame depth, seams through bends, edge clearance and detail readability at cruise/turbo on desktop/mobile. Frame repetition is deliberate for this foundation stage; mixed bay contents and repetition control arrive after approval.

## Delivery record

- Revision: 01-r1; uncommitted working tree.
- Build: production build completed; existing shared Three.js chunk-size warning remains.
- User/automated/visual testing: not performed by agent, per standing instructions.
- Official asset verifier/jam gate: not run, not claimed passed.
- Limitations: flat review only, original placeholder ship and lighting; no tube/transition art integration. Changes remain local until publication.
- Feedback: accepted; user requested a separate categorized individual-asset viewer. Delivered at library.html.
- Approval: 2026-09-24, revision 01-r1.

