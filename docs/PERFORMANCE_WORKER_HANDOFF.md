# Priority one: keep procedural generation out of driving frames

## Evidence

User capture `2026-09-25T02-03-56-541Z`: 49.3 seconds of driving, 38.36 average FPS despite a 16.7 ms median frame. 47 of 49 frames over 50 ms also contained substantial asset-generation work. The worst frame included 2,912.9 ms inside asset generation. A checkpoint handoff included 1,347 ms of run-start preparation. This change addresses those synchronous factories first.

## Implementation

- Campaign slabs, lanes, service sections, gaps, gates, obstacles and checkpoints use the same procedural factories and geometry detail in a dedicated module worker. A snapshot of the configured profile and encounter arrays keeps rendering tied to the same gameplay data. Construction review pages retain their original path.
- Geometry attributes and indices are transferred as ArrayBuffers created at runtime. No vertex blobs or pre-generated mesh files are shipped. Worker-computed bounding spheres avoid scanning large position buffers on the rendering thread.
- The receiver reconstructs BufferGeometry without copying attribute arrays. Mesh transforms, material parameters (including normal strength), vertex colors, render order, energy-group membership, phase tint metadata, and shared procedural normal/roughness maps are preserved.
- One job is in flight at a time and one result can await attachment. The main loop attaches at most one completed asset per callback. Work is requested nearest-first up to 2,300 m ahead, compared with the previous 1,100 m horizon.
- The full visible corridor must be ready before movement continues (800 m ahead, 180 m behind). The small horizon margin covers a capped simulation frame. A preparing-track notice appears if the worker falls behind, and the simulation clock holds. Menus/rendering remain responsive. Pause and background suspension do not automatically resume the race.
- Level changes terminate the old worker and discard queued results before starting a new stream. The WebGL renderer and reflection environment survive level changes; old scene geometries/materials are disposed. Same-level retries reuse built assets.
- Worker errors produce a visible reload message and prevent travel into missing geometry; there is no synchronous factory fallback that could silently reintroduce multi-second freezes.

## Measurements and limits

Reports and CSV logs label this version `worker-assets-v1`. Worker generation/packing, main-thread attachment and track-wait totals are separate. Compare wait duration as well as FPS, p99, worst frame and checkpoint events against the original capture.

This does not reduce mesh detail, material count, lighting, pixel ratio or the already observed high resident geometry memory. The wider build horizon and worker temporaries can increase memory pressure; worker heap is not included in the main-page heap estimate. First GPU uploads/shader compilation can still stall the renderer. These are explicit follow-up measurements, not claimed improvements in this pass. Next-level startup can still require a responsive loading wait; next-level prefetch is not implemented here.

Validation is source review plus a production build. No automated tests or visual gameplay review are run under the standing user-owned testing policy. The user should capture the same route at the same viewport/device settings, including a cold start and checkpoint transition, and save JSON plus CSV for comparison.
