# Shared brushed metal slab — approved initial style

On 2026-09-24 the user liked the detailed service rings and asked for richer ordinary slabs across flat, outside-tube and inside-tube tracks. They approved making one initial shared candidate before distributing the style throughout the project.

## Construction and finish

The shared unwrapped generator creates broad graphite plates, narrow replacement strips and occasional transverse repair plates in a deterministic staggered arrangement. Faces sit 6–30 mm below nominal road height, with 65 mm bevel widths descending to 85 mm-deep edges. Dark joints close at 90 mm depth. Sparse fastener seats and driver slots stay flush below the road plane. There is no buried box geometry or raised driving obstacle.

Four related metallic finishes vary polish and color. Small procedural roughness and normal textures provide directional brushed grain at a consistent physical scale. Mipmaps and anisotropic filtering limit distant texture noise. A static, blurred reflection environment supplies broad neutral highlights to candidate slab materials. This is an economical material-lighting prototype; it does not reflect the moving ship or reproduce local colored-lane reflections. The existing game lighting and non-candidate materials remain as before.

The same plate construction is deformed onto flat road bends or either 18 m radius tube. Tube sampling preserves the curved profile, and meshes are batched by material for driving. The continuous collision surface is retained. A real 6.48 m violet phase lane traverses the layouts and retains matching-phase turbo behavior.

## User review samples

Each driving sample is 600 m long, with a violet lane from 75–525 m. All ordinary road faces use the candidate. These are dedicated slab reviews, with the existing service-ring previews retained separately.

- [Flat driving sample](http://127.0.0.1:4174/racer.html?review=01&detail=slabs)
- [Outside driving sample](http://127.0.0.1:4174/racer.html?review=07&detail=slabs)
- [Inside driving sample](http://127.0.0.1:4174/racer.html?review=08&detail=slabs)
- [Plate close-up](http://127.0.0.1:4174/library.html?category=01&revision=r1&asset=slab-closeup)
- [Flat assembly](http://127.0.0.1:4174/library.html?category=01&revision=r1&asset=slab-candidate)
- [Outside assembly](http://127.0.0.1:4174/library.html?category=07&revision=r1&asset=slab-candidate)
- [Inside assembly](http://127.0.0.1:4174/library.html?category=08&revision=r1&asset=slab-candidate)

The user approved this initial slab style on 2026-09-24: “100 time better! i approve of this. commit all the current stages.” Approval covers the shared plate construction and finish; rollout into the other existing track assemblies remains a separate implementation step. The current authored plate arrangements are sufficient for that rollout; further variants should respond to visible repetition in user feedback.

All current modelling stages are included in the requested local checkpoint. No tests or gameplay visual review performed, in accordance with the user's standing instructions.

Sources: `public/assets/track/slab-surface-r1.js` and `src/racer/slab-kit.js`.

Source reviewed and production build passed. The existing shared Three.js chunk-size warning remains.
