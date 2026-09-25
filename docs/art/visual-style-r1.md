# Orbital rendering revision 1

Implemented 2026-09-25 from the user's four visual references. Scope: lighting/rendering, materials, VFX and background. The ship, track, obstacle, asteroid and station model geometry and gameplay rules are unchanged. New runtime geometry is limited to rendering/effect primitives (fullscreen passes, trails, particles and pulse/spill quads).

## Lighting and materials

- `view.js`: warm directional sun, cool planet fill, reduced hemisphere/ambient fill and a softer height-dependent hover shadow. Existing track fog/culling ranges are retained.
- `visual-settings.js`: shared sun/planet directions and Rich/Light quality preferences.
- `slab-kit.js`: one retained PMREM environment for all PBR materials, including ship, station and rock materials, with broad cool reflection light and a warm highlight.
- `surface-finish.js`: distinct paint, alloy, recess and canopy settings; bounded procedural variation in roughness and base color. This composes with the existing GPU gate-deformation hook. Existing slab normal/roughness maps remain in use; no new UVs, texture slots or worker packet changes are required.

## Rendering

- `render-pipeline.js`: ACES tone mapping at fixed exposure. Rich uses a half-float scene target, threshold bloom, output conversion and FXAA. Light uses direct antialiased rendering. DPR caps are 1.5 and 1.25 respectively.
- Rich falls back to Light if the required HDR color-buffer extension is unavailable. Touch devices default to Light; desktop defaults to Rich. Controls contains a persistent graphics selector; `?graphics=rich` / `?graphics=light` also select a preset.
- Scene/postprocess shaders are prepared using their actual render-target variants. Pass resources and the renderer are reused across campaign handoffs; graphics changes rebuild/dispose only the rendering targets/passes. Diagnostics count all passes and record the selected quality.

## Effects

- `ship-kit.js`: the existing exhaust cones now use an animated plume shader with a bright nozzle core, colored body and fading tail. Existing halos remain available in both quality modes.
- `race-vfx.js`: bounded world-space engine trails, surface-aligned light spill, phase/boost pulses, matched-gate crossing ripples, landing rings and pooled scrape sparks. They observe race state without changing the simulation. Phase hue follows Ion/Sol/Flux.
- Effect history resets for retries, menu/race transitions and teleports. Effect time freezes with race time. Reduced motion suppresses trails, transient flashes, spark bursts and plume oscillation. Existing reduced-motion camera behavior remains.

## Background

- `space-sky.js`: the existing backdrop surface uses the authored galaxy band, nebula clouds, dust lanes and varied stars from `public/assets/space/planet-stars-r2.png`, replacing the uniform procedural point field in both graphics presets. The artwork is world-oriented with a softened rear seam and poles; its small baked planet sits behind the separate large planet. The large round planet samples `public/assets/space/planet-backdrop-r1.png`, with a procedural atmospheric rim. The existing warm sun remains separate; no new external image was downloaded or generated.
- The planet's existing cloud/day-night detail is painted artwork, not a newly modelled or dynamically simulated globe. Its texture resolution limits close-up detail. The sky now rotates naturally through course turns and tube rolls rather than staying fixed in front of the camera.
- Sun and halo are in the background pass and are covered by foreground geometry. Existing stations retain their geometry and placement. Asteroid instance density alternates between quiet sections and denser clusters, preserving the established course clearance and prototype reuse.

## Delivery and user verification

### Frontal glare adjustment

User feedback showed a distracting frontal sun and broad white road reflections. Moved the shared sun direction high to the left/rear, lowered its intensity from 3.1 to 2.1 and planet fill from 0.9 to 0.45. Reduced solar/planet reflection-capture strength, lowered road environment intensity to 0.3, and increased road roughness while retaining finish variation. The visible solar halo is smaller/dimmer. Exposure, phase emission and model geometry are unchanged. Source review/build only; the user evaluates readability.

Source review and the production build are the agent's verification scope. No tests, simulation checks, gameplay screenshots, browser smoke checks or visual playtesting were performed. The production build reports the Three.js shared chunk above the configured 650 kB warning threshold.

### Menu blackout investigation

Removed the menu's full-screen dark overlay between demo shots; prepared shots now cut directly with the existing camera snap. Replaced the sky's signed-base `pow(x, 2)` with `x*x`, since GLSL does not define `pow` for negative bases and invalid HDR values can spread through bloom. Clamped the exhaust fade input before fractional powers as well. These address concrete source issues; confirming the reported tube glitch is resolved remains user-owned.

The user should evaluate brightness/color readability on each surface, the new world-oriented sky, particle/trail behavior, Rich versus Light performance, and portrait composition. New geometry authoring, full-course shadows, screen-space reflections and further art-detail work remain outside this revision.
