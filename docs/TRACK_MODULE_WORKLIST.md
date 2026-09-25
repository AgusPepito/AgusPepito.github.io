# Track module library — staged generation and user approval

Status, 2026-09-25: **the current delivered sets for categories 01–13 are approved by the user** ("all the phases except 14 are done"). Category 14 is deferred for later. Category 15's library handoff is delivered. [Existing campaign integration](art/track/campaign-library-integration.md) is implemented for user testing; the separate editable combined course and procedural system remain pending. Individual asset viewer: library.html.

Start here for integration: [Track library and procedural level handoff](TRACK_LIBRARY_HANDOFF.md). It records approved sources, dimensions, assembly rules, runtime gaps and a proposed iteration workflow. This latest approval ledger supersedes historical pending-review wording below and in older delivery notes; it does not imply that combined-course integration or official verification is complete.

Repository snapshot: `cda7883` is the latest local commit; later deliveries remain in the working tree. The handoff does not commit or discard those changes.

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
| 01 | Foundation and raised frames | Approved; current set confirmed 2026-09-25 | R3 with ramp correction; approved slab finish |
| 02 | Pipe bays | Approved; current set confirmed 2026-09-25 | R3 with ramp correction |
| 03 | Grille bays | Approved; current set confirmed 2026-09-25 | R3 with ramp correction |
| 04 | Covered bays | Approved; current set confirmed 2026-09-25 | R3 with ramp correction |
| 05 | Mixed R3 housing assembly | Approved; confirmed 2026-09-25 | Delivered R3-family assembly |
| 06 | Flat phase lanes | Approved; confirmed 2026-09-25 | R1 with visibility/Play fixes |
| 07 | Outside tube | Approved; confirmed 2026-09-25 | Approved slabs and R2 service variations |
| 08 | Inside tube | Approved; confirmed 2026-09-25 | Approved slabs and R2 service variations |
| 09 | Flat ↔ outside transitions | Approved; confirmed 2026-09-25 | R1 |
| 10 | Flat ↔ inside transitions | Approved; confirmed 2026-09-25 | R1 |
| 11 | Gaps on all road types | Approved 2026-09-25 | Complete R3 set, including caps/collars |
| 12 | Walls, passages, phase gates and jump barriers | Approved 2026-09-25 | W4 R2; P3, F1/F2 and J3 delivered sets |
| 13 | Checkpoints on all road types | Approved 2026-09-25 | R1 |
| 14 | Optional landmarks | Deferred by user; revisit later | — |
| 15 | Combined course and library handoff | Handoff delivered; course/integration pending | Documentation snapshot 2026-09-25 |

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

Depends on: approved 06-r1. Joint implementation with 08 authorized 2026-09-24.

Items:
- [x] Convex road skin with curved graphite panel courses, using the gameplay tube radius/profile.
- [x] Flush ivory circumferential bands; no raised structures across the driving path.
- [x] Flush tube closure seam.
- [x] Curved flush service frames, protective grilles, shallow pipes and sealed covers where exposed.
- [x] Narrow visible mouth thickness/end cap; buried internal support rings omitted.

Review segment: a complete outside tube long enough to steer a full 360 degrees. Include approved phase lanes and a few service sections, with no new hazards.

User checks: seam continuity, all-around readability, visible joins, accidental protrusions, whether service decoration remains useful on this road type.

- [x] Visibility notes recorded; unnecessary internal geometry explicitly omitted.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 08 — Inside tube

Depends on: shared 07 tube generator. Joint implementation authorized; neither tube's visual approval is inferred.

Items:
- [x] Concave road skin and panel courses.
- [x] Flush interior bands and closure seam.
- [x] Shallow service recesses bridged by protective flush grilles/covers; nominal driving surface retained.
- [x] Tube-mouth trim with only the visible exterior thickness.
- [x] Neutral recessed strip emitters and ambient fill for all-around readability, pending user assessment.

Review segment: complete inside tube with 360-degree steering, all service families where appropriate and a phase lane winding around the circumference.

User checks: visibility of floor/walls/ceiling, camera clearance, light levels, phase readability and repetitive tunnel rhythm.

