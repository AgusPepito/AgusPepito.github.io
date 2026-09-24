# Track module library — staged generation and user approval

Status: category 01 revision 1 approved by the user on 2026-09-24. Category 02 revision 1 approved by the user; categories 03 and 04 revision 1 awaiting review, jointly authorized. Individual asset viewer: library.html.

Current extension, 2026-09-24: user authorized revising category 05 around reuse of R3 and building categories 05–06 together. Their first samples are delivered for review; this authorization does not imply visual approval of either sample. See [05–06 delivery](art/track/05-06-mixed-lanes-r1.md).

Visual direction: dark graphite running surfaces, ivory structural framing, recessed mechanical service bays, restrained phase colors. References: [track concept images](art/track/README.md).

## Visibility and scope rules

- Build for the actual chase camera, including steering around both tube types, jumps and transitions. An asset-viewer underside view does not justify gameplay detail.
- Before generating an item, record where the player sees it. If no normal gameplay view exposes it, omit it.
- Do not build fully detailed undersides, internal skeletons, buried pipes, backside bolts or machinery behind opaque panels.
- Where an edge, opening, jump or transition exposes a cut surface, add only the visible depth: a shallow fascia, beam end or sealed cross-section. Extend it only if the user finds a visible hole.
- Outside-tube supports buried inside the tube and inside-tube supports buried outside it are omitted. Use visible flush panel bands where structural rhythm is needed.
- Grilles may have a dark backing and a shallow visible recess; do not model an entire hidden room behind them.
- Decorative edges must not protrude into the driving/collision envelope. Any intentionally collidable feature belongs to the obstacle category.
- Phase colors remain gameplay information. Neutral construction details must not resemble active phase lanes or safe-passage indicators.
- Reuse geometry, materials, mirrored placement and generated curvature. Do not create separate copies for every side, phase or road shape.
- Do not automatically expand this library. New items need a demonstrated visible purpose in a review segment.

## Working loop — applies to every category

1. Define a small segment and list exactly which surfaces the player can see.
2. Generate the listed modules/assembly using the recipe, preserving references and generation notes.
3. Build a selectable review segment with the real chase camera, current steering/jump/turbo controls, a retry action and a clear category/revision label. Keep previous approved revisions available for comparison.
4. Give the user the playable URL and a short list of things to assess. The user performs all visual/gameplay testing. Do not generate or run automated tests, visual inspection loops or verification harnesses without separate authorization.
5. Record feedback, revise the same category, rebuild, and hand it back.
6. Record explicit user approval and the approved commit/revision before advancing to dependent categories. Silence is not approval.
7. Integrate approved work into the next review segment. Approval of a segment is not proof that the final game passed the official jam gate.

Each delivery includes the segment URL, revision, visibility decisions, reused modules, known limitations and a build result. Build/source review are allowed. Official asset verification and the final jam gate remain separately pending under the standing no-tests instruction.

## R2 correction — raised roadside architecture

User clarified that the reference's upright roadside housings were the intended assets, not shallow floor inserts. R1 remains available, but R1 acceptance does not approve the revised R2 structures. Categories 01–04 R2 were authorized together and now await user review. Road skin remains unchanged. Category 05 was outside this R2 pass; its later delivery is recorded below.

- [x] Raised common ivory frame, roof cap, sloped start/middle/end.
- [x] Inward-facing pipe bundle, coupling, valve and offset variants.
- [x] Upright lattice, louver and reinforced grille variants.
- [x] Raised plain/segmented armor, service hatch and vent variants.
- [x] Separate R2 drive segments and individual asset library with R1/R2 selection.
- [ ] User review and explicit R2 approval for categories 01–04.

Delivery: [Raised roadside R2](art/track/01-04-raised-r2.md).

## Approval ledger

