# 02 — Pipe bays, revision 1

Status: approved by the user on 2026-09-24. Foundation 01-r1 was approved on 2026-09-24 and its asset source remains unchanged.

- Playable segment: http://127.0.0.1:4173/racer.html?review=02
- Individual assets: http://127.0.0.1:4173/library.html?category=02
- Approved foundation: http://127.0.0.1:4173/racer.html?review=01

## Assets delivered

Each `public/assets/track/pipe-*-r1.js` is a standalone default function of THREE returning a Group, with no imports, textures, network requests or downloaded geometry.

- Start: shallow socket bulkhead and sealed inlet ends.
- Straight: three parallel exposed pipes.
- Coupling: broad paired metal collars around a central sleeve.
- Valve: two compact housings with short stems and muted copper handles.
- Offset: three parallel doglegs returning to standard end positions.
- End: closing bulkhead and sealed pipe ends.
- All modules share visible support saddles and end collars.

404 recipe route B: agent-authored geometry using the approved flat concept image as style reference. No hosted model was called. This is one kit revision for user review; no official verifier or candidate-comparison approval is claimed.

## Placement and visibility

24 m module pitch, centered X/Z, +Z approach, support base y=0. Mount the insert at y=0.15 in foundation-local coordinates, x=±20. Pipe axes sit at y=0.22 within the insert; maximum valve top is 0.4375, giving 0.5875 after mounting, below the foundation's 0.6 m road skin. Pipe center offsets are -0.68, 0, +0.68 m. Doglegs return to those same positions at both ends. Pipes meet the existing solid frame dividers as enclosed feedthroughs, without cutting or altering approved framing.

Only exposed pipes, collars, top handles, shallow saddle supports and sealed end faces are authored. No concealed routing, backside fasteners or underside machinery. No phase-color lights. Bounds stay outside the road's collision envelope.

## Review assembly

Reuses the 1.8 km hazard-free foundation sample, bends, camera and controls. Frames still stop at 550 m and resume at 750 m. Each approved 100 m frame assembly has four bays, so the requested sequence is presented as short capped groups rather than stretching the approved frame: start / straight / coupling / end; start / valve / offset / end; plus reordered middle runs. The two sides use different groups. All six modules are selectable separately in the library.

The construction adapter deforms the combined modules along the road, shares same-name materials and merges geometry by material into culled 100 m chunks. No individual fitting draw calls in gameplay. Sample loops and does not write campaign progress or records.

## Asset library

`library.html` provides category and asset selectors, an individual mesh-node selector, orbit/pan/zoom, perspective/top/front presets, fit, wireframe and dimensions. Foundation components are extracted from the approved source; its complete assembly is also available. Pipe assets can be inspected individually or mounted in the foundation. Selection is reflected in the URL. View controls stay above the intentionally unmodelled underside.

## Delivery record

- Revision: 02-r1; local, uncommitted working tree.
- Build: production build passed; existing shared Three.js chunk-size warning remains.
- Tests/visual inspection: not run, per user instruction. User owns testing.
- Known limits: pipe detail stays within the approved shallow bay depth; user should assess readability at speed. Pattern variation is a category 05 task. No new ship or tube art integrated.
- User checks: visible distinction between straight/coupling/valve/offset, clean socket joins, no road intrusion, helpful library navigation, mobile performance.
- Official asset verification and jam gate: pending.
- Feedback: accepted; user authorized categories 03 and 04 together.
- Approval: 02-r1, user message “ok approved” on 2026-09-24.