- [x] Visibility notes recorded; concealed outer skeleton omitted.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

Delivery: [07–08 tubes R1](art/track/07-08-tubes-r1.md). Two 1,800 m straight tube samples, each drivable around the full circumference. Both reuse the accepted lane factory at 6.48 m physical width. Flat↔tube transitions remain category 09–10 work.

R2 service section: the user approved the twelve-metre composition on 2026-09-24 and requested variations. Four variations now extend it: pipe-heavy manifolds, split cooling banks, reinforced access hatches and quiet replacement armor. Both tube types have eight sections across 1,800 m, with unequal graphite intervals and shifted circumferential arrangements. User feedback on the variations: “the detailed rings look great.” The original approved composition remains available. See [approved service section](art/track/07-08-service-candidate-r2.md) and [R2 variations](art/track/07-08-service-variations-r2.md).

Shared slab style approved 2026-09-24: “100 time better! i approve of this.” Dedicated 600 m samples use shallow bevelled repair-plate layouts, brushed roughness/normal detail and a soft metallic reflection environment, with a crossing violet lane, on flat and both tube types. The user requested a local checkpoint of all current stages. Existing plate variations are sufficient; applying this approved style to the existing assemblies is the recommended next step. See [approved slab style](art/track/slab-candidate-r1.md).

## 09 — Flat ↔ outside-tube transitions

Depends on: 07–08. Joint implementation with 10 authorized by the user on 2026-09-24.

Items:
- [x] Smooth variable-cross-section surface assembly.
- [x] Curvature-following edge trim and panel seams.
- [x] Variable rib/band shape only on visible faces.
- [x] Continuous adaptive plate courses and recessed joint floor close the surface; no separate filler wedge needed.
- [x] Segmented bay frame and articulated/flexible conduit joints where exposed.
- [x] Edge convergence/divergence piece as the tube closes/opens.
- [x] Reuse the same assembly in reverse instead of separate duplicate assets.

Review segment: flat → partial convex curl → full outside tube → flat, with a continuous phase lane and a service-family change through the transition.

User checks: smooth closure, no scalloped discontinuities, no stretched fittings, good visibility while steering near changing edges.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

## 10 — Flat ↔ inside-tube transitions

Depends on: shared 09 construction. Joint implementation authorized; approval remains pending.

Items:
- [x] Smooth trough → U → C → closed interior surface assembly and reverse.
- [x] Reuse shared transition seams, frames and continuous surface logic; reviewed together with 09.
- [x] Interior edge closure trim; no separate giant portal hiding a discontinuity.
- [x] Reuse articulated service connectors; no extra concave-only connector required by this assembly.

Review segment: flat → inside tube → flat, then a short outside section connected through flat road. No direct outside-to-inside inversion in this library's first version.

User checks: visibility as walls rise, no abrupt closing roof, clean joins, camera/road clearance and coherent structural language.

- [x] Visibility notes recorded.
- [x] Segment delivered for user testing.
- [ ] Feedback addressed and explicit approval recorded.

Delivery: [09–10 transitions R1](art/track/09-10-transitions-r1.md). Category 09 is a 1,800 m flat → outside → flat sample. Category 10 is a 3,000 m flat → inside → flat → outside → flat sample. Both incorporate the approved metal slabs, 12 m service sections and constant-width phase lanes. User owns gameplay and visual testing.

## 11 — Gaps and visible cut ends

Depends on: 10.

Completed, 2026-09-25: user approved the complete flat/partial/tube gap set and the follow-up outside bulkheads and inside collars, explicitly declaring phase 11 done. See the [complete asset set and termination additions](art/track/11-complete-gap-set-r3.md).

Style approval: recessed segmented light arrows on takeoff; receiving brackets and a bright end strip on landing. Both aprons are 12 m long. Partial openings add recessed pearl-white border lights on the intact side of each lateral cut. Tube rims repeat three curved modules at the established physical scale. The 3D yellow guide remains hidden only in this art sample; text jump guidance and T slow motion remain available.

