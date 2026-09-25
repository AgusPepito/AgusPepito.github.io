# Campaign racer performance audit — 2026-09-25

Scope: the playable `racer.html` campaign and its approved asset integration, using installed Three.js 0.180.0. This is a source audit, supported by arithmetic derived from geometry formulas and inspection of the installed renderer. No game execution, profiling, automated tests or visual inspection was performed. Runtime FPS, actual draw counts, GPU time and memory residency remain unmeasured. No runtime changes were made for this audit.

Targets confirmed by the user: typical laptops and mobile, preserving the approved visual quality as much as possible. Smooth 60 FPS is the working goal, not a measured result or a quoted jam requirement. Recommendations below are ordered by expected value from the source, not measured speedup. “Preserves appearance” means the intended result; the user still owns visual approval.

**Jam-rule correction, checked 2026-09-25.** The original recommendation to ship geometry buffers prepared during the asset build was inappropriate for this jam and has been withdrawn. The [authoritative jam rules](https://github.com/404-Repo/404-game-jam#the-one-hard-rule-and-how-it-is-checked) require asset modules to build geometry with Three.js constructors and operations, and prohibit literal vertex-array/encoded mesh payloads. Ship generator code, not baked mesh files or buffers. Generate geometry during browser loading or ahead of travel, optionally in a worker, then reuse the resulting in-memory geometry. The [official loader](https://github.com/404-Repo/404-game-recipe/blob/main/harness/assetlib.js) explicitly caches generated prototypes and merges geometry at runtime. Worker generation is an architectural inference consistent with that requirement, not an explicit organizer ruling. The same rules require a phone-viewport gate with touch interaction; shortlisted games are played on both a phone and laptop. No official gate was run here.

**Main conclusion.** The strongest risks are synchronous geometry generation during frames, excessive and non-indexed geometry, retained course memory, and rendering at a high pixel count. Draw calls and PBR shading matter, but the lighting setup is already modest. There is no evidence yet that removing lights would solve the reported hitches.

| Priority | Finding | Main cost | Recommended action |
| --- | --- | --- | --- |
| 1 | Complete chunk/encounter factories execute inside `render()` | Long main-thread stalls and allocation spikes | Generate from asset code in a worker/ahead of play; cache runtime prototypes; separately budget uploads |
| 1 | Dense slabs and global conversion to non-indexed geometry | Vertex processing, CPU/GPU memory, upload time | Reduce backing density; preserve indices; bake detail and add LOD |
| 1 | Every visited chunk stays allocated | Memory grows through a level; long disposal at level changes | Bounded resident window, reusable runtime geometry cache, explicit ownership |
| 2 | Fixed DPR cap of 1.75 plus antialiasing | Pixel shading, bandwidth, render-buffer memory | Quality presets and adaptive resolution with hysteresis |
| 2 | Independent material batches per family and chunk | Draw submission and uniform/state changes | Shared material palette; compatible batching; selective instancing |
| 2 | New renderer and PMREM preparation at level transitions | Transition stalls; lost renderer caches | Keep renderer, lighting and environment alive |
| 2 | Full detail everywhere, including tube backs and fogged distance | Unnecessary vertices and fragments | Near/mid/far geometry, bounded sector batches, conservative culling |
| 3 | Guidance resamples and rewrites geometry every frame | CPU allocations and dynamic uploads | Reuse sampling scratch data, cache invariants, reduce unnecessary updates |
| 3 | HUD and frozen game states update every animation frame | DOM/compositor work and power use | Change-driven UI, throttle numeric displays, render frozen scenes on demand |

**1. Frame construction and loading**

The integration currently builds nine road chunks synchronously at entry: stations -50 through 750, each 100 m long. Encounters with their start before 850 m also build immediately. Later, `RaceView.render()` chooses one pending item within 1,100 m and executes the complete factory. This bounds item count, not elapsed time. A tube station can be much more expensive than a plain road chunk.

Each road chunk includes up to eight slab factories, lane factories, cutting, subdivision, per-vertex surface mapping, repeated normal computation, temporary mesh/material allocation, non-indexed conversion and merging. A completed CPU build does not mean the asset is GPU-ready: buffer upload and first shader use can still occur when the object becomes renderable. The present lookahead prepares geometry but does not guarantee pre-upload or shader warmup.

The current frame loop clamps elapsed time to 60 ms. A long build can therefore affect both responsiveness and the relationship between wall-clock time and simulated race time. Optimizing this by reducing the simulation frequency would conceal the construction problem and risk changing gameplay.

Preferred architecture for the existing authored levels:

1. Ship recipe-generated asset source. Build immutable road geometry and reusable module variants from that code in the browser, ahead of use, and cache indexed buffers and material IDs in memory. Do not ship precomputed mesh payloads.
2. Keep road geometry independent of mutable gate phase. Separate immutable hardware from phase-tinted pieces and gameplay entities.
3. Run CPU geometry construction in a worker for authored courses as well as future edits or procedural layouts. Transfer buffers generated during that browser session; do not copy large nested vertex arrays or try to transfer live Three.js materials. This runtime transfer differs from distributing mesh data as assets.
4. Integrate worker results in bounded pieces. Geometry upload, material preparation and shader compilation still require deliberate scheduling; a worker alone cannot eliminate those stalls.
5. Warm representative shader variants with the actual lighting/environment before play. `compileAsync` addresses shader preparation, not geometry generation or all buffer uploads. See the [renderer API](https://threejs.org/docs/pages/WebGLRenderer.html).
6. Use a sorted pending queue with a cursor instead of allocating `filter().sort()` results every frame. This is a small cleanup compared with the factories.

An incremental fallback must yield *inside* large jobs. Wrapping the current synchronous factory in `setTimeout`, a promise or `requestIdleCallback` only moves the stall. A tentative 1–2 ms main-thread integration budget is a scheduling goal to evaluate, not a demonstrated cost.

Evidence: [view.js:266](../src/racer/view.js), [campaign-kit.js:68](../src/racer/campaign-kit.js), [course-surface.js:54](../src/racer/course-surface.js), [main.js:547](../src/racer/main.js).

**2. Geometry density: the largest concrete excess**

Every slab patch uses about 0.3 m crosswise spacing and 1 m longitudinal spacing. This applies even to the full recessed backing beneath the plates. The campaign generates 12.5 m tiles.

For an intact, constant-width 100 m section, the backing alone therefore has:

| Surface | Calculation | Backing triangles before cuts |
| --- | --- | ---: |
| Flat, 36 m | `8 × 2 × ceil(36 / 0.3) × ceil(12.5 / 1)` | 24,960 |
| Tube, circumference 113.097 m | `8 × 2 × ceil(113.097 / 0.3) × 13` | 78,416 |

These are source-derived construction counts, not measured frame counts. They exclude visible plate tops, bevels, bolts, lanes, service bays and stations. Plate tops add another substantial layer of comparable covered area. Cuts can remove triangles or split them further. Most backing is hidden under opaque plates, although it must remain where seams/recesses expose it.

The merger converts geometry to non-indexed form. Position + normal + UV use 32 bytes per vertex, or **96 bytes per triangle**. The tube backing above alone becomes about **7.18 MiB of vertex attributes per 100 m**, before CPU/GPU copies, temporary buffers and other geometry. A dense indexed grid can share approximately six triangle-corner references per interior vertex; preserving indices can cut storage substantially, though the result depends on seams and discontinuities. Index buffers also have a cost.

Recommended changes:

- Give hidden backing its own much coarser topology. On flat, truly straight pieces it can be a simple quad; on curves it needs only enough subdivision to follow the shape and stay concealed. Alternatively emit only the backing visible through seams and apertures.
- Generate geometry only for surviving spans. Fully removed slab tiles should be skipped before creating their meshes. Apply exact clipping only at boundary tiles and partial openings.
- Preserve indexed geometry through transforms and merging. Re-index clipped output during runtime preparation using all relevant attributes; never weld across intentional normal, UV, material or curtain-color discontinuities.
- Use curvature and projected error to choose subdivision, rather than applying dense grids uniformly. At radius 18 m, the approximate chord error is 1.1 mm for a 0.4 m chord and 15.6 mm for 1.5 m. The useful tolerance varies with camera distance and silhouette visibility.
- Keep real geometry for outer silhouettes, apertures, obstacle clearances, collars and close-range large bevels. Bake tiny fasteners, narrow grooves, seams and far louvers into maps or remove them at distance.
- Eliminate repeated `computeVertexNormals()` stages where an earlier result is immediately discarded. Compute final normals once, preserving hard-edge topology.
- Cache immutable source variants. Do not cache destructively cut or deformed meshes and reuse them as if unchanged.

Evidence: [slab-surface-r1.js:43](../public/assets/track/slab-surface-r1.js), [wall-kit.js:41](../src/racer/wall-kit.js), [gap-geometry.js](../src/racer/gap-geometry.js).

**3. Surface sampling and construction allocations**

`mountCourseSurface` calls the gameplay frame sampler for every non-rigid vertex. One `frame(s,u)` uses five `point()` calls and creates additional vectors for the basis; the deformer then clones the point again. This is convenient and keeps the geometry aligned with physics, but it is expensive at asset-generation scale. Subdivision and polygon clipping also build many temporary JavaScript arrays with `map`, `flatMap`, `slice` and spreads, then copy them into typed arrays.

Introduce an allocation-free `sampleInto(s,u,out)` and analytic derivatives for the existing smooth profiles. Cache longitudinal profile data for repeated stations within a build. Rigid fittings need one tangent frame per instance; they do not need a full surface evaluation for every vertex. Emit typed buffers directly or use reusable growable builders. Keep one mathematical surface definition shared with physics; a second approximate visual profile would risk placement disagreement.

GPU deformation is a later option for repeated unwrapped modules, but it trades CPU preparation for per-frame GPU work and requires correct normals and conservative bounds. It does not eliminate cuts or automatically solve curved instancing. First generate and cache geometry from asset code during browser preparation, with expensive construction off the main thread where feasible.

Evidence: [course-surface.js:5](../src/racer/course-surface.js), [track.js:52](../src/racer/track.js).

**4. Draw calls, merging, batching and instancing**

There is already useful batching: source parts are merged by material name into one mesh per material *within each road chunk or encounter*. A thousand bolts do not necessarily become a thousand draw calls. Their geometry, construction and memory costs remain.

Source-based pass estimates, assuming every resulting mesh is visible and populated:

| Asset | Approximate submitted draws |
| --- | ---: |
| Plain campaign slab chunk | About 6; additional trim variants can add one |
| One lane phase in a chunk | About 4, with endpoint ivory adding one |
| W4 wall | Up to 7 |
| P3 opening with W4 infill | Up to 13, because material names differ between families |
| Phase emitter | 8 opaque batches + 2 curtain passes = up to 10 |
| Checkpoint | 7 opaque batches + 2 curtain passes = up to 9 |
| Service belt | Up to 8 added material batches |

The station visibility window selects about 9–10 road chunks before frustum culling. Six slab batches alone imply roughly 54–60 potential road draws, before lanes, decorations, encounters, ship and guidance. These are planning estimates, not actual `renderer.info.render.calls` values. Culling, empty geometries, different variants and double-sided transparency change the result.

Priorities:

- Pool genuinely identical materials across chunks. This reduces allocations and state/uniform churn, but **does not automatically merge separate meshes into one draw**.
- Introduce a shared graphite/ivory/steel/brass palette where parameters really match. Preserve roughness, metalness, normal scale, emissive settings, sidedness and color-space behavior. Material-name equality alone is not a safe compatibility test.
- Pack static base color and selected scalar variations into vertex attributes or material textures where this meaningfully combines batches. An atlas alone does not combine draws; geometry, shader and render state must also be compatible.
- Use instancing for repeated rigid bolts, ribs, cartridges and canonical modules with compatible geometry/materials. Existing merged bolts may already cost one draw per material, so their principal instancing benefit could be memory and build time rather than another draw-call reduction.
- Whole deformed modules are not ordinary transform instances when the road bend or curl changes. Instance canonical straight sections where valid; prepare and cache unique transition buffers at runtime.
- Evaluate `BatchedMesh` for different geometries sharing a material, but keep spatial partitions. Its per-object sorting and culling also consume CPU; it is not a universal replacement for well-sized merged chunks. The [instancing API](https://threejs.org/docs/pages/InstancedMesh.html) and [batching API](https://threejs.org/docs/pages/BatchedMesh.html) describe these distinct cases.

Avoid merging the entire course into one mesh: it would sacrifice useful culling and streaming granularity. Preserve independent phase tint ownership or explicit per-instance phase data.

**5. Culling, visibility and levels of detail**

The current road visibility window is approximately -180/+760 station metres, camera far is 850 m, and fog reaches full strength at view depth 710 m. Fog changes the output color; it does not remove geometry submissions. Station distance, world distance and camera-space depth differ on bends, so simply replacing all cutoffs with 710 would be unsafe, especially for fog-free guidance.

Road chunks combine a full tube circumference per material. Their bounds often intersect the camera frustum even when much of the circumference is irrelevant. Back-face culling and depth rejection can reduce rasterization, but they do not provide per-sector CPU rejection of vertex work. Use a modest number of circumference sectors where the saved geometry outweighs the extra draw calls. Preserve ceiling/side visibility when the player circles inside tubes; do not assume a fixed “top half.”

Use near/mid/far detail chosen by projected size and conservative bounds. Tentative distance bands of 0–120 m, 120–300 m and 300 m to fog are starting points for user evaluation, not final settings. Tiny metal fittings can disappear or become baked detail well before a wall silhouette or phase curtain does. At 285 m/s, 100 m passes in about 0.35 seconds, so use hysteresis and prepare the next detail tier early enough to avoid popping.

Freezing static world transforms after attachment avoids repeated matrix recomputation. Installed Three.js updates the scene hierarchy before visibility-based render traversal; setting `.visible=false` alone does not stop all matrix-update traversal or release resources. Do not freeze the camera/ship or descendants that move. Detaching cold chunks provides a stronger bound than hiding them.

Evidence: [view.js:338](../src/racer/view.js), installed `three/src/core/Object3D.js:updateMatrixWorld` and `three/src/renderers/WebGLRenderer.js:render/projectObject`.

**6. Materials, shaders and transparency**

Most surfaces use `MeshStandardMaterial`, with some combination of normal/roughness maps and a prefiltered environment. This preserves the approved brushed-metal finish, but costs more fragment work than unlit shading. Color, roughness and metalness differences are not necessarily separate shader programs: the installed renderer caches programs by compatible shader features. Count materials and compiled programs separately.

Keep PBR on large visible metal surfaces. Investigate cheaper shading for strongly emissive indicator strips and deep dark recesses, then a simpler far-distance material. Replacing all PBR with unlit material would change the approved appearance and may not fix CPU generation stalls. Custom shaders, a packed material-ID palette or baked lighting are later options if GPU shading remains limiting after geometry/resolution improvements.

Phase/checkpoint curtains, the guide ribbon and the takeoff band are transparent and double-sided. The installed renderer uses two passes by default. `forceSinglePass=true` is a concrete candidate for these thin surfaces. It saves one pass per affected mesh; inside tubes, front/back overlap and additive brightness still need user review. See [Material.forceSinglePass](https://threejs.org/docs/pages/Material.html).

The emitter curtain has `ceil(width / 0.25) × 24` cells. At 36 m this is 6,912 triangles; at a full 18 m-radius tube, 21,744 triangles, before any later processing. Its vertical scan/fade is baked into vertex colors. Moving that variation into a small shader function could reduce vertical subdivisions substantially while retaining enough crosswise segments for curvature. This trades geometry for fragment arithmetic and must be judged alongside screen coverage.

Transparent surfaces do not write depth here, so overlapping curtains/guides can repeatedly shade the same pixels. Keep opaque occlusion, minimize covered transparent area, and avoid blanket `DoubleSide` use on opaque surfaces. Do not disable depth testing for the stations as a performance shortcut.

**7. Lights and reflections**

The ordinary campaign has two directional lights, one hemisphere light and one ambient light. There are no point/spot lights per fixture, shadow maps, dynamic reflection captures, SSAO, bloom or screen-space reflection passes in this renderer. Glowing fixtures are emissive meshes, not lights illuminating nearby geometry.

Removing one directional light can reduce the direct-light evaluation inside PBR shading. The ambient term is comparatively small; light count is not a draw-call multiplier in this unshadowed forward-rendered setup. I would investigate geometry and pixels first, then compare a one-directional-light quality mode if GPU timings justify it.

The reflection studio is converted into a PMREM once per renderer, not every frame. Its six emissive panels are not part of the gameplay scene. It is therefore primarily a startup/transition preparation cost plus an ongoing environment-sampling cost on reflective materials. Keep the useful environment; reuse its renderer-owned resource across level switches or ship a prefiltered environment. Avoid rebuilding it for UI or phase changes.

Evidence: [view.js:89](../src/racer/view.js), [slab-kit.js:64](../src/racer/slab-kit.js).

**8. Resolution and antialiasing**

The renderer requests antialiasing and caps device pixel ratio at 1.75. At a 1920×1080 CSS viewport on a device reaching that cap, the internal image is 3360×1890: **6.35 million pixels**, 3.06 times DPR 1. Antialiasing adds sample/storage/bandwidth cost; its actual sample count is context-dependent and was not queried.

Changing the cap from 1.75 to 1.25 would reduce pixel count by about 49%; changing to 1.0 would reduce it by about 67%. These are pixel-count reductions, **not promised FPS gains**, and the cap change matters only on devices above the new cap. It will not solve a synchronous CPU build.

Use a render-scale setting independent of DOM resolution. Start with explicit presets, then add adaptive resolution only after a stable timing signal exists. Use smoothed timings, hysteresis and cooldowns; resizing every frame reallocates buffers and can create its own hitches. Treat MSAA separately and compare quality with the user. Do not add an expensive post-processing chain merely to replace current antialiasing. [MDN recommends smaller back buffers as one performance lever](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

**9. Texture and geometry memory, caches and lifetime**

The shared grain maps are only two 256×256 RGBA textures. With full mip chains their nominal uncompressed payload is about **0.67 MiB**, excluding implementation overhead. They are cached and marked as shared. These textures are unlikely to be the main memory problem compared with dense geometry. Mipmaps are useful; anisotropy is capped at 8 and can become a quality setting. Compressing these tiny maps is a lower priority than eliminating excess vertex data.

Loaded chunks and encounter meshes remain in the scene for the entire level and same-level retries. Culling only hides them. That is intentional retention rather than proof of a leak, but means memory grows as the player advances. Long non-indexed courses can keep large CPU attribute arrays and GPU buffers simultaneously. Temporary construction arrays raise peak memory above steady-state residency.

Use a bounded resident window with a small look-behind region. Keep runtime-generated immutable data in a separate bounded in-memory cache, and rehydrate or regenerate evicted chunks for retries. Cache keys must include geometry/profile/cutout versions and supported dimensions; avoid keys that accidentally force geometry rebuilds for phase-only changes. Track ownership explicitly for shared maps, geometry, materials, environment render targets and dynamically colored station resources.

At level change, `start()` disposes the whole `RaceView`, creates another renderer and rebuilds the initial region. Keep the renderer/camera/global resources alive and replace only course-owned content. This preserves renderer caches and allows preparing the next level ahead of the checkpoint. Context-loss handling should cancel pending jobs and restore/recreate resources deliberately rather than continuing to allocate into a lost view.

Evidence: [main.js:268](../src/racer/main.js), [view.js:286](../src/racer/view.js), [slab-surface-r1.js:4](../public/assets/track/slab-surface-r1.js).

**10. Gameplay CPU, guidance, effects and UI**

The simulation runs at 120 Hz and uses simple analytic collision against small authored arrays. Most distant obstacles exit collision checks early. Preserve the step rate and collision behavior initially; there is stronger evidence of cost elsewhere. If content grows, maintain sorted encounter cursors and cache constant obstacle spans instead of scanning/reallocating everything.

Guidance is a more substantial per-frame CPU candidate. It uses 129 ribbon samples, up to 44 arrow samples, markers and up to 144 takeoff-band frame evaluations. Each full surface frame creates vectors and evaluates the road repeatedly. It also recomputes jump advice which the HUD independently asks for. Reuse scratch objects; share jump-cue results; cache static gap metrics and route intervals; separate geometry changes from color/phase changes. Consider reduced sample counts based on curve error and lower-frequency route reconstruction with smooth display updates. Keep near-edge cues responsive.

Dynamic guidance buffers are reused, which is good, but their attributes use default usage hints and are uploaded whenever updated. Use `DynamicDrawUsage` where appropriate; this is a driver hint, not a guaranteed speedup. Reduce the amount and frequency of work first.

Speed effects are just one 64-segment line batch plus camera transforms. Their buffers are small. Early-return when the effect is invisible and precompute constant angles/radii; this is a minor improvement, not the first optimization project.

`sync()` and `updateHud()` run every frame and repeatedly write static text, CSS variables, classes and ARIA attributes, including hidden menu content. Cache DOM nodes, update state-driven elements only on change, and update numeric displays around 10–20 Hz while retaining responsive controls. A progress/boost transform can avoid repeated width-layout work. Profile before claiming forced synchronous layout: this source alone does not establish layout thrashing.

Paused, ready and crashed states still request frames, update the UI, render and may build pending assets. Draw frozen scenes only on relevant changes once pending preparation is handled explicitly. Pause on blur/visibility change already exists. The full-screen speed-wash shadow and overlay backdrop blur are compositor costs, especially on mobile, but no measurements establish their share.

Evidence: [guidance.js:41](../src/racer/guidance.js), [simulation.js](../src/racer/simulation.js), [main.js:502](../src/racer/main.js), [speed-effects.js](../src/speed-effects.js), [style.css](../src/racer/style.css).

**11. Download and JavaScript startup**

The built racer entry preloads Three.js (~705 kB raw), a shared factory/kit bundle named `checkpoint-kit` (~286 kB), geometry utilities and speed effects; the racer entry is ~68 kB raw. Together the listed JS files are about 1.07 MB raw. The previous build reported roughly 256 kB gzip for that set, but those estimates do not establish what a particular server transfers. Compression headers, caching and actual requests need network measurement.

The shared chunk name is a bundler label, not evidence that the checkpoint alone weighs 286 kB. Static review imports and many source variants are reachable from the same runtime modules. Split review-only pages/tools from the campaign path and load them only when requested. Bundle and optimize generator code during the build; retain actual geometry generation in the browser for the jam. Hashed production assets can use long-lived caching while HTML remains revalidated. Small JS download size does not imply fast procedural mesh construction.

No dependency upgrade or engine migration is required to address the main findings. WebGPU is a separate engineering choice, not a cure for allocation-heavy CPU factories, excessive geometry or unnecessary work.

**12. Measurement needed before claiming results**

The next performance pass should collect telemetry during user-driven play. Under the standing testing instruction, this audit did not run a benchmark, replay, screenshot review or profiling session. A passive optional diagnostics panel/export would let the user produce comparable samples without surrendering gameplay testing.

Collect these separately:

| Signal | Why it matters |
| --- | --- |
| Frame-interval median, p95, p99 and worst spikes | Smoothness; average FPS hides stalls |
| CPU time for simulation, HUD, guidance, geometry jobs and render submission | Finds the main-thread contributor |
| Asynchronous GPU timer queries, when supported | Distinguishes shader/pixel/vertex limits from CPU work |
| `renderer.info` calls, triangles, lines, programs, geometry/texture counts | Tracks rendering workload and object growth |
| Attribute/index byte totals, resident chunks, pending queue size | Estimates geometry footprint; object counts are not memory bytes |
| Worker build, main-thread integration, shader-ready and first-visible timestamps | Separates generation from upload/compilation hitches |
| Viewport, DPR/render scale, browser, hardware, antialias settings | Makes comparisons meaningful |
| Cold launch, level switch, same-level retry, late-level residency | Reveals lifecycle costs and retained memory |

Timing `renderer.render()` with a CPU clock measures submission-side elapsed time, not total GPU execution. Use asynchronous disjoint timer queries where available, discard disjoint results, and avoid blocking GPU readbacks. Renderer memory counters are counts, not VRAM totals. [Renderer statistics](https://threejs.org/docs/pages/WebGLRenderer.html) and [nonblocking GPU timing](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query) document these distinctions.

Suggested user-driven comparisons: entry straight, outside tube with service detail, a phase station, inside tube, a gap, finish transition, and repeated retry. Compare the same mode, camera position, render scale and warm/cold state. No invented speedup percentages or universal draw-call threshold can substitute for this.

At 60 Hz the frame interval is 16.67 ms; at 120 Hz it is 8.33 ms. Set CPU and GPU headroom independently because work can overlap. A useful first goal is eliminating visible construction spikes and keeping residency bounded, then meeting the chosen frame target. Any numerical CPU/GPU or draw/triangle budget remains provisional until hardware and measurements are available.

**Recommended implementation order**

1. Add optional lightweight telemetry for user play; record an unchanged baseline.
2. Remove synchronous full-asset generation from the render path; preserve the renderer/environment across levels; cache canonical geometry and introduce bounded residency.
3. Simplify backing, keep indices, avoid unnecessary clipping and normal recomputation, and make the surface sampler allocation-free.
4. Pool materials; prepare shaders/uploads; update HUD/state only when needed; freeze static transforms; evaluate single-pass thin transparency.
5. Add LOD/baked microdetail and targeted instancing/sector culling. Let the user approve appearance changes at each step.
6. Tune render scale, antialiasing and material/lighting quality from GPU measurements. Consider a custom packed material system or shader deformation only if the remaining bottleneck warrants the complexity.

The first pass should preserve the approved visual design and gameplay. Maximum useful optimization means removing work that cannot affect the result, then making explicit quality tradeoffs where measurement shows they matter.