| Category | Output | Status | Approved revision |
|---|---|---|---|
| 01 | Bare flat construction sample | Approved 2026-09-24 | 01-r1 |
| 02 | Pipe-bay straight | Approved 2026-09-24 | 02-r1 |
| 03 | Grille-bay straight | R1 awaiting user review | — |
| 04 | Covered-bay straight | R1 awaiting user review | — |
| 05 | Mixed R3 housing assembly | R1 awaiting user review | — |
| 06 | Flat phase-lane sample | Approved 2026-09-24 after visibility/Play fixes | 06-r1 |
| 07 | Outside-tube sample | Not started | — |
| 08 | Inside-tube sample | Not started | — |
| 09 | Flat ↔ outside transition sample | Not started | — |
| 10 | Flat ↔ inside transition sample | Not started | — |
| 11 | Gap samples on all road types | Not started | — |
| 12 | Obstacle samples on all road types | Not started | — |
| 13 | Checkpoint samples | Not started | — |
| 14 | Landmark / repetition sample (optional) | Not started | — |
| 15 | Combined construction course | Not started | — |

## 01 — Flat road foundation and common bay frame

Depends on: none. This establishes dimensions and attachment conventions for later work.

Items:
- [x] Continuous flat road-skin generator with panel courses and flush seams.
- [x] Standard/long panel pattern; variation through layout rather than new meshes for every panel.
- [x] Flush transverse expansion joint.
- [x] Common side-bay mounting frame with attachment points, length and clear playable boundary.
- [x] Bay start trim, repeating frame, divider and end trim.
- [x] Open-road edge trim: start / middle / end.
- [x] Shallow outer fascia only where visible; omit the concealed road underside.
- [x] Visible bracket, splice and end-cap shapes only where the camera exposes them.

Review segment: a short flat straight with at least three adjacent empty bay frames on both sides. Include one visible termination and a gentle bend so joins can be assessed from the chase camera.

User checks: road width/readability, convincing frame depth, joins, edge clearance, and whether detail survives racing speed.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [x] Feedback addressed and explicit approval recorded. User: “ok. its approved” (2026-09-24).

Revision 1 delivery and visibility notes: [01-foundation-r1](art/track/01-foundation-r1.md).

## 02 — Exposed pipe service bays

Depends on: 01.

Items:
- [x] Start bulkhead with visible pipe sockets.
- [x] Repeatable straight pipe bundle.
- [x] Repeatable coupling section.
- [x] Repeatable valve section.
- [x] Repeatable offset-pipe section.
- [x] End bulkhead with sealed connections.
- [x] Any supports visible through the bay; omit concealed attachment detail.

Review segment: flat straight containing start → straight → coupling → straight → valve → offset → end. Use the common frame on both sides with different bay sequences.

User checks: recognizable pipes at speed, convincing connections, no obvious gaps or objects poking into the road, useful differences between middle pieces.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [x] Feedback addressed and explicit approval recorded. User: “ok approved” (2026-09-24).

Revision 1 delivery: [02-pipes-r1](art/track/02-pipes-r1.md).

## 03 — Grille service bays

Depends on: 01; review after 02.

Items:
- [x] Grille start frame.
- [x] Repeatable open-lattice grille.
- [x] Repeatable angled-louver panel.
- [x] Repeatable reinforced grille panel.
- [x] Closing frame/end trim.
- [x] Dark backing/shallow recess where visible through the grille; no hidden machinery by default.

Review segment: flat straight with each grille variant repeated several times, followed by a boundary to the approved pipe family.

User checks: grille readability, flicker/shimmer on mobile, panel thickness, distinction from pipes without adding excessive visual noise.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 04 — Covered metal service bays

Depends on: 01; review after 03.

Items:
- [x] Tapered armor start piece.
- [x] Repeatable plain covered panel.
- [x] Repeatable segmented armor panel.
- [x] Repeatable service-hatch panel.
- [x] Repeatable vented panel, with shallow backing if needed.
- [x] Tapered armor end piece.
- [x] Sparse visible seams/fasteners only if readable; nothing behind opaque armor.