Items:
- [x] Approved flat full-width takeoff and landing lips, plus curved full/partial variants for both tube surfaces.
- [x] Partial-gap border trim with exposed lateral fascia and flush light channels.
- [x] Exposed deck cross-section with short fascia returns.
- [x] Visible cut beam caps and sealed pipe-end fittings; separate library views.
- [x] Recessed warning-light housing with segmented neutral emitters and replaceable end caps.
- [x] Shared assembly cutter applies the same opening to every source mesh, including surface, markings and mounted service/support layers.

The collider records also define the mesh cuts and end positions. Cut in unwrapped metres before bending; preserve UVs at intersections and subdivide broad faces before curving. Partial openings keep 18 m physical width on every surface. Samples use quiet slabs and neutral markers to keep attention on the cut-end assets; no additional service bays or phase challenges are inserted. The shared cutter accepts all mounted mesh layers without a part-name exemption.

Review segment set: one flat, one outside-tube and one inside-tube segment, each offering a full gap and a partial gap with generous recovery room. Preserve current jump/collision rules.

User checks: jump-edge visibility, convincing exposed ends, no decorative bridges across gaps, landing clarity, views briefly exposing lower faces during jumps.

- [x] Visibility notes recorded; only exposed cut faces detailed, with no interior side walls at closed rim cartridge joins.
- [x] Segment set delivered for user testing: each is 1,800 m, with 75 m gaps at 450 m and 1,050 m.
- [x] Explicit user approval recorded for the full flat/partial/tube gap set, 2026-09-25.
- [x] Follow-up: opaque outside-tube bulkheads and four-metre-deep inside-tube collars, with service cartridges and recessed energy rings. Partial cuts use matching sectors.
- [x] Follow-up caps/collars reviewed and approved by the user; phase 11 complete, 2026-09-25.

## 12 — Obstacles

Status: complete and approved by the user, 2026-09-25. Gate loading delay/frame hitch remains separately deferred to a performance pass.

Depends on: 11.

Art direction first, 2026-09-25: user requested multiple distinct concept alternatives for each element type before modeling. Explore phase gates, solid walls, passage frames and low jump barriers; select and combine preferred details before implementation. [Concept set and exact generation prompts](art/track/12-obstacle-concepts-r1.md).

Initial selections: G2 Split fins, W4 Buttressed bastion, P3 Service gantry and J3 Louver bank. User approved [W4 walls R2](art/track/12-walls-r1.md), [P3 passages R1](art/track/12-passages-r1.md), and the replacement [F1/F2 recessed phase emitters](art/track/12-phase-emitters-r1.md). The [J3 low barriers and complete obstacle assemblies](art/track/12-obstacle-assemblies-r1.md) are now delivered on flat road and both tube surfaces for user review.

Items:
- [x] F1/F2 recessed phase-emitter set: flat/inside/outside geometry, live colors and 24 m stations. User accepted the cycling demo; reported loading hitch deferred to a later performance pass.
- [x] W4 solid wall panel, base, crown and terminal caps; repeatable flat/inside/outside versions. R2 approved by the user.
- [x] P3 passage jamb/lintel and clear opening trim, with W4 infill and flat/inside/outside adaptations. Approved by the user.
- [x] Low jump-barrier middle and end caps: J3 geometry approved by the user.
- [x] Assemblies for opening-only, jump-or-opening and jump-only obstacles: delivered in the library and cycling demo.
- [x] Surface-conforming placement on flat, inner-tube and outer-tube roads using existing collision dimensions; includes a tube-seam opening assembly. User approved the delivered set.

Delivery: [J3 barriers and obstacle assemblies R1](art/track/12-obstacle-assemblies-r1.md). User approved all delivered phase 12 assets and requested checkpoint art direction next.

Review segment set: the same spaced obstacle sequence on flat, outside and inside surfaces, with a final transition approach. Reuse existing guide behavior.

User checks: obstacle types readable at speed, visual openings agree with collisions, colors do not confuse phase requirements, enough approach visibility.

