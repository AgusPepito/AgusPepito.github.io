# Categories 07–08 — outside and inside tube R1

The user accepted the repaired phase 06 sample, requested a local commit, and authorized both tube categories on 2026-09-24. The prior library is committed as `484ea2a` (`Add track module library and reviewed phase lane sample`). New tube work is a separate local revision awaiting user review.

## References and visible surfaces

Used the saved `02-outside-tube.png` and `03-inside-tube.png` concepts: graphite panels, flush ivory structural bands, occasional recessed service sections, restrained phase lanes and neutral interior lighting. No reference-image geometry or textures were imported.

The entire outer or inner circumference is drivable, so tall R3 roadside housings would become obstructions. Tube services instead use curved flush frames around 18 cm recesses. Pipe bundles sit under protective grilles; grille panels expose shallow dark backing; covers close the recess. These three families share one assembly. Surfaces behind the tube wall and detailed hidden equipment are omitted.

Only the 28 cm exposed mouth cross-section is modeled at actual ends. No full second shell, buried inside supports, concealed outside ribs or distant structures. The road has no gaps or new obstacles. Normal collision remains the game's continuous tube surface; flush grilles/covers bridge service recesses.

## Geometry and reuse

`public/assets/track/tube-surface-r1.js` is a standalone recipe-route-B procedural factory. It shares outside/inside construction through a sign change, uses the game's 18 m radius, 24 panel columns and 12.5 m panel courses, and includes flush bands every 50 m plus a periodic closure seam. The surface, service frames, fittings, end caps and interior lights are authored in unwrapped metres and mapped together to the cylinder. Crosswise subdivisions avoid flat chords through curved panels.

`src/racer/tube-kit.js` reuses the accepted phase-lane factory. Only crosswise tessellation was added to that factory; flat-road styling, dimensions and controls remain unchanged. Tube lane half-width is `3.24 / (π × 18)` in normalized coordinates, preserving the accepted 6.48 m physical width. Lane geometry uses the same strip records as matching-phase turbo, handles periodic wrapping, and retains depth bias. Lane inserts sit just above flush structural bands.

Runtime tube pieces are merged by material into 100 m chunks with the existing distance visibility. The last chunk is shortened to the course endpoint. No performance result is claimed without user testing. Static tube profiles in `track.js` use the same cylinder equations as the models and retain existing 360° steering, jump and turbo behavior.

## Review samples

- [07 library](http://127.0.0.1:4174/library.html?category=07&revision=r1&asset=assembly)
- [07 drive](http://127.0.0.1:4174/racer.html?review=07&revision=r1)
- [08 library](http://127.0.0.1:4174/library.html?category=08&revision=r1&asset=assembly)
- [08 drive](http://127.0.0.1:4174/racer.html?review=08&revision=r1)

Both samples are 1,800 m long and begin on a complete tube. The outside sample's cyan, amber and violet runs lead through one full circuit with short neutral breaks. The inside sample has a continuous violet spiral completing one turn, plus shorter cyan and amber alternatives. Thin neutral recessed emitters repeat around the inside circumference; a modest neutral ambient fill supports wall/ceiling readability.

The library offers the assembly, skin, mouth cross-section, bands/seam and each service-family recess; inside also offers its light strips. Front view looks through the mouth; zoom can enter the inside tube. Individual part selection remains available. These are complete straight tubes; flat↔tube transitions belong to categories 09–10.

## Delivery and user checks

- Source review complete; production build passed. Existing shared Three.js chunk-size warning remains.
- No tests, browser smoke checks, automated gameplay checks or agent visual playtesting. Only supplied concept references were viewed.
- User checks: full-circle steering, closure seam, lane-to-boost alignment, inside wall/ceiling readability, exposed mouths, service detail and mobile performance.
- Approval: pending for both 07-r1 and 08-r1. No new work on later categories.
- Official asset verification and final jam gate remain pending. No publishing requested.
