# Rigid hardware sharing, v5

Report identifier: `rigid-hardware-instancing-v5`, JSON schema 4.

This pass batches repeated rigid hardware in campaign gates, checkpoints and
service belts into `InstancedMesh` objects. A shared source mesh and one 64-byte
placement matrix per fitting replace separately transformed vertex/index arrays.
Groups require at least 32 identical parts, matched by all attribute/index bytes
and material/render settings. Hash matches are checked byte for byte. Meshes with
different source geometry are never combined based on name alone.

Eligibility uses the pre-existing rigid placement rule (fasteners, door hardware
and explicit rigid parts). Flexible panels, pipes, washers and cables remain on
the v4 deformation path. No additional part is made rigid, no tessellation is
reduced, and the existing track frame/anchor formula is retained. GPU placement
can differ slightly in floating-point rounding from baking world-space vertices.
Obstacle height preparation retains its baked path; review modes are unchanged.

Instance groups stay local to their owning asset. The worker builds their bounds,
then transfers geometry and matrix buffers. The main thread attaches them without
reconstructing individual fittings or scanning their vertices. The material merge
preserves the instance batches, and level disposal releases instance GPU buffers.

The panel includes shared batch/fitting counts. Geometry memory and prefetch
accounting include instance buffers. JSON gate stages now also expose
`rigidGroupingMs`, `rigidPlacementMs`, `rigidBatchMs`, `rigidInstances`, and
`rigidBatches`. Baked `surfaceTotals` exclude instanced fittings; total
`conformMs` includes both paths and their grouping overhead. CSV includes peak
instance counts and matrix buffer memory. Expanded geometry bytes now account for
each instance as a separate nonindexed mesh for the theoretical comparison.

Tradeoff: some previously material-merged geometry is now drawn in additional
instance batches, so draw calls and shader variants can increase. The intended
benefit is less duplicated geometry/deformation work, not fewer triangles. These
small fittings are only part of the level's memory, so this does not claim to
solve the remaining level loading wait or remove hundreds of MiB.

The v4 user capture had 483.32 MiB of Level 2 geometry buffers, 132 peak draw calls,
2,220,874 peak triangles, a 9.59 s Level 2 loading wait and 60 FPS. Compare the same
levels and viewport against that capture, including draw calls and frame times
to judge the tradeoff. No performance gain is claimed before the user measurement.

Validation: source review and production build. No automated tests, factory
benchmarks, browser checks or visual playtesting were run.