Review segment: a flat straight alternating long quiet covered runs with short hatch/vent runs, and one change to approved grille bays.

User checks: calm surfaces, useful silhouette/shading detail, start/end transitions, material consistency across families.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

Joint revision 1 delivery: [03-04-surface-kits-r1](art/track/03-04-surface-kits-r1.md).

## 05 — Mixed assembly and connection cleanup

Depends on: 02–04 R3 geometry. User authorized this assembly pass alongside 06 on 2026-09-24.

Items:
- [x] Reuse full-height R3 start/end interfaces for family changes; no new pairing-specific divider meshes.
- [x] Reuse sealed ends and corrected ramp caps at exposed run boundaries.
- [x] Reuse the empty R3 frame family within continuous housing runs.
- [x] Select start / middle / end from neighboring bays across chunk boundaries; no artificial connectors at every 100 m cut.
- [x] Authored, reproducible unequal runs with quiet armor stretches, sparse service variants and exposed-road intervals. Left and right use different arrangements.
- [x] Reuse existing geometry factories and material-based road-chunk batching.

Deferred unless a demonstrated need appears: short filler bays (12.5 m pitch already fills chunks), separate blank caps, seeded procedural variation and further instancing. These are not missing models in this delivery.

Review segment: a 1,800 m flat road using R3 pipes, grilles, covers and empty frames in unequal run lengths. Retry reproduces the same authored layout. The library also offers three isolated family joins and two compact road assemblies.

User checks: roof/interface continuity, repetition at cruise and turbo, visual clutter and mobile performance.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 06 — Phase lanes and restrained road markings

Depends on: 05. Joint implementation authorized by the user; review remains pending.

Items:
- [x] Phase-lane start / repeatable middle / end inserts, with dark beds, shallow rims and endpoint symbols.
- [x] One geometry family with cyan/amber/violet material parameters; nine selectable lane variants.
- [x] Neutral flush edge markers for orientation through bare-road intervals.
- [x] Restrained colored emitters housed within the active lane borders. Separate powered roadside lights omitted; neutral markers suffice for the initial sample, subject to user feedback.

Review segment: flat mixed-bay road with all three phase lanes, neutral intervals and lane endpoints. Use actual matching-lane turbo behavior.

User checks: immediate phase readability, lane width, glow level, separation from decoration, road visibility while boosting.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

Delivery: [05–06 mixed assembly and lanes R1](art/track/05-06-mixed-lanes-r1.md). User accepted the repaired 06 sample on 2026-09-24: “ok it works now i like it”, requested a local commit and authorized categories 07–08 together. Category 05's individual join review is not inferred from that feedback.

## 07 — Outside tube

Depends on: 06.

Items:
- [ ] Convex road skin and panel-course mapping using the established surface system.
- [ ] Flush circumferential rib/band appearance; no raised structures across the driving path.
- [ ] Flush tube closure seam.
- [ ] Curvature-following bay frames and rigid fitting placement where genuinely visible.
- [ ] Narrow visible mouth thickness/end cap for the sample entrance; omit buried internal support rings.

Review segment: a complete outside tube long enough to steer a full 360 degrees. Include approved phase lanes and a few service sections, with no new hazards.

User checks: seam continuity, all-around readability, visible joins, accidental protrusions, whether service decoration remains useful on this road type.

- [ ] Visibility notes recorded; unnecessary internal geometry explicitly omitted.
- [ ] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 08 — Inside tube

Depends on: 07.

Items:
- [ ] Concave road skin and panel courses.
- [ ] Flush interior bands and closure seam.
- [ ] Recessed service bays only where they do not remove or obstruct the driving surface.
- [ ] Tube-mouth trim with only the visible exterior thickness.
- [ ] Restrained neutral illumination sufficient to read all sides.

Review segment: complete inside tube with 360-degree steering, all service families where appropriate and a phase lane winding around the circumference.

