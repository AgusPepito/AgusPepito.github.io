# Road containment field R1

Purpose: make the existing road-edge collision boundary visible wherever a solid roadside wall is absent.

- One lightweight transparent mesh per applicable 100 m campaign chunk; it covers both exposed sides. Placement reads the exact physical bay layout. Each exposed run extends 14 m into adjoining wall runs, covering the entire 12.5 m terminal ramp and fading over the last 3 m. Expanded runs merge before chunk clipping, so overlaps do not double their additive brightness. Real gap spans and closed tubes remain excluded.
- Road-local sampled planes follow bends, banking and partial tube folds. Their closure opacity fades as the road reaches a full tube. The projection is 6.4 m tall, with recognizable graphics near ship height and a soft upper fade.
- Ordinary edges use icy forward chevrons and shields. Red warning triangles and diagonal bands mark the blocked side of walls/passages and approaches to broken track. Low jump barriers get amber upward chevrons. Side selection reads actual obstacle solid spans and gap placement; colors ease into encounter zones and do not depend on random decoration. No words, letters, branding or numbers. Localized contact rings turn warm amber.
- Subtle packets travel along the base rail. Approaching an edge brightens its nearby field. Existing scrape state triggers a localized ripple without changing collision or steering behavior.
- Material hooks, custom coordinates and per-vertex warning weights survive the worker packet. Depth testing stays enabled, depth writing stays disabled, and additive fog fades to black. Fields inherit the existing chunk culling; no external textures or per-panel draws.
- Light graphics keeps the icons/rails but drops fine lattice detail. Reduced motion removes traveling packets and contact rings while keeping the containment boundary and proximity cue.

Sources: `public/assets/track/edge-field-r1.js`, `src/racer/road-edge-fields.js`, `campaign-kit.js`, `asset-transfer.js`, `view.js`.

Source review and build only. Visual clarity and glow strength remain for the user's feedback.
