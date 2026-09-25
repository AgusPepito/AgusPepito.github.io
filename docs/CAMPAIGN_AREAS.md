# Six-area campaign

Implemented 2026-09-25: 24 levels, four in each of six sequential areas. Dockyards and Conduits retain their revised R2 layouts. Broken Span, Relay Grid, Outer Ring and Nexus complete the progression proposal. The old campaign, default encounter arrays and Overload generation remain removed.

## Courses

| ID | Level | Length | Authored challenge |
| --- | --- | --- | --- |
| dockyards-clear-route | Clear Route | 2,200 m | Six wall/passage encounters with alternating sides and narrower openings. |
| dockyards-first-shift | First Shift | 2,400 m | Eight cyan/amber gates with progressively shorter intervals. |
| dockyards-third-signal | Third Signal | 2,710 m | Eight three-phase gates and four boost lanes, including offset lanes. |
| dockyards-departure | Departure | 3,420 m | Twelve wall, phase and passage encounters with optional lane acceleration. |
| conduits-thread | Thread the Needle | 2,940 m | Seven separated openings, with 72–104° rotations and reversals. |
| conduits-spiral | Spiral Run | 3,360 m | Ten openings, each about a quarter turn farther around the tube. |
| conduits-switchback | Switchback | 3,960 m | Twelve openings with 101–115° turns and repeated reversals. |
| conduits-flow | Tunnel Flow | 4,690 m | Fifteen openings: full rotation, reverse spiral, then alternating turns. |
| broken-span-hurdles | Hurdles | 2,890 m | Seven low barriers; isolated jump timing develops into a sustained rhythm. |
| broken-span-crossing | Crossing | 3,100 m | Five cruise-speed gaps, 80–100 m long, then a broad landing passage. |
| broken-span-long-reach | Long Reach | 3,910 m | Three 200/220/240 m gaps, full-width cyan powered approaches, and landing passages. |
| broken-span-landing-line | Landing Line | 3,520 m | Alternate hurdles and road gaps with offset passages after landing. |
| relay-grid-pulse | Pulse | 3,230 m | Eleven full-width gates establish, repeat and reverse a three-phase pattern. |
| relay-grid-switch-thread | Switch and Thread | 3,490 m | Six gate/passage pairs on alternating road sides. |
| relay-grid-rotating-signal | Rotating Signal | 3,410 m | Six gate/passage pairs rotate around the inner tube. |
| relay-grid-circuit | Relay Circuit | 3,760 m | Eight tighter relay pairs with steering reversals. |
| outer-ring-orbit | Orbit | 3,370 m | Eight passages teach the exterior shell, then reverse the orbit. |
| outer-ring-helix | Helix | 3,970 m | Nine winding cyan lanes feed a consistent rotating passage sequence. |
| outer-ring-fast-line | Fast Line | 3,990 m | Eight optional amber lane routes; unlit road supports slower approaches. |
| outer-ring-run | Ring Run | 4,780 m | Four acceleration/braking phrases, eight passages and three phase changes. |
| nexus-thread-land | Thread and Land | 3,870 m | Passages, hurdles and short gaps with intact landing corridors. |
| nexus-signal-flight | Signal and Flight | 4,680 m | Cyan, amber and violet gates precede matching powered gap approaches. |
| nexus-surface-shift | Surface Shift | 5,970 m | Authored flat/inside/flat/outside/flat sections with centered exit passages. |
| nexus-grand-circuit | Grand Circuit | 6,750 m | Road hurdle, inner relays, road gap, exterior relays and a final tube checkpoint. |

Dockyards uses the existing gently bending flat profile. Conduits and the later Relay Grid levels use the straight inner tube. Broken Span and the first two Nexus courses use straight road for predictable jump distance. Outer Ring uses the exterior tube. Surface Shift and Grand Circuit use explicit `runs` (enter, closed, open, exit and curl sign) shared by live track sampling and worker configuration. Their centerlines stay straight while the cross-section folds, with hazards outside the transitions. Existing obstacle models and movement rules are reused.

Layout revision R2 increases challenge after user feedback. Conduits full opening widths now progress from approximately 15.3–13.6 m in Thread the Needle to 11.9 m in Spiral Run, 11.3 m in Switchback and 10.7 m in Tunnel Flow. Adjacent openings do not overlap in surface coordinates. Later rotations are approximately 83–122°, with 270–340 m between openings, rather than small shifts and long straight recovery sections. The existing tube steering speed is 52 m/s across a half-circumference of about 56.5 m; these are authored tuning choices, not a playtested reachability claim. Visibility, braking, steering input and boost still affect actual difficulty.

Course length is derived from the last encounter's end, plus 140 m rounded up to the next 10 m. Every current level has a 141–145 m exit after its final obstacle/gate geometry. Longer gaps between demands in the new jump courses serve powered run-ups or landing corridors. Area introductions give time to read the first hint before the first mandatory obstacle; no new hazard is placed inside a surface transition.

