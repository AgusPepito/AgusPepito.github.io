# Gate generation: stage profiling and exact caching

Report identifier: `gate-stage-cache-v3` (JSON schema 3). Full-level loading and the next-level cache budget remain as in v2.

## Direct factory measurements

The user's request to profile gate generation was measured by invoking `campaignGate` directly in Node, using Level 2's full-width gate at station 1300. Each measurement used a fresh process, the same factory input, and stage instrumentation. These are individual local timing observations, not gameplay tests, a statistical benchmark, or browser loading-time measurements.

| Stage | Initial instrumented v2 | Final v3 |
|---|---:|---:|
| Source creation | 539 ms | 566 ms |
| Track conformation | 1,683 ms | 926 ms |
| Indexing and merging | 751 ms | 369 ms |
| Entire gate factory | 2,973 ms | 1,861 ms |

The final observation is approximately 37% shorter overall. Source creation did not improve. Conformation processes 15,201 source meshes; its largest remaining categories include perforated station frames and extension service frames. In the final run, exact-coordinate frame caching served 2,059,467 hits and required 326,012 new samples.

## Changes supported by the profile

- Cache curvature and centerline calculations by exact longitudinal station, bounded to 8,192 station entries per surface operation. Authored transition profiles retain their original point sampler.
- Cache gate surface positions and normals by exact `(s, u)` coordinates, bounded to 16,384 entries. Height offsets are applied afterward. There is no coordinate rounding, interpolation, or change to finite-difference offsets.
- Subdivision scans triangle spans without temporary coordinate arrays, reads indices directly, and copies untouched triangles directly. It no longer expands an entire indexed geometry merely because some triangles require clipping. Split planes, triangle order and attribute interpolation are retained.
- Campaign meshes already deformed into world coordinates are consumed by the merge rather than cloned and transformed by an identity matrix again. This path is explicitly opted into only for owned, baked meshes. The regular review/transforming path remains available.
- Indexed material batches write the output index buffer directly as a typed array, avoiding the general merge utility's intermediate JavaScript number array. Triangles, material batches and normal/UV/color seams are retained.

No tessellation thresholds, modeled hardware, materials, light settings or pixel ratio were reduced. The selected level still loads in full before driving. Large checkpoint waits can remain, especially when prefetch hits its memory budget; this pass does not claim those are solved.

## New report data

Every generated campaign gate carries `gateStages` through foreground and prefetch events. JSON also exposes a `gateProfiles` list for convenient comparison. It includes source creation, conformation, merge, index/copy and buffer-merge times; surface preparation/subdivision, frame sampling and normals totals; mesh/vertex counts; cache hit/miss counts; and the eight most expensive named mesh families.

Stage timings are nested, not additive: index/copy and buffer merging are inside merge; surface subtimings are inside conformation. Packing/bounds/transfer preparation remains the separate `workerPackMs` metric. The panel shows source/conformation/merge for the most recently profiled gate, which may belong to the next level. Reports carry its actual level and station.

Validation consists of direct factory timing measurements, source review and a production build. No automated regression tests, simulation runs or visual gameplay inspection were performed. Use the next user browser capture to assess actual gate times, total loading waits, memory and driving frame times.