User checks: visibility of floor/walls/ceiling, camera clearance, light levels, phase readability and repetitive tunnel rhythm.

- [ ] Visibility notes recorded; concealed outer skeleton omitted.
- [ ] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 09 — Flat ↔ outside-tube transitions

Depends on: 07–08.

Items:
- [ ] Smooth variable-cross-section surface assembly.
- [ ] Curvature-following edge trim and panel seams.
- [ ] Variable rib/band shape only on visible faces.
- [ ] Tapered panel/wedge filler where an actual visible gap needs closure.
- [ ] Segmented bay frame and articulated/flexible conduit joints where exposed.
- [ ] Edge convergence/divergence piece as the tube closes/opens.
- [ ] Reuse the same assembly in reverse instead of separate duplicate assets.

Review segment: flat → partial convex curl → full outside tube → flat, with a continuous phase lane and a service-family change through the transition.

User checks: smooth closure, no scalloped discontinuities, no stretched fittings, good visibility while steering near changing edges.

- [ ] Visibility notes recorded.
- [ ] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 10 — Flat ↔ inside-tube transitions

Depends on: 09.

Items:
- [ ] Smooth trough → U → C → closed interior surface assembly and reverse.
- [ ] Reuse approved transition seams, frames and filler logic.
- [ ] Interior edge closure trim; no separate giant portal hiding a discontinuity.
- [ ] Additional visible connectors only if the concave assembly exposes a new need.

Review segment: flat → inside tube → flat, then a short outside section connected through flat road. No direct outside-to-inside inversion in this library's first version.

User checks: visibility as walls rise, no abrupt closing roof, clean joins, camera/road clearance and coherent structural language.

- [ ] Visibility notes recorded.
- [ ] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 11 — Gaps and visible cut ends

Depends on: 10.

Items:
- [ ] Full-width takeoff and landing lips.
- [ ] Partial-gap border trim.
- [ ] Exposed deck cross-section with shallow fascia.
- [ ] Visible cut beam cap and sealed pipe end, reusing existing terminations.
- [ ] Warning-light housing where it helps identify the edge.
- [ ] Assembly rule cutting surface, markings, bays, conduits and supports together.

Review segment set: one flat, one outside-tube and one inside-tube segment, each offering a full gap and a partial gap with generous recovery room. Preserve current jump/collision rules.

User checks: jump-edge visibility, convincing exposed ends, no decorative bridges across gaps, landing clarity, views briefly exposing lower faces during jumps.

- [ ] Visibility notes recorded; only actually exposed cut faces detailed.
- [ ] Segment set delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 12 — Obstacles

Depends on: 11.

Items:
- [ ] Phase-gate emitter post/strip and modular frame.
- [ ] Solid wall panel with base and top cap.
- [ ] Passage jamb/lintel and clear opening trim.
- [ ] Low jump-barrier middle and end caps.
- [ ] Assemblies for opening-only, jump-or-opening and jump-only obstacles.
- [ ] Surface-conforming placement across all road types without changing collision dimensions.

Review segment set: the same spaced obstacle sequence on flat, outside and inside surfaces, with a final transition approach. Reuse existing guide behavior.

User checks: obstacle types readable at speed, visual openings agree with collisions, colors do not confuse phase requirements, enough approach visibility.

- [ ] Visibility notes recorded; rear detail limited to views actually encountered.
- [ ] Segment set delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 13 — Checkpoints

Depends on: 12.

Items:
- [ ] Gantry support and crossbeam for flat sections.
- [ ] Surface-following ring/arch arrangement for tubes.
- [ ] Distinct neutral timing-light cluster.
- [ ] Visible attachment/bracket reuse; no hidden machinery.

Review segment set: approach and pass a checkpoint on each road type, continuing into a clear recovery section. Retain uninterrupted progression and boost refill.

