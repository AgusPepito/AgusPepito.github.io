# Phase 12 — repeatable W4 walls, R1

## R2 surface and detail revision

User reported z-fighting across white sections and requested substantially more visible detail against the selected W4 reference. The shared generator now delivers R2 on all three surfaces; existing library and driving links below open this revision.

R1's ivory sheets approximated the sloped backing only millimetres away and sometimes crossed it. The plinth and terminal bindings also shared exposed planes with adjoining parts. R2 uses a single measured profile for thick beveled armor and a backing set 0.20 m behind it. The plinth is moved behind the boot recesses, terminal trim stands clear of its cheek, and the crown head is separate from the upright shell. No polygon-offset or render-order workaround is used. The category-12 library near plane is also scaled less aggressively to retain useful depth precision at assembly scale.

Added actual cutouts and recess floors in the toe, sloped boot, upright vent, upper identification pocket and optical head. Details include washer-mounted fasteners, captive brass locks, inset louvers, joint bridges, beveled graphite service doors, hinges and latches, a lower cooling cassette, crown fascia hardware, pipe retaining rings, and paired recessed optical covers. Ivory and replacement armor now share a restrained surface-grain finish. The main wall dimensions, repeated bay pitch, obstacle positions and physics remain unchanged.

R2 approved by the user, who requested moving on to passages. No tests or agent gameplay inspection performed; source review and production rebuild only.

The user selected W4 Buttressed Bastion, rejected the direction of some later assembly concepts, and requested progressive iteration on actual geometry. This pass models walls only: flat road, inside tube and outside tube. Gates, passages and jump barriers remain unimplemented in phase 12.

## Geometry

Each nominal bay is 4.5 m wide, 7 m high and 5 m deep. The kit includes a starting bay, repeatable middle, ending bay, and an 18 m four-bay run with sealed ends. Longer runs retain the same repeated construction. Full tube rings distribute bays around the circumference and omit terminal caps at the periodic join.

- Tall tapered buttresses with segmented ivory face armor and broad sloped boots.
- Recessed brushed graphite wall plates, access hatches, captive fasteners and upper cooling cassettes.
- Separate front/rear crown rails around protected pipes, brass sleeves and ivory retaining saddles.
- Paired pearl-white optical fixtures in recessed crown housings. No phase-color coding or jump arrows.
- Sealed side cheeks, metal end plates and quieter rear service panels.

Tube structure conforms continuously to the existing radius-18 surface. Inside geometry extends inward to radius 11 at wall height; outside geometry extends outward to radius 25. Wide structural faces are subdivided before deformation; small bolts and coupling fittings use rigid tangent placement. Native depth remains longitudinal. Decorative wells sit inside the nominal collision envelope, with only normal thin face/fastener relief.

Start/middle/end controls remove terminal trim between joined runs. Bays meet across the shared crown and plinth. The middle is not a freestanding finished wall; use terminal caps at exposed ends.

## Library and driving review

- [Flat four-bay wall](http://127.0.0.1:4174/library.html?category=12&revision=r1&asset=flat-run)
- [Inside four-bay wall](http://127.0.0.1:4174/library.html?category=12&revision=r1&asset=inside-run)
- [Outside four-bay wall](http://127.0.0.1:4174/library.html?category=12&revision=r1&asset=outside-run)

Each surface also has starting, middle and ending bay entries and a wall seated on a short road. Tube entries additionally show full repeat rings and a run crossing the tube closure.

- [Flat driving sample](http://127.0.0.1:4174/racer.html?review=12&shape=flat)
- [Inside driving sample](http://127.0.0.1:4174/racer.html?review=12&shape=inside)
- [Outside driving sample](http://127.0.0.1:4174/racer.html?review=12&shape=outside)

Each 1,800 m course contains three real solid obstacles at 350, 800 and 1,250 m, with widths of 9, 18 and 22.5 m. Steer around them; no unavoidable complete-ring obstacle is inserted in a driving course. The third tube wall crosses the periodic closure. Existing wall collision, steering guidance and review-only T quarter-speed control remain active. R retries. The flat sample uses a straight profile to isolate the asset shapes.

User owns testing. No tests, simulation checks or gameplay visual inspections were run. Source review completed and production build passed, with the existing shared Three.js bundle-size warning. Preview remains available on port 4174. New wall geometry awaits user review. No commit requested.

Sources: `public/assets/track/buttressed-wall-r1.js`, `src/racer/wall-kit.js`, and phase-12 library/level/view/menu integration.
