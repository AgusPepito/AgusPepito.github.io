# Campaign geometry inspectors

## Active side modules

The `walls-dense-v1` layout targets 450 m wall runs separated by 50 m gaps, with per-bay exclusions for encounter clearance and nearly closed tubes (absolute curl >= 0.8). Runs shorter than four bays are omitted. Armor bookends retained pipe/grille/armor pieces; family stretches are now 50 m. This covers most otherwise eligible open road, including partially curling edges. Actual run length and coverage depend on encounters. Campaign wall pivots follow the current road half-width + 1.2 m, overlapping the slab edge by approximately 0.2 m, and the base is lowered to -0.03 m to meet the nominal road surface. Historical raised-foundation review mounting remains unchanged. More wall geometry is expected to increase generation time and cache memory; reports identify the changed content mix with `walls-dense-v1`.

`side-modules.html` shows the 15 retained R3 variants: four central pipe modules, three central grille modules, and eight armor modules including every start, end and ramp. Basic housings and pipe/grille terminal variants are removed from active generation. Campaign runs use armor ramps at exposed ends and central modules at family joins. Historical source files and earlier library revisions remain available for reference. Reports identify this content change with `side-kit15`; comparisons against earlier reports include a different roadside module mix.

## Current generation: v8

The gate and slow-assets viewers offer v8, v7 and original v6 generation modes. v8 skips fully masked road slab tiles before construction, instances compatible closed-tube jump-barrier sections, and uses shared gate strips with vertex-shader deformation when v7's rigid transforms cannot reproduce a bending/transition section. The existing v7 flat/straight-tube fast paths remain preferred. Unsupported authored review profiles keep their CPU path.

The full-width gate curtain and jump approach markings remain separate. The shader follows the analytic campaign point/frame formulas, keeps rigid fittings anchored in a single local frame, and transports normals with the deformation's Jacobian. This replaces per-copy CPU normal recomputation, so tiny shading/tessellation differences can occur. Generation time excludes the shader's ongoing GPU cost and shader compilation: compare gameplay FPS and appearance yourself as well as memory/startup. Shader-aware bounds are included in worker packets for culling and inspector fitting. Each part group uses conservative whole-gate bounds in this mode; Solo fits the gate envelope.

`assetOptimizations=off` on the racer restores the v7 generation paths for a direct whole-game comparison. `gateDeform=off` disables just the new gate shader while retaining tile skipping and barrier instances. `gateModules=off` disables all gate instancing. For a v6 geometry comparison use both `assetOptimizations=off&gateModules=off`. All default paths generate assets at runtime. Sharing is within each asset, not across separate gate packets.

v8 report events include `assetGeometry` (bytes, stored and placed triangles), `assetOptimization` (skipped slab tiles / barrier module plan), and gate stage profiles. Inspector comparison rows retain their generation mode and asset optimization data. The historical top-20 list stays based on the saved v6 measurements.

`slow-assets.html` selects the 20 slowest asset jobs from the saved v6 full-cache report exported on 2026-09-25 at 03:26 UTC. The ranked dropdown includes level, position and historical generation time. Its baseline card shows recorded generation, packing and geometry memory; the normal metrics show the newly generated asset using current code. The three empty road chunks show an explicit empty state. The jump barrier uses its actual gameplay batches. Only the selected item is generated, with no automatic benchmark loop. Completed samples are saved in a separate local comparison log and can be downloaded. The source filename and exact recorded values are preserved in `src/inspection/slow-assets.json`. URL `rank=1` through `rank=20` selects an entry directly.

Open `road-inspector.html` for road chunks and their decorations, or `gate-inspector.html` for gates. Both are production build entries and use the current campaign factories, deformation, geometry indexing and rigid instancing.

- Choose any of the four authored levels, then a chunk or gate. Road entries identify chunks containing service belts or roadside bays.
- Orbit, pan and zoom freely. Camera presets include the underside and rear. Fit visible parts after isolating a component.
- Named-part mode separates meshes by their original names. Select an assembly, hide groups or use Solo. Groups are sorted by buffer memory. Searching filters the list, not the geometry.
- Actual-game-batches mode uses the gameplay batching path. Named-part mode splits those batches, so draw calls and indexing-related buffer sizes can differ between modes.
- Wireframe shows tessellation; both-sided rendering displays the reverse of existing faces. It does not reconstruct deleted faces. Gates also have a curtain visibility toggle.

Only the selected asset is generated, in a dedicated worker. Changing selection terminates the previous worker and releases the previous asset's geometry and materials. The inspector does not load the full campaign cache. Shared material textures and the lighting environment remain resident.

Geometry memory counts unique backing buffers for attributes, indices and instance matrices. It excludes textures, GPU copies, browser overhead and worker generation peaks. Stored vertices cover the entire asset; visible triangles include instance multiplicity and exclude hidden groups. Viewer draw calls are the last rendered frame, including renderer culling and material passes, not a full-game performance result. Worker generation time is shown separately from packing and excludes main-thread upload/shader work.

The URL preserves level, station and mesh-layout selection for sharing or reopening. These pages do not change gameplay quality or geometry settings. Visual review remains user-owned.

## Original gate module comparison (v7 implementation)

The gate inspector defaults to actual game batches. Generation switches between shared modules and the previous implementation. Each completed generation saves one comparison row locally (latest 80), with a JSON download via Save comparison log. Rebuild sample provides repeat timing samples without changing the asset. Compare the same level, station and mesh layout in both generation modes.

Stored triangles count unique geometry once; placed triangles include each instance. Instancing reduces duplication, not visible faces. Source generation, deformation and packing timings exclude GPU upload and compilation.

Repeated wedges reuse the first strip's tessellation. The previous deformation split triangles on a global grid, so placed triangle counts can vary slightly between versions even though the same hardware and subdivision density are retained.

Useful examples: level 0, station 500 repeats six flat strips; level 3, station 1340 repeats nineteen outside-tube wedges. Flat sections support lateral sharing even on a sweeping centerline. Tube wedges require a constant cross-section and straight centerline across the entire station. The inspector reports a fallback reason when a transition or tube bend requires the original geometry, including level 1's gate at 1300.

Module geometry is currently shared within each eligible gate. It is not pooled across separate gate packets. The transparent curtain retains its original geometry. Existing rigid fitting instances are combined with module transforms without expanding their geometry.

Gameplay enables this by default. Append `gateModules=off` to a racer URL for the previous geometry implementation; retain `preload=all&perf=1` on both runs for whole-campaign comparison. Reports identify v7 versus v7-baseline, and gateProfiles include the selected module plan, geometry bytes, stored triangles and placed triangles.