User checks: recognizability at speed, distinction from phase gates, unobstructed passage, notification timing and continuity.

- [ ] Visibility notes recorded.
- [ ] Segment set delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 14 — Sparse landmarks (optional; only if repetition still needs it)

Depends on: 13 and explicit decision to include this category.

Choose only landmarks with a useful visible position:
- [ ] Heavy support/pylon silhouette seen beyond a road edge.
- [ ] External utility/platform silhouette seen on approach.
- [ ] Larger visible pipe junction using approved pipe pieces.
- [ ] Distant antenna or station connection.
- [ ] Large approach ring or bridge that does not obscure hazards.

Review segment: a longer approved course with two or three landmark events separated by quiet sections. Show where each is visible from the chase camera.

User checks: orientation and variety, no interference with guidance, no distracting clutter, acceptable performance.

- [ ] Included items and their visibility explicitly recorded; remaining items omitted.
- [ ] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded, or category skipped by user.

## 15 — Combined construction course and library handoff

Depends on: 01–13 approved; 14 approved or explicitly skipped.

Items:
- [ ] Assemble flat → outside → flat → inside → flat with approved transitions, mixed bays, lanes, gaps, obstacles and checkpoints.
- [ ] Consolidate shared dimensions, sockets, materials, start/middle/end assembly rules and visibility/culling distances.
- [ ] Reuse rigid meshes through instancing where practical; keep surface generation chunked.
- [ ] Avoid hidden geometry, decorative collision mismatches and unnecessary overlapping surfaces.
- [ ] Record approved modules, source references, discarded revisions, known limits and pending official verification.

Review output: one selectable construction course, plus access to each category's approved sample. User tries desktop/mobile, both orientations and representative cruise/turbo runs.

- [ ] Combined course delivered for user testing.
- [ ] Final visual/control/performance feedback addressed.
- [ ] User approves integration into the main campaign.
- [ ] Official verification/gate status recorded separately; never inferred from a successful build.

## Feedback record template

Copy for each delivered revision:

- Category / revision:
- Segment URL:
- Commit:
- Visible surfaces and camera situations:
- Hidden items deliberately omitted:
- Reused modules:
- Changes since previous revision:
- Source/build result:
- Known limitations / pending checks:
- User feedback:
- Decision: awaiting review / revise / approved / skipped
- Approval message or date:

## Deliberately outside this first library

- Fully detailed undersides and buried tube structures.
- A unique complete mesh for every repeated bay, side or phase color.
- Direct outside-to-inside inversion.
- New branches, junctions or width-changing gameplay not already needed by the course.
- Dense decorative machinery, distant microdetail or modelled interiors behind opaque panels.
- Automatic visual review, automated gameplay tests, or implicit approval of later stages.





R2 interface clarification: start/end pieces connect different families at full height; ramp-start/ramp-end are separate infrequent caps at exposed run boundaries. See the R2 delivery notes for the revised samples.

R3: user requested a single detailed pipe-housing candidate with a 30-degree lean before revising the whole kit. Candidate delivered in library category 02, asset detail-r3; approval pending. Existing assets preserved. See R2 delivery notes for the candidate record.

## Detailed R3 set completion

User approved the detailed pipe candidate and 30-degree profile, authorizing the same pass across the four existing raised sets. All 28 R3 modules delivered: frame 5, pipe 8, grille 7, cover 8. Original candidate, R1 and R2 preserved. Full-height connectors remain distinct from rare ramp caps. Individual new variants await user review. Categories 05–06 were subsequently authorized and delivered using this set; category 07 and later remain pending.

Delivery and URLs: [01-04-detailed-r3](art/track/01-04-detailed-r3.md).

R3 ramp correction, 2026-09-24: corrected the reversed shoulder split positions in all eight ramp caps across categories 01–04. Beam/panel splitting now derives from the same interval as the taper. Production build passed; user visual review pending. See the R3 delivery notes for the cause and scope.
