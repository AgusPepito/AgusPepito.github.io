# Category 11 — flat-gap art study, illuminated ends R2

Update, 2026-09-25: the user approved these illuminated ends and requested the remaining assets. See the [complete R3 gap set](11-complete-gap-set-r3.md) for current review courses and partial/tube adaptations. The original single-gap study below records the art-direction history.

The user requested category 11 on its own, with more art-direction iterations before expanding the family. The agreed first pass is one full-width flat gap with takeoff and landing lips. Partial-width and tube versions are deliberately deferred until this edge design is reviewed.

## Visible construction

The sample uses the approved brushed slabs on a straight 36 m-wide road. One shared gap record cuts the road and its edge trim and places both terminations. A 12 m-long lip replaces the ordinary slabs on each side of the cut. The user found the original 2.5 m treatment too short to notice at speed, like the early tube service rings. The revision extends the panel layout and repeats the markings in three rows while preserving the front cross-section, pipe fittings and 75 m jump distance. The missing road interval is genuinely open; the earlier generic yellow gap ribbons and drive-mode fill are omitted from this dedicated review.

The candidate cut edge has approximately 0.9 m of exposed depth below the driving surface. Segmented ivory top caps lead into upper and lower metal flanges, dark recessed web faces, replacement plates, bolted ivory flange seats and short side fascia returns. Only this visible termination has depth; no full road underside or buried chassis is added. A recessed joint floor closes the seams between top plates.

The outer web cartridges include sealed pipe-end couplings with retaining rings and cap fasteners. Only their visible ends are modelled. Shoulder trims terminate with sealed beam caps. Takeoff uses restrained diagonal ivory marks; landing uses simpler receiving brackets. No colored phase lane or extra warning light is introduced in this first study.

Landing mirrors the same authored lip construction with corrected triangle winding. The existing jump and collision behavior is retained.

## Review

- [Drive the first gap](http://127.0.0.1:4174/racer.html?review=11)
- [Full-width takeoff lip](http://127.0.0.1:4174/library.html?category=11&revision=r1&asset=takeoff)
- [Full-width landing lip](http://127.0.0.1:4174/library.html?category=11&revision=r1&asset=landing)
- [Six-metre cut-section detail](http://127.0.0.1:4174/library.html?category=11&revision=r1&asset=cut-section)
- [Both ends in context](http://127.0.0.1:4174/library.html?category=11&revision=r1&asset=assembly)

The straight sample is 1,000 m long. The 75 m gap begins at 450 m and ends at 525 m, leaving a long landing run. Space jumps, the existing jump cue indicates approach timing, and R retries. There are no additional obstacles or phase challenges.

The user should direct the silhouette and exposed thickness, amount of machinery, takeoff marking treatment and landing readability. This is a first study, not completion or approval of the full category-11 set.

Next art-direction study: the user found the widened ends too plain and requested slight takeoff/landing angles plus richer detail. A [generated concept and prompt record](11-gap-angle-concept-v1.md) explores this direction. It has not yet been applied to the playable model.

Art-direction correction: the user wants light/energy detail on the TOP surface, rather than a focus on side machinery and edges. The user selected the embedded arrows and bright end strip from the [top-surface energy concept V2](11-gap-top-energy-concept-v2.md) and authorized rebuilding both models.

## R2 top-surface rebuild

Both 12 m aprons now use the approved brushed metal grain with actual cutouts for optical fixtures. The top armor has holes matching each light well; chamfered ivory bezels slope into a recessed diffuser bed with individually segmented pearl-white emissive covers. The small repeated painted marks have been replaced.

- Takeoff: three broad embedded light chevrons pointing toward the gap, plus two pairs of longitudinal light channels.
- Landing: three pairs of receiving brackets, transverse light bars, small illuminated service tiles, outer channels and a bright full-width gap-facing strip.
- Supporting detail: metal maintenance covers, flush fasteners and panel joints that stop before the optical wells. Front cross-section and visible sealed connections remain from the earlier study.

The illuminated surfaces remain embedded below the nominal driving plane. The proposed angled geometry is not part of this top-surface iteration; the 75 m gap and existing jump behavior remain unchanged. Neutral emission and the approved reflection environment provide the finish; no additional dynamic reflection pass is used.

The yellow 3D passage ribbon/filled takeoff guide is hidden in category 11 so it cannot cover the new art. The text jump cue, normal physics and review-only slow-motion toggle remain active. Other samples and the campaign retain their existing guidance.

Both complete models and top-surface-only views are available in the category 11 library. Rebuilt geometry awaits user review; this is not approval or completion of the partial/tube gap family.

Review-only slow motion: click the speed button or press T to toggle normal / quarter speed. This control is available in construction samples only and stays selected across retries. It scales elapsed simulation and rendering time while retaining the fixed physics step, so jump trajectory, gap dimensions and speed-dependent behavior remain consistent. Race time and the speed readout remain simulation values. Normal campaign play has no slow-motion control or time scaling.

Source reviewed and production build passed; the existing shared Three.js chunk-size warning remains. No tests, simulation checks, browser smoke checks or gameplay visual review performed, per the standing user instruction. No new commit or publishing requested.

Sources: `public/assets/track/gap-edge-r1.js`, `src/racer/gap-kit.js`, with review integration in levels, track, view and library.
