# Phase 12 — J3 barriers and complete obstacle assemblies R1

The user authorized the proposed J3 louver kit and three assembly types across flat, outside-tube and inside-tube surfaces, then approved the complete delivered set on 2026-09-25. Phase 12 is complete. The previously reported gate loading hitch remains deferred to a separate performance pass.

## J3 kit

Nominal 4.5 m repeatable middle modules, starting/ending modules with armored exposed caps, and four-bay runs. Ivory frames surround deep angled louvers, machined leading edges, protected cooling pipes and couplings, recessed pearl-white jump chevrons and lock tabs. The top has actual cooling-tray apertures, fins, access covers and brass latches. Rear service panels and end covers sit outside a setback opaque core so they remain visible without coplanar layers.

Low barriers retain 2.4 m height and 5 m longitudinal depth. Wider runs add modules rather than increasing obstacle depth. White approach chevrons at 12 m and 24 m provide advance readability. These neutral markers carry no phase requirement.

## Assemblies

| Type | Geometry | Existing collision dimensions |
| --- | --- | --- |
| Opening-only | Approved P3 passage with W4 tall wall infill | 7 m overall height; 3.5 m clear opening; 5 m depth |
| Jump-or-opening | Purpose-built compact P3 columns and a shallow service lintel, with taller J3 infill | 4.2 m overall height; 3.5 m clear opening; 5 m depth |
| Jump-only | Continuous low J3 bank across the road or around the complete tube | 2.4 m height; 5 m depth |

The compact passage is not a scaled-down P3 mesh. Its lintel is authored in the 0.7 m space above the opening, with a segmented receiving-light row, recessed cooling slots and separate roof armor. Side columns remain outside the opening. Taller J3 infill adds louver rows while preserving the fittings' proportions.

The same surface coordinates define the opening center, width and obstacle placement. Broad faces and fittings are conformed around radius-18 inside/outside tubes. Closed-tube infill is one continuous run around the remaining circumference, with no extra terminal caps at the periodic seam. Surface width is measured along the road, as it is in collision. No changes to collision rules, ship dimensions, jump physics or obstacle thickness were made.

## Library and playable review

- [J3 middle module](http://127.0.0.1:4174/library.html?category=12&asset=flat-barrier-middle&revision=r1)
- [J3 end cap](http://127.0.0.1:4174/library.html?category=12&asset=flat-barrier-end&revision=r1)
- [Opening-only assembly](http://127.0.0.1:4174/library.html?category=12&asset=flat-obstacle-opening-only&revision=r1)
- [Jump-or-opening assembly](http://127.0.0.1:4174/library.html?category=12&asset=flat-obstacle-jump-or-opening&revision=r1)
- [Jump-only assembly](http://127.0.0.1:4174/library.html?category=12&asset=flat-obstacle-jump-only&revision=r1)
- [Cycling obstacle course](http://127.0.0.1:4174/racer.html?review=12&element=obstacles&shape=flat)

Every library entry also has `outside-` and `inside-` versions. The offset assembly demonstrates a passage crossing the tube seam.

The 2,100 m course contains opening-only at 350 m, jump-or-opening at 850 m, jump-only at 1,350 m, and an offset jump-or-opening at 1,800 m. It cycles flat → outside → inside automatically. The starting-surface selector and Next surface button allow direct comparison. Space jumps, T slows, and R retries the current surface. Existing guidance remains active; for optional openings it points toward the opening while the white barrier chevrons identify the jump alternative.

Production build passed (`npm run build`), with the existing Three.js bundle-size advisory. Source review only beyond the build: no tests, simulation checks or gameplay visual inspection, following the user's standing instructions. User-reported gate loading delay/frame hitch is explicitly deferred to a later performance pass. No commit requested.

Sources: `public/assets/track/jump-barrier-r1.js`, `src/racer/obstacle-kit.js`, library catalog and review integration. Existing P3/W4 geometry and shared surface-conformance helpers are reused.