All Conduits courses are steering-only challenges: no phase gates, boost lanes, jumps or gaps. Manual boost remains optional. Dockyards phase sequences initially stand alone; only Departure combines familiar steering and phase actions. Brief distance-triggered prompts have keyboard and touch variants and hide when paused/buffering.

## Later-area authoring

- Broken Span introduces 2.4 m barriers on intact road before full gaps. Cruise gaps are 80–100 m; the existing 1.3 s jump covers approximately 143 m at 110 m/s on a straight. Long Reach uses 200–240 m gaps and full-width matching-phase lanes extending at least 400 m along each approach. The existing free-lane boost rule permits launch thrust with an empty battery; the player still needs to hold boost before takeoff. No phase switch is required in the air.
- Landing passages are separated from gap ends by at least 330 m, and from hurdles by at least 400 m where a passage follows. This reserves room for flight and settling even when the player accelerates. Early boost release/braking is still part of the faster route. These are source-based authoring margins, not playtested guarantees.
- Relay Grid pairs each phase gate with a later passage rather than overlapping the decisions at one station. Gate-to-passage separation progresses from 240–260 m to 210 m. Its inside passages retain meaningful rotations and reversals, without introducing jumps.
- Outer Ring relaxes precision for the first exterior course, then adds winding optional lanes. Lane ends precede openings by 150 m in Helix, 230 m in Fast Line, and roughly 290–320 m before the first passage of each Ring Run pair. Ring Run deliberately expects release or braking before its paired openings. Clear routes never require matching a lane just to stay on the road.
- Surface Shift folds inward over 650–1050 m and outward over 3250–3650 m, with open-road connectors between. Centered tube exit passages precede unfolding. Grand Circuit uses a different schedule and finishes on the outside tube instead of adding an empty return-to-road tail. It combines familiar demands over a longer run without introducing a new mechanic.

Normal-speed widths, rotations, jump windows, input timing and boost behavior remain subject to the user's playtesting. No automatic reachability or visual approval is claimed.

## Selection and progression

- Normal campaign starts at the first incomplete level in an unlocked area. Four selectable level nodes let the user replay or choose any course in that area.
- One complete card is shown at a time on desktop and mobile. Large arrows browse with native eased scrolling; touch swipes and keyboard focus remain supported. Reduced motion uses instant arrow navigation. The global cleared/total count reflects all 24 courses. Browsing another area disables Race until a level in that area is selected, so an offscreen course cannot start accidentally. All six areas have distinct project-local banner artwork.
- Each area's four clears unlock the next: Dockyards → Conduits → Broken Span → Relay Grid → Outer Ring → Nexus. Completing an area stops at its result screen; finishing the last course never generates extra rounds. Earlier skipped courses in the current area can be selected directly.
- Within an area, checkpoint flow retains motion only when the old endpoint and next start have compatible surface curvature/width. Relay Grid's flat-to-inside change starts from a fresh pose; area boundaries always reset. The current course and only one bounded next-course prefetch are retained.
- Completion is stored as known course IDs under `vector-shift-areas-001`; existing clears are retained. Best-time keys include the layout revision (`r2`) so records from the former lengths do not compete with these runs. Old records and old campaign numeric saves are not erased.
- Practice (`?practice=1`) opens every area but records neither completion nor best times. `level=<course-id>` selects a course directly; in normal play it still respects area locks.
- The selected menu course also determines the background preview and prepared geometry. Selecting another course disposes the old course and any mismatched prefetch while retaining shared sky/ship/scenery resources.
- Only the current course and one next-course prefetch are retained. Prefetch uses the existing 128 MiB background budget and is not started after the final level. The old `preload=all` option no longer activates an unbounded cache.
- Construction-review URLs retain their own definitions and surface-cycling behavior.

## Source touchpoints and feedback

`src/racer/campaign.js` owns areas, stable IDs, encounters, hints and completion. `levels.js` installs those definitions into the shared gameplay arrays and produces worker configs. `campaign-menu.js`, `main.js`, `racer.html` and `menu.css` implement area selection, lesson cues and area/final results. `loading-ui.js` provides the inline menu loader and the dimmed course-handoff panel, with real asset completion, a separate indeterminate visuals stage and reload on failure. Hints and checkpoint notices use opaque light surfaces with dark text. Existing simulation, collision and worker geometry consume the same authored data.

User feedback should establish whether jump prompts and takeoff cues arrive early enough, whether powered approaches communicate their function, whether phase/passage pairs remain readable on both input types, and whether the longer Nexus circuits sustain flow. Course IDs and save keys support further tuning without erasing completed-area access.

Agent verification is source review and a production build only. No tests, simulations, browser checks or visual gameplay reviews are permitted under the standing project instruction.
