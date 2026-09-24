# Detailed raised library — R3

The user approved the single pipe candidate's detail and 30° angle, then authorized completing all four existing raised families. That approval establishes the art direction; the newly completed variants await user review. R1, R2 and the original R3 candidate remain available. Category 05 and tube/obstacle assets are not included in this pass.

## Delivered: 28 standalone modules

- Frame (5): middle, full-height start/end, ramp-start/ramp-end.
- Pipe (8): straight, coupling, valve, offset, full-height start/end, ramp-start/ramp-end.
- Grille (7): lattice, louver, reinforced, full-height start/end, ramp-start/ramp-end.
- Cover (8): plain, segmented, hatch, vented, full-height start/end, ramp-start/ramp-end.

All have matching 30°-from-vertical front profiles, trapezoid end cheeks, inset supports, service tabs, roof panel seams, vents and fasteners. Pipe variants use broad collars/retaining bands, exposed front fasteners, valve blocks and doglegs. Grille cartridges include edge rails, captive fasteners, release latches and shallow cooling cassettes visible through the bars. Covers use gaskets, panel fasteners and service slots; hatch variants add hinges/locks/recessed handles; vents have inset wells and framed slats. Plain panels deliberately retain quiet broad surfaces.

Full-height start/end pieces use common interface seals and locking tabs. Ramp caps are separate and used only at exposed run boundaries. Their height deformation also shifts the front profile so the 30° cross-section is retained. No detailed undersides or concealed equipment added.

## Geometry and integration

Recipe route B, agent-authored from the approved source and user's reference crops. Each public/assets/track/raised-*-r3.js returns a THREE.Group without imports, textures, network calls or external geometry. No hosted 404 generation or official verification claimed.

Source pitch 12 m, as approved in the candidate. Mounted pitch 12.5 m fills the existing 100 m chunks with eight modules, retaining the 30° angle. Road skin, collision boundary and controls unchanged. Local bases align to road height; faces point inward on both sides. Geometry is normalized to non-indexed form before merging extruded cheeks and primitive parts by material. Existing distance-based chunk visibility remains.

## Review URLs

- Library: http://127.0.0.1:4173/library.html?category=02&revision=r3
- Frames: http://127.0.0.1:4173/racer.html?review=01&revision=r3
- Pipes: http://127.0.0.1:4173/racer.html?review=02&revision=r3
- Grilles: http://127.0.0.1:4173/racer.html?review=03&revision=r3
- Covers: http://127.0.0.1:4173/racer.html?review=04&revision=r3

Library defaults to R3, includes all individual assets/parts and road assemblies, and retains R1/R2 selection. Original approved R3 candidate remains a comparison item. Authored sample blocks show family changes at full height and rare ramp caps around the bare-edge interval. This is not the later procedural layout system.

## Delivery status

- Production build passed; existing shared Three.js chunk warning remains.
- No tests or agent visual/gameplay inspection, per standing user instructions.
- Local working tree only, not published.
- User review: detail consistency, family joins, ramp profiles, grille shimmer and mobile performance.
- New variant approval: pending. Official asset verification and jam gate: pending.

## Ramp shoulder geometry fix

User reported a straight bar cutting through all ramp families. Source review found long primitive faces spanning the change from full height to the sloped ramp. Transforming only their endpoints made a chord through the intended profile. The first correction added triangle splitting to R2 and R3, but the R3 split used the wrong shoulder positions, so it did not resolve the reported mismatch. Its successful production build did not establish visual correctness.

### R3 shoulder correction — 2026-09-24

The 12 m R3 module has an 8 m taper: ramp-start runs from x=-6 to x=+2; ramp-end runs from x=+6 to x=-2. The previous split positions (-2 for start, +2 for end) were reversed. All eight R3 ramp caps across categories 01–04 now derive the split and height deformation from the same tip, direction and ramp length. Long beams, panel edges and roof courses therefore gain vertices at the actual change in slope. The existing 30° face adjustment is retained. R2 already uses the correct shoulder positions for its 24 m length; full-height connectors and the approved original candidate are unchanged.

Production build passed after this correction (existing shared Three.js chunk-size warning). User review remains pending. No tests or agent visual/gameplay review performed under the standing user instruction.
