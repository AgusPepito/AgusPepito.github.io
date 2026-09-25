# Indexed geometry and level preloading (v2)

Report identifier: `indexed-level-preload-v2`. This supersedes the streaming-readiness policy described in `PERFORMANCE_WORKER_HANDOFF.md`.

## Geometry and generation

- Campaign material batches now retain source indices. Previously `mergeWallParts` expanded every indexed input into separate triangle vertices. Unindexed inputs are indexed using exact matching of every Float32 attribute bit, including normals, UVs and vertex colors. No triangle removal, coordinate quantization or normal smoothing is introduced. Review assemblies still use the original merge mode.
- Campaign gates generate one unscaled repeated hardware module and clone its geometry for the other bays before applying the existing placement/deformation. Beveled openings, cables, fasteners and the phase curtain retain their original detail. The review factory's default behavior is unchanged.
- Course deformation reuses scratch vectors for the same finite-difference frame calculation, and subdivision avoids transient attribute slices/flatMaps. Sampling locations, split thresholds, clipping and normal calculation are unchanged.

## Loading behavior

Every geometry job for the selected campaign level must complete and attach before movement/race time advances. A percentage indicates progress. Generation remains in the worker; loading does not block pause or menu interaction. Same-level retries retain the completed level and therefore do not regenerate it. This preloads CPU geometry; GPU uploads/shader compilation may still occur on first visibility.

After the selected level finishes, one background stream prepares the next level from an independent data snapshot. The live track profile and encounter arrays are not changed by this preparation. Generated packets are held off-scene and never uploaded to the current level's renderer. The cache budget is 128 MiB, checked between jobs: one completed job can exceed the budget. Worker temporaries are additional, so this is not a total process memory cap. The stream pauses when the budget is reached, rather than keeping two unrestricted complete levels resident.

At a matching checkpoint, the new view adopts the cached packets and the existing worker. Unfinished generation resumes without the background cache limit. Attachments are limited to four packets or approximately 3 ms per callback (a single attachment cannot be interrupted). The previous level's GPU geometries, materials, scene references and worker are released; the renderer/reflection environment remain reusable. Unexpected jumps to another level discard unmatched prefetch data. Large next levels can still require a checkpoint loading wait when their full geometry does not fit the prefetch budget.

## Compare these measurements

- Cold full-level preparation time versus warm checkpoint loading time; any buffering during actual travel is now unexpected after a successful full load.
- Worker gate build times, including loading-time and prefetch events. Driving frames alone no longer contain the current level's generation work.
- Actual generated buffer bytes and the estimated bytes of the same triangles/attributes expanded without indices. The panel displays the corresponding indexed-buffer saving. This is an equivalent-geometry comparison, not a claimed measurement of an old executable.
- Next-level cached bytes alongside attached scene inventory. Scene inventory excludes cached packets; the browser heap estimate excludes worker allocations. Adding geometry/cache bytes is still not total GPU or process memory.
- Drawing triangles/calls should remain comparable: this pass changes storage and scheduling, not mesh density, lights, shaders or pixel ratio. Compare the same level and camera conditions. A complete loaded level is a different residency workload from the earlier partial stream.

Validation: source review and a production build only. No tests, gameplay screenshots or visual reviews were run; device/gameplay validation remains user-owned.
