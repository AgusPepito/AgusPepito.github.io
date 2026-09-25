# Campaign track library integration

2026-09-25. Implementation delivered for user testing; no gameplay testing or visual inspection performed by the agent.

Playable entry: [campaign racer](http://127.0.0.1:4174/racer.html). Use the existing level selector for First Shift, Around the Tube, Take Flight, Combinations and unlocked Overload rounds. Category review URLs remain available.

## Scope

Updated the existing campaign's art, retaining authored track profiles, level progression, gate positions and phases, lane widths, obstacle collision dimensions and gap lengths. This is not the proposed standalone combined course, JSON editor or procedural course generator.

- Brushed slabs and approved phase lane modules follow the campaign's bends and flat/outside/inside transitions through the same `track.js` surface sampler used by driving and collision.
- Sparse mixed R3 shoulder runs use the existing mounting helper, full-height family joins and ramps at exposed run ends. Twelve-metre tube service belts avoid encounters and active lanes.
- Recessed phase emitters replace gates, including offset and partial spans. Materials remain independent per station. Shared cut masks remove their footprints from slabs and lanes.
- W4 walls, P3 passages and J3 barriers replace obstacle blocks. Nine-metre campaign passages extend the upper part of P3 and its wall infill while preserving the 3.5 m opening. Collision data is unchanged.
- Actual campaign gaps drive twelve-metre takeoff/landing aprons, partial-gap borders and radial tube bulkheads/collars. Partial collars accept the actual opening width and center. All cuttable surface layers share gap masks.
- The white checkered checkpoint replaces the finish arch at each level's actual finish station. Crossing retains the existing campaign completion, boost refill and next-level behavior; no new mid-level respawn/save semantics were added.
- In driving-only mode, station decks and gap hardware remain visible, lethal phase curtains/obstacles remain disabled, and the existing noncolliding gap-fill surface remains available.

## Implementation and lifetime

`src/racer/campaign-kit.js` adapts existing gameplay arrays into library placements. `course-surface.js` subdivides broad faces and maps source metres into the shared surface frame, retaining UVs and curtain vertex colors. Rigid fasteners use tangent frames. Native radial tube ends only follow centerline translation and lateral rotation; they are not wrapped twice.

`RaceView` creates the first visible region at load, then prepares one deferred road chunk or encounter per render frame within 1,100 m ahead. This bounds initial construction scope but does not establish a frame-time guarantee. Loaded geometry remains available for same-level retries. Shared slab maps are marked as library-owned and excluded from view disposal; reflection environments remain owned by their renderer.

Build: `npm run build` passed. Vite reports its existing large Three.js bundle warning. No tests, browser checks, profiling, screenshots or official jam verification were run. User feedback is needed on gameplay presentation and loading/frame hitches, especially on the longer tube levels.

Phase 14 landmarks, the editable combined construction course, general generation and submission verification remain separate work.
