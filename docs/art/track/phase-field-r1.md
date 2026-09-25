# Phase field VFX R1

The recessed F1/F2 station projects an 11 m energy wall, tapering continuously to 9 m as the road curls into an interior tube. The upper 40% fades smoothly to transparent, including streams, side edges and crossing ripples; the bright top cap has been removed following user feedback. Hardware, phase colours and collision rules are unchanged.

- A faint additive body preserves the view ahead. Brightness is concentrated in the side edges and five rising streams per emitter module, all fading out toward the top.
- Cyan flows continuously; amber has a slower, broad pulse; violet adds gentle interference. No random colour changes or rapid flashes.
- A matching pass opens a local patch and launches a 0.75-second ripple on the field. The surface UVs keep it attached through road and tube deformation; full tube rings wrap the ripple across their seam.
- The field uses race time, so animation pauses with the race. Restart, teleport, driving mode and demo changes clear transient feedback. Reduced-motion mode freezes flow and disables crossing ripples.
- Light graphics omit the secondary interference layer. The effect retains the existing single curtain mesh, uses no textures or point lights, and caches runtime materials per gate.
- `userData.phaseField` stores only dimensions/curvature. `asset-transfer.js` reinstalls shader hooks after worker material decoding; runtime uniforms live in a WeakMap.

## Tuning

- Height: `phaseFieldHeight` in `public/assets/track/phase-field-r1.js`.
- Field density, beam/core emission, edge brightness and flow speed: shader constants in the same file. Additive fog fades to black to avoid a coloured rectangle in the distance.
- Crossing detection and approach response: `src/racer/phase-wall-vfx.js`. The earlier freestanding crossing ring was removed to avoid stacking both effects.
- Model-library animation uses the same material shader. Crossing responses require the game.

## User preview

- Game: `http://127.0.0.1:5173/racer.html`
- Gate-only course: `http://127.0.0.1:5173/racer.html?review=12&element=gates&shape=flat`
- Asset library: `http://127.0.0.1:5173/library.html?category=12&asset=flat-gate`

Source review and production build are agent-owned. No automated tests, browser smoke checks or visual playtesting were performed; the user owns appearance and gameplay verification.
