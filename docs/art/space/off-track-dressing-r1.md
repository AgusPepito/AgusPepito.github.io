# Sparse mid-distance level dressing

User authorized placement on 2026-09-25 after approving the three procedural models and their secondary detail pass. `src/racer/off-track-dressing.js` distributes the exact factories from `art-studies/off-track-dressing-r1/models.js`. `SpaceScenery` owns the dressing alongside its existing asteroid fields and distant stations.

## Distribution and orientation

- First structure at 320–440 m, then one every 700–950 m until 180 m before the finish. Each station gets one structure, with open stretches between them.
- Shuffled sets of ring, pylon and boom prevent one shape dominating or immediately repeating across set boundaries. Courses with fewer than three placement slots may not show every type.
- The full track profile seeds placement, so layouts vary with course geometry and stay fixed on retries. No per-frame randomization.
- Rings use a continuous 360° spin plus up to roughly 26° tilt on each remaining axis. Scale is 1.05–1.25 times the approved model, retaining a large aperture.
- Pylons use random 90° roll/yaw steps relative to the banked course, with no additional free tilt.
- Booms randomly occupy either side. Left-side booms turn 180° so their arm extends outward; the approved clear underside remains unchanged.
- Pylons and booms use 0.95–1.10 scale. Heights receive a small variation of ±35 m along the banked course normal.

## Clearance and gameplay

All three are noninteractive side scenery. They are never inserted into gates, obstacles, gaps, collision lists or physics. They have no lights that alter phase rules, timing or checkpoints.

Placement encloses each complete model in a centered sphere, including every protrusion and its chosen scale. A conservative centerline envelope is calculated over the nearby longitudinal interval by summing each eased motion increment's endpoint bounds. This also covers intermediate bends and opposing motion increments, without sampling gaps. The enclosing sphere is placed at least 135 m beyond this centerline envelope along the selected side. Current course cross-sections extend less than 57 m from their centerline, leaving more than 78 m beyond the driving surface. This margin includes space for track hardware and normal jumps. Outside that interval the monotonic world Z coordinate provides the same centerline separation. Rotating an object cannot invalidate its enclosing-sphere margin.

These bounds prevent geometric track intersections; visibility, scenery density and performance still need the user's gameplay review. Rings remain outside the course corridor, with no required fly-through gate implied.

## Resource use and rendering

- Three prototypes generated once per `SpaceScenery` lifetime, indexed and merged by material using the existing `mergeWallParts` implementation.
- Seven shared materials across the three prototypes. Level copies reuse all geometry, materials and GPU buffers; no per-copy model generation or point lights.
- Placement transforms rebuild on level handoff, while prototypes are retained by the existing shared-scenery path.
- An invisible resource group keeps all prototype geometry/materials reachable by normal scene disposal even on levels that omit a type. It adds no rendered draws.
- Culling covers 1800 m ahead and 450 m behind, expanded by each model radius. Individual material meshes also retain normal frustum culling. Each visible complete structure costs at most seven model draw calls; offscreen meshes can be culled further.
- Existing orbital material finishing, reflection capture and Rich bloom apply to the scenery. Light mode retains emissive lenses. Scenery bypasses the short road fog, like existing stations.
- No worker packets or all-level course caches change. Performance events expose counts per type, unique geometry bytes/triangles, palette size and placement settings under `scenery.dressing`. Report tag gains `dressing-v1`; layout tag is `orbital-vistas-v5-dressing`.

## Delivery

Source review and `npm run build -- --configLoader native` completed. The build retains the shared Three.js chunk-size advisory. An initial build encountered a concurrently edited missing UI stylesheet; it passed after that file became available without modifying the unrelated UI work. User owns tests and visual review; no tests, simulations, automated gameplay checks or browser inspection were run. Updated game: http://127.0.0.1:5173/racer.html.
