# All authored levels resident in RAM, v6

Open `racer.html?perf=1&preload=all`. The report identifier is
`all-level-cache-v6` (JSON schema 5). Without `preload=all`, the normal bounded
next-level prefetch remains available.

The experiment starts at Level 1 and generates all four authored levels in order
before enabling Play: First Shift, Around the Tube, Take Flight and Combinations.
It uses one generation worker at a time, without the normal 128 MiB prefetch cap.
Finished workers terminate. Every generated packet stays strongly referenced in
the cache until page reload, including when changing or replaying levels.
The unbounded sequence of Overload rounds and unused art-study assets are outside
this four-level measurement. Entering Overload generates that level normally in
addition to the retained four-level cache.

Active views borrow the cached typed arrays; switching levels creates render
objects without copying vertex/index/instance buffers or regenerating geometry.
Disposing a view releases its GPU resources and scene objects, not the cache.
Inactive levels remain procedural asset packets, including material descriptions.
They are not simultaneously attached to a scene or forced into GPU memory.

## Measurement

- `allLevelCache` in JSON contains readiness, total unique retained packet-buffer
  bytes, asset counts, startup wall time, per-level time/bytes and a breakdown by
  chunk, gate, obstacle, gap and checkpoint. Worker generation and packing times
  are reported separately from elapsed wall time. Generation starts automatically
  on page load; startup includes worker startup and frame scheduling, but excludes
  initial page download, module parsing and construction before the cache starts.
- The panel shows all-cache progress/bytes/time and unique retained geometry.
  Geometry referenced by both cache and current view is counted once. These are
  CPU backing-array bytes, not the total game memory or GPU memory.
- Main-thread JS heap baseline and sampled peak are recorded when the browser
  exposes `performance.memory`. These estimates do not include worker heaps and
  can miss short-lived peaks between samples.
- A browser memory snapshot is requested automatically after all four levels
  finish. `Measure memory` can request another snapshot. When supported,
  `performance.measureUserAgentSpecificMemory()` supplies bytes and a breakdown
  retained in the report. It may take time and trigger garbage collection. This
  is a browser estimate, not total operating-system process memory or VRAM.
  Unsupported browsers/isolation failures are explicitly reported as unavailable.
- CSV can be saved directly from the menu without driving. It includes all-cache
  readiness/bytes/startup time, heap peak and browser snapshot memory. The JSON
  contains the detailed per-level and per-family breakdown.

The Vite development/preview configuration sends cross-origin isolation headers
needed for the optional browser memory API. Existing preview processes need a
restart to receive those configuration changes; the measurement preview is served
separately on port 4175. This port has separate browser storage from port 4174.
Production hosting would need equivalent headers for that optional API.

For the startup capture, keep the page visible, wait for the cache to show ready
and for the browser memory snapshot to finish (or show unavailable), then save
JSON and CSV. Do not reset the panel after loading if preserving startup peaks is
the goal. A new cold generation run requires reloading the page. The cache summary
survives a panel reset, but earlier samples/heap peaks do not.

Validation: source review and a production build only. The user owns measurement
and visual/gameplay testing; no tests or automated browser checks were run.
