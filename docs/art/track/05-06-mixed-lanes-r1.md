# Categories 05–06 — mixed assembly and phase lanes R1

User authorized both categories on 2026-09-24 after agreeing that category 05 should reuse the existing R3 models and concentrate on assembly. The user accepted the repaired phase 06 sample: “ok it works now i like it”, requested a local commit, and authorized categories 07–08 together. Category 05's individual join review remains separately pending. Existing categories 01–04, the original R3 reference and the campaign remain available.

## Reference and visibility decisions

Used saved concepts `01-flat.png` and `04-transition.png` in this directory: graphite roadway, ivory roadside construction, unequal mechanical runs and restrained inset phase lighting. The supplied generated-image directory `C:/Users/matan/.codex/generated/_images/01a0d31e-8a18-7fd2-9550-7e772338a290` was not found; project copies and their README supplied the references.

Housing fronts, roofs, family joins and exposed run ends are visible from the chase camera. Reuse the existing R3 detail at these positions. Lane top panels, narrow lit borders, endpoint symbols and neutral edge reflectors are visible on approach and while steering. No buried conduits, underside chassis, new distant structures or raised objects inside the driving envelope were added.

## 05: assembly using existing models

Source: `src/racer/mixed-kit.js`. Two authored lists describe 144 bays per side, from course distance -50 m to 1,750 m. Bay pitch remains 12.5 m. Runs cross the renderer's 100 m chunk boundaries; neighboring bay families determine which connector is used. Same-family continuations use middle variants, family changes use full-height end/start pieces, and exposed runs use the corrected ramp caps. Empty frame runs remain roofed, unlike bare-road intervals.

Long quiet stretches use plain covers, straight pipes or repeated grilles with occasional service variants. Both sides have different run lengths and exposed intervals. Retry uses the same layout. This replaces the proposed seeded variation with an authored first sample; randomization can follow if useful.

No new filler, blank-cap or divider meshes: R3 already provides the required geometry. The library includes compact mixed and exposed-road assemblies, isolated pipe→grille / grille→cover / cover→pipe joins and the reused empty frame. Existing material merging and distance-based road-chunk visibility are retained; no new instancing system or performance claim.

## 06: lane models and gameplay integration

One standalone parameterized recipe-route-B factory, `public/assets/track/phase-lane-r1.js`, supplies start, middle and end for each of the three existing phase colors. A second factory supplies the neutral edge marker. No hosted generation or new textures.

Lane modules use a 12.5 m pitch with a 6.48 m active bed, narrow colored borders, dark seams, short flow ticks, millimetric beveled rims and endpoint circle/triangle/diamond symbols. Broad dark interiors retain road readability; only narrow emitters use restrained emissive material. All geometry is a top surface or shallow exposed bevel. The 12–28 mm rendering offsets avoid coplanar surfaces and introduce no collision features. Uncolored rim/gutter extends 0.26 m outside each active edge; it grants no boost.

`src/racer/lane-kit.js` supplies the same strip records used by `configureLevel` and by the geometry placement. Colored bed boundaries match `onStrip`: 0.18 normalized half-width × 36 m = 6.48 m full width. Matching phase triggers the existing lane-turbo behavior; no new speed or collision rules. Categories 05–06 force the phase review mode and contain no hazards.

Driving sequence (revised after feedback): all three colors side by side 25–325 m, amber 425–650 m, violet 750–975 m, all three side by side 1,100–1,450 m, then central violet 1,550–1,725 m. The opening now presents the lane models directly ahead of the spawn. Neutral intervals expose lane ends. Edge markers repeat every 25 m near both road boundaries and use neutral, non-emissive material. Separate roadside lamps are unnecessary for this first sample unless the user identifies a visibility problem.

The library offers all nine lane variants, the neutral marker and a three-lane mixed-road assembly. Runtime adapter is currently scoped to flat-road review; tube mapping belongs to later categories.

## Review links

- [05 asset library](http://127.0.0.1:4174/library.html?category=05&revision=r1&asset=assembly)
- [05 driving sample](http://127.0.0.1:4174/racer.html?review=05&revision=r1)
- [06 asset library](http://127.0.0.1:4174/library.html?category=06&revision=r1&asset=assembly)
- [06 driving sample](http://127.0.0.1:4174/racer.html?review=06&revision=r1)

Use the library's individual part selector for geometry inspection. In the driving samples, steer with A/D or arrows, select phases with 1/2/3, jump with Space, hold W for manual turbo and use R to retry. Mobile controls remain available.

## Delivery status

- Source reviewed; production build passed. Existing shared Three.js chunk-size warning remains.
- No tests, automated gameplay checks or agent visual playtesting performed, per standing user instruction. Reference concept images were inspected.
- User review: family seams, repetition, ramp boundaries, lane width/color/endpoints and mobile readability/performance.
- Local workspace only; no commit or publishing requested.
- Phase 06 user approval recorded above; official asset verification and final jam gate remain pending.

## Feedback revision: Play handoff and lane visibility

The user reported a strange UI transition on pressing Play and no visible lanes in the driving sample. Source review found millimetric decal offsets without polygon depth bias and a menu handoff that exposed the scene before explicitly preparing the reset frame/HUD. These are source-based corrections; the reported symptoms have not been reproduced by agent playtesting.

Lane/marker materials now use polygon offset and draw after the opaque road while retaining depth testing. The runtime builder receives the active STRIPS records explicitly. The opening presents all three phase lanes from 25 m instead of a single offset lane from 100 m. Play prepares the camera frame and HUD before dismissing the menu, and construction samples suppress the extra campaign intro banner. A loading screen also prevents the generic campaign panel from flashing before review setup finishes. User confirmation remains pending.
