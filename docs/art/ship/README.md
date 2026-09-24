# Ship studies — orbital motorsport

Status: three candidates authored; no winner selected. Recipe verifier, render-sheet review, and gameplay integration are pending. No tests or visual gameplay review were run. The user owns selection and testing.

## Style lock
Ivory ceramic armor over graphite machinery; compact late-1990s racing silhouettes; visibly separated engine pods; one large phase core readable from the chase camera; restrained orange identification accents. Energy uses the gameplay cyan/amber/violet palette. No weapons, logos, imported meshes, textures or mesh blobs.

## Reference
`orbital-reference.png` was generated using the built-in OpenAI image-generation tool on 2026-09-24. It is a design reference, not an in-game texture or model. No model identifier was exposed by the tool; do not invent one in the submission.

Prompt used:
> Create one isolated original anti-gravity racing spacecraft concept reference for a small Three.js game. Plain light gray studio background, even neutral lighting, entire ship visible filling frame, elevated REAR three-quarter view clearly showing twin exhausts, top and one side. Retro-futurist orbital motorsport, late-1990s bold low-poly silhouettes with crisp bevels, restrained real physical materials. Compact 3.1m wide by 3.9m long by 0.9m high. Ivory ceramic angular central fuselage tapered to pointed nose, graphite underbody and recessed canopy, two separated pronounced engine pods along sides, swept short fins, large luminous CYAN phase core on rear deck visible to chase camera and two cyan exhaust centers. Tiny orange identification accents but NO text, logos, guns, wheels, photographic textures, stars, environment, motion blur or bloom wash. Modelable using extruded polygon profiles and low-segment primitives. Strong negative spaces between side nacelles and central body, purposeful racing machinery. One ship only, not a sheet, no alternate views.

## Independent construction attempts
- A / Kestrel: extruded plan profiles form a central monocoque and two slab-armored nacelles, inset ring nozzles and raised fins.
- B / Manta: a continuous swept lifting body with lathed nacelles and an elongated phase spine. Different silhouette and curved housing strategy.
- C / Splitframe: primitive-built structural frame, hexagonal pods, central energy drum and exposed lateral struts.

Each module under `public/assets/ships/` has one default function taking THREE, returns a Group, uses only generated geometry and MeshStandardMaterial, faces +Z, and normalizes transformed vertices to a base at y=0 and a shared 3.1 x 0.95 x 3.9 meter envelope. Dimensions are authored targets, not verified measurements. Expectations are supplied beside each module. Phase materials are named `phase-energy`. Gameplay orientation/hover offset and exhaust effects will be adapted after selection; the existing racer ship has not been replaced.

The shipyard loads candidates through the official asset loader (merges rigid geometry by material). Loader and surfaces helper copied unchanged from 404-game-recipe commit `4effad311c5e137bca316257259fe5bffd6737de`, under Apache 2.0; license retained in `src/vendor/404/LICENSE`. These are recipe utilities, not copied reference-game assets/code. Source: https://github.com/404-Repo/404-game-recipe

## Next
User compares silhouettes, rear/front/side/top/below views and all three phase colors in `/shipyard.html`. Record their chosen candidate and changes here. Run official asset verification only after explicit authorization under the standing no-tests rule. Keep discarded candidates and the real selection history; do not claim these as verified final assets yet.

## Revision 2 — user rejected the initial detail and phase visibility
Preserved V1, authored three -v2 siblings with layered deck panels, vent louvers, fasteners, exposed pipes, underside fittings, nested exhaust collars and injector blades. Raised/widened phase rails above armor and enlarged deck cores. Modules remain self-contained standard-material geometry. Shipyard V2 uses saturated energy colors, emissive intensity 18 (10x original 1.8), and HDR bloom followed by tone mapping. Brightness is adjustable; V1 comparison disables bloom and restores original material intensity. This is an art iteration, not a verified final asset. No verifier or visual testing performed.

