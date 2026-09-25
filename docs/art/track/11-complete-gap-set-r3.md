# Category 11 — complete gap asset set

2026-09-25. The user approved the completed flat/partial/tube gap set, then approved the outside bulkheads and deeper inside collars, explicitly declaring phase 11 done. All category 11 assets and follow-up additions are approved.

## Delivered models

- Full and 18 m wide partial takeoff/landing ends on flat road, outside tube and inside tube.
- Three repeated illuminated cartridges around each full tube rim. Physical width stays close to the approved flat end, so arrows are not stretched across the entire circumference.
- Partial-gap side borders: ivory flush rail, dark exposed web, metal replacement faces, lower flange and fastener seats.
- Recessed pearl-white border emitters in reserved strips of the intact road, with individual covers, bezels and sealed end caps. No raised hazard rail.
- Separate library views for cut sections, sealed beam caps, pipe caps, partial borders and warning-light housings, plus each complete assembly.

The takeoff keeps three embedded chevrons and paired light channels. Landing keeps receiving brackets, crossbars and its bright gap-facing strip. All aprons stay 12 m long. Shared brushed metal finish and soft reflection lighting remain in use.

## Review courses

Each course is 1,800 m long, with a full opening at 450–525 m and a partial opening at 1,050–1,125 m. The partial opening is centered and 18 m wide in surface metres. Flat road has 9 m of intact road on each side; tubes retain the rest of their circumference. There is 525 m between the first landing and second opening, followed by 675 m of recovery road.

- [Flat full and partial gaps](http://127.0.0.1:4174/racer.html?review=11&shape=flat)
- [Outside-tube full and partial gaps](http://127.0.0.1:4174/racer.html?review=11&shape=outside)
- [Inside-tube full and partial gaps](http://127.0.0.1:4174/racer.html?review=11&shape=inside)
- [Asset library](http://127.0.0.1:4174/library.html?category=11&revision=r1&asset=partial-assembly)

Space jumps; steer to bypass the partial opening. T toggles quarter-speed review and R retries. Menu links switch between all three shapes. Existing jump/collision behavior is retained. Text jump guidance stays active; the yellow 3D guide remains hidden in this category as in the approved flat study.

## Assembly and visibility decisions

`gapReviewGaps(shape)` supplies both collision records and art boundaries. Full cuts use the whole surface; partial widths convert from 18 physical metres to each profile's normalized coordinates. Intact slabs are generated in aligned courses and then clipped, preventing tiny rescaled plates around openings.

`cutGapLayers` bakes source transforms and clips every mesh layer against the same rectangles, interpolating vertex attributes at intersections. It makes no exception for markings, bays, conduits or support meshes. This course uses slabs and neutral inside-tube markers; future mounted service layers must be added to the source group before that cut. Aprons and partial border wells reserve their own road area and replace it with recessed geometry.

Tube meshes are subdivided across the circumference before the shared radius-18 surface wrap, including broad optical plates and cut faces. Full rims omit internal side fascias at cartridge joins and periodic closure. Partial borders sit on the intact side of the cut and end at the exact takeoff/landing coordinates. Only exposed end thickness and lateral faces are modeled; no concealed full underside is added.

Implementation is subject to the user's visual/gameplay review. No tests or agent visual playtesting are authorized. Source review and production preview rebuild are the delivery checks. No new commit requested.

Production build passed. The existing shared Three.js bundle-size warning remains. The preview is served on port 4174 for user testing.

## Follow-up — tube caps and volume collars

- Outside: an opaque recessed bulkhead closes the exposed cross-section beneath the radius-18 driving surface. Radial brushed-metal plates, concentric seams, a central sealed access hatch and segmented hatch lights fill the center. The perimeter contains ivory service cartridges with radial pipes, stepped sleeves, cooling fins, access latches and a recessed energy ring.
- Inside: a collar extends radially from 18.87 m to 22 m and four metres back into its own road segment. It joins the existing cut fascia while preserving the open radius-18 bore. Inner/outer returns, recessed service beds, cartridge dividers and segmented pearl-white lights give the mouth visible volume.
- Both takeoff and landing receive the treatment. Landing reverses the geometry and winding so the structure remains behind its own edge. Partial openings use matching angular sectors with sealed collar-sector returns; no full collar is laid over the intact bypass.
- All new depth stays on the road side of the cut. No new geometry spans the 75 m jump or protrudes into the drivable tube surface. Collision records, jump mechanics and the approved 12 m illuminated aprons remain unchanged.

The new generator uses native tube coordinates and is attached after road deformation. It is included in the existing material merge and slab reflection environment. It uses modeled recesses and emissive covers rather than an additional dynamic lighting/reflection pass.

Standalone library views: [outside bulkhead](http://127.0.0.1:4174/library.html?category=11&asset=outside-termination), [inside collar](http://127.0.0.1:4174/library.html?category=11&asset=inside-termination). Existing outside/inside driving links above show the additions. The user owns testing; no agent gameplay inspection or tests were run.

Additional source: `public/assets/track/tube-gap-termination-r1.js`.

Sources: `public/assets/track/gap-edge-r1.js`, `gap-surface-r2.js`, `gap-border-r1.js`; `src/racer/gap-kit.js`, `gap-geometry.js`, levels/view/menu and the library catalog.
