# Asteroid fields and ring stations

## Cluster revision 3

Station origins remain at their revision-2 distances; uniform model scale is multiplied by 2.5. Asteroids now occupy 2–4 loose volumetric clouds per 300 m batch, with independently varied cloud spread, depth and density (24–48 rocks per batch, averaging the previous 36). Cloud centers are 650–1000 m radially away with 70–200 m spread. Road curvature smoothly widens the angular distribution from the two sides of flat road to the full circumference on tubes. Every rock center retains at least 450 m radial clearance, and all placements remain fixed in world space. Longitudinal culling bounds include cloud depth. The same two prototype meshes and two draw batches per field are retained. Report tag: `space-scenery-v3`. Source review/build only; visual evaluation remains user-owned.

## Distance revision 2

User requested a more distant composition. Asteroids now sit 450–1100 m laterally away and -180 to +300 m vertically; stations sit 1100–1400 m laterally away and 100–250 m above the centerline. Mesh sizes are unchanged, so they appear smaller. Only scenery materials bypass road fog; the camera far plane is 4000 m. Field visibility reaches 2400 m ahead and 650 m behind; station visibility reaches 3000 m longitudinally. Track streaming/culling distances remain unchanged. More scenery batches may be visible together; report tag is `space-scenery-v2`. The following describes the initial revision for comparison.

Integrated on 2026-09-25 at the user's request. Procedural asteroid source: `public/assets/space/asteroids-r1.js`. Gameplay placement: `src/racer/space-scenery.js`. The two centered rock variants use deformed icosahedra with broad dents, irregular silhouettes and muted vertex colors: a pitted grey body and an elongated warmer fractured body. No images or external mesh data are used.

Each 300 m course segment receives 36 asteroid instances, distributed on both sides, 110–320 m laterally from the centerline and -90 to +150 m vertically. Most radii are 3–13 m; occasional larger rocks are 16–25 m before per-axis variation. Geometry and materials are shared across fields. Each field has two draw batches and whole-field distance culling plus renderer frustum culling. Placement is seeded and repeatable for a given course length, with no per-frame asteroid motion or generation.

The station imports the exact factory from `art-studies/phase14-ring-station-r1/station.js` without editing the isolated study. It is generated once per active level, combined into indexed batches by its six material names, and cloned with shared geometry/materials. Stations appear every 1800 m starting at 700 m, alternating sides, 340–400 m from the centerline with varied tilt and scale. They remain separate from the course and are noninteractive decorations. Existing scene lighting/fog and disposal are used; no new lights or collision hooks.

Scenery is created with the active view rather than added to the campaign worker cache. Report scene inventory and browser memory include it; all-level cache byte counts exclude it. `view-created` events include scenery generation time and counts, and the report version includes `space-scenery-v1`. Source review and build only; no tests or visual gameplay review were run. The user owns visual evaluation.
