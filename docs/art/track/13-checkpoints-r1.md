# Phase 13 — checkered checkpoint set R1

Status: approved by the user, 2026-09-25. The user accepted the set and confirmed all current categories 01–13 complete. Next integration steps are recorded in the [library handoff](../../TRACK_LIBRARY_HANDOFF.md).

User-selected direction: C1's checker deck with recessed detail, C2's circular instruments, and the lamp cassettes shown in the selected reference crops. No letters or numbers on the asset. The user explicitly requested a white gameplay curtain and a modeled source for that light, superseding the earlier concept constraint against curtains.

## Modeled set

- Thirty metres along travel: fifteen metres before and after the central crossing plane. Five rows of large ivory/graphite checker plates preserve a readable broad pattern.
- Selected dark tiles contain deep circular timing instruments: concentric beveled bezels, graphite and steel retaining rings, calibration ticks, clamps, fasteners, dark optical glass and small pearl-white indicators.
- Recessed five-lamp timing cassettes, reflector cups, service locks and perimeter timing strips supplement the broad checker pattern. All mechanical and graphical details are text-free.
- A central row of inset projector lenses supplies the white crossing curtain. The neutral curtain is visual checkpoint feedback, not a phase-matching obstacle. It fades with height and curves radially around tube surfaces.
- All physical hardware stays below the driving skin. Flat and both radius-18 tube variants share the same construction. An even checker count closes the tube seam with alternating colors.
- Every slab layer is removed under the station before curving so recesses remain visible. Materials reuse the brushed metal maps and reflection environment from the approved set.

## Review

| Surface | Complete station | Hardware detail | Drive |
| --- | --- | --- | --- |
| Flat | [Station](http://127.0.0.1:4174/library.html?category=13&asset=flat-checkpoint&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=13&asset=flat-checkpoint-module&revision=r1) | [Demo](http://127.0.0.1:4174/racer.html?review=13&shape=flat) |
| Outside | [Station](http://127.0.0.1:4174/library.html?category=13&asset=outside-checkpoint&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=13&asset=outside-checkpoint-module&revision=r1) | [Demo](http://127.0.0.1:4174/racer.html?review=13&shape=outside) |
| Inside | [Station](http://127.0.0.1:4174/library.html?category=13&asset=inside-checkpoint&revision=r1) | [Module](http://127.0.0.1:4174/library.html?category=13&asset=inside-checkpoint-module&revision=r1) | [Demo](http://127.0.0.1:4174/racer.html?review=13&shape=inside) |

The library also includes complete hardware-only and road-mounted assemblies. Full assemblies merge geometry by material; the detailed module retains named parts.

Each 950 m review course crosses the checkpoint at 350 m. Any ship phase can pass. A review-only crossing event refills boost and displays confirmation without resetting the ship or changing its speed. Six hundred metres of clear road follow before the demo cycles to the next surface. Next surface, T quarter speed and R retry remain available. This does not replace campaign checkpoint assets or alter saved campaign progression.

Production build passed (`npm run build`) at delivery, with the existing Three.js bundle-size advisory. No gameplay tests or visual inspection were performed, per the standing user instruction. Source review only beyond the build. User approval is recorded above. The previously deferred loading/performance work remains separate. No commit requested.

Sources: `public/assets/track/checkpoint-r1.js`, `src/racer/checkpoint-kit.js`, category 13 library and review integration.
