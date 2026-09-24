# Categories 01–04: raised roadside R2

Status: awaiting user review. Supersedes the shallow-insert interpretation, not the approved road skin. R1 files remain unchanged and selectable. No category 05 work or publishing performed.

Reference: user's attached crop showing elevated ivory roadside housings with inward-facing machinery, grilles and armor. Recipe route B, agent-authored standalone THREE modules; no hosted-model generation. Source files: public/assets/track/raised-*-r2.js. Runtime adapter: src/racer/raised-kit.js.

## Delivered assets

- 01 frame: start, middle, end; sloped ivory uprights, recessed face, roof cap and visible end cheeks.
- 02 pipes: start, straight, coupling, valve, offset, end; three horizontal pipes stacked vertically, collars and sealed sockets.
- 03 grilles: start, lattice, louver, reinforced, end; upright screens with shallow dark backing.
- 04 covers: start, plain, segmented, hatch, vented, end; sloped front armor with visible hatches/vents.

The start/end pieces lower the complete housing toward the exposed end. Factory coordinates: X repeats over 24 m, front +Z faces the road, base y=0, roof approximately 3.33 m high, depth 2.6 m. Runtime rotates inward on both sides, swaps taper direction as needed, and places bases at the unchanged road height outside x=±18. Shared material batching and 100 m chunk culling remain in use.

Visibility budget: inward face, roof and exposed ends. No rear machinery, detailed undersides or hidden rooms. These are decorative roadside structures, not collidable obstacles. The reviewed road width and controls are unchanged. Raised samples currently cover flat road only.

## Review links

- Frame: http://127.0.0.1:4173/racer.html?review=01&revision=r2
- Pipes: http://127.0.0.1:4173/racer.html?review=02&revision=r2
- Grilles: http://127.0.0.1:4173/racer.html?review=03&revision=r2
- Covers: http://127.0.0.1:4173/racer.html?review=04&revision=r2
- Library: http://127.0.0.1:4173/library.html?category=02&revision=r2

Library defaults to R2 and includes an R1/R2 selector, individual modules/parts and mounted road assemblies. Drive review URLs without revision=r2 preserve R1.

Production build passed, with existing shared Three.js chunk warning. No agent gameplay inspection or tests performed, per standing instruction. Official verifier/gate remains pending. User should assess housing height and silhouette, inward-face readability, sloped ends and visibility of the road at speed. All R2 approvals pending.

## Connection correction — full-height transitions

User clarified that start/end means a full-height interface between service families. Updated R2: start/end now retain roof height and the same end profile across pipes, grilles, covers and empty frames. Previous sloping forms are separate ramp-start/ramp-end assets in every library category. Use ramps only at exposed run boundaries, including the sample's quiet interval.

Four modules are longitudinally scaled from 24 to 25 m to fill each 100 m road chunk with no 4 m gap. Authored two-chunk family blocks show pipe/grille/cover joins in the existing R2 samples. No automatic category-05 generation system added. Road width, collision boundary and controls unchanged. Revised R2 awaiting user approval; source review and production build only, no tests or visual inspection.

## R3 single-candidate review — 30-degree face

User requested ONE detailed module before any broader pass. Delivered raised-pipe-detail-r3.js, selected in category 02 as detail-r3. No existing modules or gameplay assembly changed. The angle is explicitly 30 degrees from vertical, shared by sheared front supports and watertight extruded trapezoid end cheeks. Unlike R2's square end boxes, the end face follows the front profile.

Candidate uses a shorter 12 m repeat length (not yet adopted as a library interface), 3.2 m structural height, three stacked pipes, visible coupling sleeves/bands/front fasteners, valve blocks/handles, inset supports, roof panels/vents and shallow lower details. Detail is limited to inward faces, roof and exposed ends. Geometry authored through recipe route B; no hosted 404 model invoked.

Review URL: http://127.0.0.1:4173/library.html?category=02&revision=r2&asset=detail-r3

Side view button added to inspect the profile. Production build passed with existing chunk warning. No tests or agent visual inspection. User approval pending; final pass across previous assets remains blocked on that approval by explicit scope.
