# Obstacle action lighting R1

White symbols communicate an action; red boundary lights identify solid obstruction. Cyan, amber and violet remain phase colours.

## Assets

- J3 barriers have a 1.55 m-wide double-chevron display per module, a continuous segmented white clearance rail and red foot markers. The chevrons sequence upward as the active barrier approaches and brighten during the recommended takeoff interval.
- W4 blocking walls have red corner brackets and broad directional displays between their buttresses. The displayed direction comes from the same exit selected by the road guide. Displays turn off when no steering correction is needed or no candidate corridor is clear.
- Passage infill walls omit bypass displays, which would compete with the opening. Existing opening lights remain intact. Jump-or-opening banks keep static upward symbols on their jumpable portions.
- All additions stay within the existing solid envelopes and conform with the road/tube geometry. White signs use texture-free shaders; colours, UVs and settings survive worker decoding and repeated-module rendering. No new point lights.

## Guidance

`wallBypassCue` keeps the selected side while valid, checks the proposed route against road edges, gap footprints and solid spans, and allows a straight route when the player clears the wall. The same Hermite path supplies the road ribbon and the sign direction; collision and steering controls are unchanged.

`barrierJumpCue` inverts the existing rise/fall curve to estimate when the ship clears the obstacle height. It includes body height, nose/tail length, barrier depth and sampled track metrics. Coasting/current braking and continued boost bound forward travel. The recommended road band covers the final 8–18 m of the estimated safe launch interval. It recalculates before launch; it is guidance, not a guarantee after further braking or steering changes.

Only the active physical obstacle animates. Race time freezes flow on pause; reset/mode changes clear route selection. Reduced-motion mode keeps symbols static while retaining the steady readiness cue.

## User review

- Game: `http://127.0.0.1:5173/racer.html`
- Barrier model: `http://127.0.0.1:5173/library.html?category=12&asset=flat-barrier-run`
- Wall model: `http://127.0.0.1:5173/library.html?category=12&asset=flat-run`

The library uses a fixed right-arrow demonstration, labelled in its description; gameplay selects the actual direction. Source review and a production rebuild are the only agent verification. The user owns testing and visual assessment.