- [x] Visibility notes recorded in delivery documents; rear service panels and caps cover encountered views.
- [x] Segment set delivered for user testing on flat and both tube surfaces, including an offset seam-crossing opening.
- [x] Feedback addressed and explicit approval recorded. No agent gameplay testing performed.

## 13 — Checkpoints

Depends on: 12.

Status: approved by the user, 2026-09-25, including the current flat, inner-tube and outer-tube set.

Selected direction: C1 checkers, C2 circular instruments and recessed lamp cassettes, without letters or numbers. The user requested a white crossing curtain and modeled emitters. The gantry/arch direction is superseded. [Checkpoint set R1](art/track/13-checkpoints-r1.md) is delivered on flat/inside/outside surfaces for user review, with a 30 m footprint.

Items:
- [x] Flat checkered timing deck with real instrument recesses; replaces gantry support and crossbeam.
- [x] Surface-following inside/outside checkpoint belts with alternating checker closure; replaces raised ring/arch structures.
- [x] Neutral timing-light clusters and a dedicated central white-curtain emitter row.
- [x] Visible optical retainers, clamps, fasteners and service locks; shared approved surface materials.

Review segment set: approach and pass a checkpoint on each road type, continuing into a clear recovery section. Retain uninterrupted progression and boost refill.

User checks: recognizability at speed, distinction from phase gates, unobstructed passage, notification timing and continuity.

- [x] Visibility notes recorded: 30 m footprint, broad checker rhythm, selected recessed instrument tiles and central optical crossing row.
- [x] Segment set delivered for user testing with all three surfaces, boost-refill confirmation and clear recovery road.
- [x] Feedback addressed and explicit approval recorded. User accepted this set and confirmed categories 01–13 complete, 2026-09-25.

## 14 — Sparse landmarks (optional; only if repetition still needs it)

Depends on: 13 and explicit decision to include this category.

Status, 2026-09-25: deferred by the user while moving to actual-game integration. This is not a blocker for category 15 and is not permanent cancellation of landmark work.

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

Depends on: 01–13 approved; 14 approved or explicitly deferred/skipped. These prerequisites are satisfied as of 2026-09-25.

Documentation delivered: [Track library and procedural level handoff](TRACK_LIBRARY_HANDOFF.md). It distinguishes existing APIs from proposed architecture, records demo-only assumptions and recommends one editable deterministic combined course before seeded encounter variation. No combined course or procedural generator was implemented in the handoff pass.

Items:
- [ ] Assemble flat → outside → flat → inside → flat with approved transitions, mixed bays, lanes, gaps, obstacles and checkpoints.
- [x] Consolidate shared dimensions, attachment conventions, materials, start/middle/end assembly rules and visibility/culling distances in the handoff. A unified runtime socket/placement schema remains proposed.
- [ ] Reuse rigid meshes through instancing where practical; keep surface generation chunked.
- [ ] Avoid hidden geometry, decorative collision mismatches and unnecessary overlapping surfaces.
- [x] Record approved modules, source references, superseded revisions, known limits and pending official verification in the handoff.

Review output: one selectable construction course, plus access to each category's approved sample. User tries desktop/mobile, both orientations and representative cruise/turbo runs.

- [ ] Combined course delivered for user testing.
- [ ] Final visual/control/performance feedback addressed.
- [ ] User approves integration into the main campaign.
- [x] Official verification/gate status recorded separately in the handoff: pending for this integration, not inferred from build or art approval. Actual official verification remains outstanding.

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

User approved the detailed pipe candidate and 30-degree profile, authorizing the same pass across the four existing raised sets. All 28 R3 modules delivered: frame 5, pipe 8, grille 7, cover 8. Original candidate, R1 and R2 preserved. Full-height connectors remain distinct from rare ramp caps. Individual new variants await user review. Later category status is recorded in the approval ledger above.

Delivery and URLs: [01-04-detailed-r3](art/track/01-04-detailed-r3.md).

R3 ramp correction, 2026-09-24: corrected the reversed shoulder split positions in all eight ramp caps across categories 01–04. Beam/panel splitting now derives from the same interval as the taper. Production build passed; user visual review pending. See the R3 delivery notes for the cause and scope.
