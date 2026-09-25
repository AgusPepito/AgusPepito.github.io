# Categories 09–10 — flat/tube transitions R1

The user authorized both transition categories after approving the shared brushed metal slabs and committing the earlier modelling stages as `cda7883`. This delivery reuses that plate finish, 12 m ivory service sections, phase-lane geometry and 18 m tube radius.

## Visible construction

The driver sees the road widening and curling, converging exposed edges, curved panel seams, shallow machinery trays, and the roof/walls forming in the concave version. These parts receive geometry. No giant portal, buried framework, full hidden shell or decorative collision obstacle is added.

- A shared quintic profile supplies both driving geometry and rendered surfaces. Opening reverses the same curvature progression. The slope and rate of slope change flatten at the flat/full-tube joins.
- Plate courses use the approved brushed finishes and shallow relief. Their column count adapts to width instead of stretching six flat-road columns around the full tube. Each course covers the complete cross-section; a shared recessed floor closes its seams. Separate gap-filler wedges are unnecessary for this continuous construction.
- Two ivory edge strips meet at the closed seam. Their thin exposed side fascia tapers away as closure removes the exposed edge. Bands follow the changing cross-section; there is no independent rigid ring crossing the road.
- Service frames follow the local surface, while fasteners, pipe bodies, valve fittings, locks and hinges are mounted rigidly in local tangent frames. Short ribbed pipe-end sleeves accommodate the changing frame orientation. The frame remains segmented into individual cartridges.
- Pipe, cooling, access and armor sections appear at authored intervals through closing, closed and opening portions. Their 12 m length and 0.7 m recess depth are retained; cartridge count adapts to the local circumference.
- Whole central service cartridges are replaced with slab plates to clear the lane. No service machinery or raised frame is hidden under the active lane.
- One continuous real phase lane stays 6.48 m wide in physical space. Matching-phase turbo uses that same physical width as the surface expands. Existing lanes without a physical-width override retain their original behavior.
- Neutral shoulder markers continue into curved portions. Category 10 uses ambient fill for interior readability. Slab materials retain the approved soft reflection environment.

## Samples

09 is 1,800 m: flat to 200 m, closing outside from 200–600 m, full outside tube to 1,050 m, opening to 1,450 m, then flat. Cyan lane; press 1 to match.

10 is 3,000 m: flat to 200 m, closing inside from 200–600 m, full inside tube to 1,000 m, opening to 1,400 m, flat connector to 1,700 m, closing outside to 2,050 m, outside tube to 2,350 m, opening to 2,700 m, then flat. Violet lane; press 3 to match. There is no direct inside/outside inversion.

- [09 driving sample](http://127.0.0.1:4174/racer.html?review=09)
- [10 driving sample](http://127.0.0.1:4174/racer.html?review=10)
- [09 individual assemblies](http://127.0.0.1:4174/library.html?category=09&revision=r1&asset=closing)
- [10 individual assemblies](http://127.0.0.1:4174/library.html?category=10&revision=r1&asset=closing)

Each category exposes closing, opening, midpoint, final closure, edge trim, pipe service, cooling service and bare slab assemblies. These library assets use the same profile and constructors as the driving sample. The original 01–08 samples remain available.

## Review status

Implementation delivered for user review. Source reviewed and production build passed; the existing shared Three.js chunk-size warning remains. Focus on closing/opening edges while steering, camera clearance, lane-width consistency and mechanical joins. No tests, simulations, browser checks or visual playtesting performed, in accordance with the user's standing instruction. Category approval remains pending. No new commit or publishing requested.

Sources: `src/racer/transition-profile.js`, `src/racer/transition-kit.js`, with integration in the track, level, view and library modules. The shared service factory adds optional cartridge-count and articulated-pipe parameters; its existing defaults are preserved.
