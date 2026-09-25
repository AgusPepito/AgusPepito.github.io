# Geometry cleanup, v4

Performance report identifier: `geometry-cleanup-v4`. This pass changes authored
geometry, retaining the v3 worker, preload budget, materials, lighting, camera,
collision data and render resolution for the next user comparison.

## Coverage

- Gate emitters: remove horizontal plate undersides, box undersides, washer and
  bolt bottom caps, the outward faces of recessed well walls, and capacitor body
  end caps covered by larger stepped ends. Keep the undertray's visible backing,
  all cavity-facing walls and the two-sided projection curtain.
- Gate round details: large capacitor components use 12 radial segments, small
  couplings use 8, washers use 8 and hex fasteners stay at 6. Cable tubes use 6
  radial segments and 12–20 longitudinal segments according to control-point
  count, down from 8 by 28. This is a modest fixed detail reduction, not an
  adaptive screen-space LOD system; tight bends need user visual review.
- Checkpoints: remove buried plate/box bottoms and cylinder bottom caps. Reduce
  washers and small lamps to 8 sides, optical glass to 24, and large dark well
  floors to 32. Preserve circular bezel profiles, curtain and exposed recesses.
- Road slabs: replace the continuous dark backing with strips in uncovered
  joints. Retain backing beneath bevels plus a 2 cm overlap under panel tops.
  Top plates, UV scale, bevels, fasteners and curvature sampling are unchanged.
- Walls, service passages and jump barriers: remove inward-facing armor caps
  before deformation and ground-contact box bottoms; reduce small conduit and
  coupling segments. Preserve rear exterior panels, passage ceilings, open
  aperture returns and floating louver undersides.
- All 28 active R3 raised bay variants: remove back faces on named mounted
  panel details and bottoms on foot/roof fixtures; reduce pipe barrels from
  16 to 12 sides and doglegs from 32 by 12 to 24 by 10. Structural grille bars,
  support backs and exposed end cheeks remain intact. Older R1/R2 variants and
  the standalone pipe-detail art study are not campaign assets and are untouched.
- Service belts: lower conduit/coupling subdivisions, remove bolt bottom caps
  and bottoms of named armor-mounted fixtures. Keep floating louvers/handles.
- Gaps: remove the apron backing enclosed by armor and light-fixture diffusers,
  remove flush border bolt bottom caps, and reduce small radial pipe sides.
  Exposed cut flanges, beam caps, tube returns and bulkhead closures stay intact.
- Phase lanes already contain only thin visible surfaces. The playable ship is
  already a handful of low-detail primitives; neither needed broad decimation.

## Implementation constraints

`public/assets/track/geometry-cleanup.js` removes only explicitly selected planar
face directions in the authored coordinates, before track wrapping. It compacts
all attributes, preserves shading/UV seams, and keeps nonindexed sources eligible
for the existing final exact indexing pass. It supports the single-material,
static geometry used here; it is not a generic animated mesh or multi-material
mesh simplifier. No camera-based visibility sampling or blanket normal-direction
culling is applied to finished world-space assets.

The procedural generator still creates these assets at runtime. Reduced detail
is shared by laptop and mobile; device-specific visual quality settings are not
introduced in this pass. Draw calls are not expected to fall in proportion to
triangles because material batching remains unchanged.

## Measurement baseline

The user's preceding v3 capture (`2026-09-25T02-48-44-345Z`) recorded 60 FPS over
46.45 driving seconds, a 17 ms worst driving frame, 132 peak draw calls and
3,081,808 peak triangles. Level 2 generated geometry was about 605.7 MiB; initial
Level 1 preparation took 2.75 seconds and Level 2 preparation 11.19 seconds.
The full-width Level 2 gate at station 1300 took 1.32 seconds in the foreground
and 1.26 seconds during background preparation.

Compare the same levels, gate stations, viewport and device in the next user
capture. Look at level buffer bytes, triangle counts, gate stage times and each
loading wait separately; total waits and renderer geometry counts depend on how
far the run proceeds. No savings percentage is claimed before that measurement.

Validation is source review and a production build only. Automated tests,
factory timing runs and agent visual/gameplay testing are not part of this pass.
