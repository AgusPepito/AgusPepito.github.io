# Phase 12 — P3 service passages, R1

Status: approved by the user. Next requested work is new concept art for recessed ground-based phase emitters.

The user approved W4 walls R2 and requested passages next. This models the previously selected P3 service gantry directly, without adopting the rejected exploratory assembly-concept redesigns.

## Delivered geometry

- Paired 4.5 m service columns with thick beveled ivory armor, actual vent and identification pockets, protected conduits and stepped brass couplings.
- Lower graphite service cabinets with separate doors, hinges, captive fasteners and lock hardware; upper cooling cassettes.
- A load-bearing lintel, segmented graphite fascia, recessed diagonal truss gallery, cooling bank and ivory crown caps.
- Pearl-white receiving fixtures in the jambs and a segmented recessed underside light strip. No phase field or colored phase coding.
- Standalone frames, separate left/right jamb and lintel views, wall-infill assemblies and offset assemblies seated on the road.

The sample opening is 10 m wide in road-surface coordinates and uses the existing 3.5 m `HOLE_HEIGHT` clearance. Structure remains outside the lateral opening or above the lintel boundary. Lights and trim do not extend below the clearance. Overall obstacle height is 7 m; longitudinal depth is 5 m. These are physical passages, not phase gates.

The selected frame and approved W4 infill share the wall deformation/merge helpers. Broad pieces follow the actual radius-18 tube profile, while small fittings retain rigid tangent placement. Inside curvature narrows the physical width above the floor just as the existing collision surface does. Flat infill ends at the road shoulders; tube infill is one continuous run around the remaining circumference, avoiding duplicate terminal trim at the periodic seam. Passage position comes from the same obstacle center/width used by collision.

## Review links

- [Flat frame](http://127.0.0.1:4174/library.html?category=12&asset=flat-passage)
- [Inside frame](http://127.0.0.1:4174/library.html?category=12&asset=inside-passage)
- [Outside frame](http://127.0.0.1:4174/library.html?category=12&asset=outside-passage)
- [Flat passage with walls](http://127.0.0.1:4174/library.html?category=12&asset=flat-passage-infill)

Each shape also has an offset wall/road assembly and individual jamb/lintel library entries. Drive links choose the corresponding passage course.

- [Flat course](http://127.0.0.1:4174/racer.html?review=12&element=passages&shape=flat)
- [Inside course](http://127.0.0.1:4174/racer.html?review=12&element=passages&shape=inside)
- [Outside course](http://127.0.0.1:4174/racer.html?review=12&element=passages&shape=outside)

Courses are 1,900 m long, with passages at 350, 850 and 1,350 m. Flat openings are centered, offset 4.5 m right, then 4.5 m left. Tube openings are centered, offset 12 m, then cross the periodic seam. W4 walls block the remaining road. Existing steering guidance, collision and T quarter-speed controls remain active. R retries. Wall-only samples remain at their existing URLs.

Source review and production preview rebuild only; no tests, simulation checks or gameplay visual inspection, per the standing instruction. Subsequently approved by the user. No commit requested.

Sources: `public/assets/track/service-passage-r1.js`, `src/racer/passage-kit.js`, shared helpers in `src/racer/wall-kit.js`, and library/level/view/menu integration.
