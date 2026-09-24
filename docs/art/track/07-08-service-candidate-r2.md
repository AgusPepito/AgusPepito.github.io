# Tube ivory service section — approved R2 composition

The user found the R1 tube art too sparse and approved developing one detailed ivory service section before repeating it across the course. On 2026-09-24, the user approved the widened twelve-metre composition and requested variations: “ok . i approve of these build some variations..”. This approves the service-section composition for categories 07 and 08; the complete tube set remains under review.

## Visible construction

One twelve-metre section along the track, divided into 24 curved ivory plates around the circumference. The user requested doubling the original six-metre length because it passed too quickly. Panel spans and spacing are stretched along travel; tube radius, recess depth and hex bolt proportions are retained. The tube-skin opening uses the same length parameter. The composition alternates quiet armor with pipe trays, cooling cartridges and access doors. It uses the saved outside/inside concepts' ivory construction, charcoal cavities, neutral metals and restrained warm service lights.

- Pipe trays: 0.7 m recess depth, three substantial conduits, stepped couplings and retaining rings, two retaining straps, an offset valve block and access handle.
- Cooling cartridges: angled deep louvers, longitudinal support spines, release catches and a machined inner bevel.
- Access doors: asymmetric split doors, real recessed handle pockets, broad hinges and quarter-turn locks.
- Quiet armor: chamfered edges, occasional replacement ivory tones, offset seams, inspection plates and neutral service markers.
- Shared details: captive hex fasteners, small P/C/A function plaques and edge locking seats.

The tube skin and closure seam are cut away across the section before assembly, so road faces do not occlude its recesses. Depth goes into the structure on both tube types; nominal driving collision remains continuous for the hovering ship. Small raised rim/fastener details stay approximately within 0.13 m of that surface. No complete back shell, hidden skeleton or machinery behind closed armor was added.

Source: `public/assets/track/tube-service-belt-r2.js`. The same unwrapped source maps to either 18 m radius tube. World transforms are baked once and cleared from nested groups before display or material merging. The full original R1 samples remain available.

## Review

- [Outside belt alone](http://127.0.0.1:4174/library.html?category=07&revision=r1&asset=detail-belt)
- [Inside belt alone](http://127.0.0.1:4174/library.html?category=08&revision=r1&asset=detail-belt)
- [Outside with graphite surroundings](http://127.0.0.1:4174/library.html?category=07&revision=r1&asset=detail-r2)
- [Inside with graphite surroundings](http://127.0.0.1:4174/library.html?category=08&revision=r1&asset=detail-r2)
- [Outside driving candidate](http://127.0.0.1:4174/racer.html?review=07&detail=service)
- [Inside driving candidate](http://127.0.0.1:4174/racer.html?review=08&detail=service)

The library also exposes one pipe, cooling, access and quiet armor cartridge separately. Driving candidates are 400 m long with exactly one detailed section centered at 100 m and quiet graphite before/after it. Phase lanes and the old small grates are omitted in these dedicated candidates so the section can be assessed in isolation. Manual turbo, steering, jumping, pause and retry remain available.

The approved composition remains available at these links. Distribution and new geometry are delivered separately in [R2 service variations](07-08-service-variations-r2.md).

## Status

- Source reviewed; production build passed. Existing shared Three.js chunk-size warning remains.
- No tests, automated checks, browser smoke runs or visual playtesting performed, per the user's standing instruction.
- Twelve-metre composition approved by the user on 2026-09-24. New variations await review. Baseline library commit remains `484ea2a`.
