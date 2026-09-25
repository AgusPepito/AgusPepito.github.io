# Six-area campaign — R3 flow revision

Implemented 2026-09-25: 24 courses, four in each of six areas. This revision replaces isolated lesson sequences and nearly straight routes. Each area's first course introduces its focus while reusing familiar skills. Courses two through four combine earlier mechanics immediately; they have no repeating control tutorials.

## Courses

| Area | Course | Authored challenge |
| --- | --- | --- |
| Dockyards | Clear Route | One introduction to steering, all three phases, lanes and speed control on a gently banked slalom. |
| Dockyards | First Shift | Continuous alternating passages, solid walls and phase changes on stronger reversing bends. |
| Dockyards | Third Signal | Banked road folds into an inner tube; rotate through phase passages, then exit onto the road. |
| Dockyards | Departure | Road slalom, half-turn/reverse tube sequence and a final alternating road run. |
| Conduits | Thread the Needle | Introduces sustained tube rotation; familiar phase gates return after the first two openings. |
| Conduits | Spiral Run | Continuous quarter-turn steps with changing signals and winding lanes. |
| Conduits | Switchback | Large rotations and repeated reversals interleaved with phase decisions. |
| Conduits | Tunnel Flow | Forward spiral, reverse spiral and alternating passages; signals and optional lanes run throughout. |
| Broken Span | Hurdles | One flight introduction: hurdles, a short gap and a powered long gap inside a tube, with familiar phases and landing passages. |
| Broken Span | Crossing | Gap, large rotation, passage, phase, repeat; ends with a hurdle and offset landing passage. |
| Broken Span | Long Reach | Powered tube jump and rotating landing route; unfold into a second powered road jump. |
| Broken Span | Landing Line | Tube hurdle/gap phrase, open-road gap, then another tube with a rotating hurdle finish. |
| Relay Grid | Pulse | Dense three-signal phrases and their reversal, anchored by offset tube passages and a final hurdle. |
| Relay Grid | Switch and Thread | Phase/passages, steering reversals and three hurdles with room to land. |
| Relay Grid | Rotating Signal | Spiralling phase passages interrupted by jumps, then a reverse orbit. |
| Relay Grid | Relay Circuit | Fast inner relay unfolds into a road gap, then closes around a reversing signal run. |
| Outer Ring | Orbit | Exterior-shell introduction that immediately keeps phases and jumping in play. |
| Outer Ring | Helix | Changing-phase spiral lanes feed passages and a hurdle across almost two full rotations. |
| Outer Ring | Fast Line | Accelerate into alternating exterior turns; signals and a hurdle interrupt the route. |
| Outer Ring | Ring Run | Helix, hurdles, exterior tube gap and a reverse orbit to the finish. |
| Nexus | Thread and Land | Banked road hurdle, inner relay, road gap and exterior spiral in one linked course. |
| Nexus | Signal and Flight | Three powered tube jumps separated by large landing rotations and phase choices; final hurdle phrase. |
| Nexus | Surface Shift | Road hurdles, inward fold, inner jump relay, road gap and outward jump relay. |
| Nexus | Grand Circuit | Sustained slalom, inner phase/jump relay, powered road flight and a long exterior spiral. |

## Shape and pace

- Every course has authored lateral bends, elevation changes and banking. The `sweep`, `spiral`, `switchback` and `orbit` silhouettes in `campaign-motion.js` are deliberate paths, mirrored/scaled per course. There is no random encounter placement.
- Dockyards starts banking on its first course; its third and fourth courses already fold into an inner tube. Conduits retains its rotating-passage identity but no longer discards learned phase matching. Broken Span mostly jumps within tubes or linked surfaces instead of spending four courses on straight road.
- The first required encounter generally begins at 270–440 m. Later non-flight sequences frequently alternate decisions about 120–210 m apart, with larger passage rotations spaced around 280–410 m. Manual boost is a deliberate faster option; base movement and boost tuning are unchanged.
- The finish remains derived from the last encounter's physical end plus 140 m, rounded up to ten metres. There is no long empty checkpoint tail. Jump run-ups, landing corridors and unfolding sections remain purposeful breathing room.
- Only first-in-area courses carry teaching prompts. All courses retain live jump cues, phase colors/symbols and opening guidance. Level descriptions describe the challenge rather than repeating controls.

## Surface and flight constraints

`campaign.js` carries explicit `runs` for inward/outward folds. Gameplay, workers and the renderer receive those same runs and motion increments. Motion uses smooth stationary ends; longitudinal Z stays monotonic. The ship, collision frame, markings, obstacles and camera sample the same banked surface.

Motion is held around gate hardware, from 100 m before each gap through 280 m beyond its landing edge, and from 90 m before a hurdle through 300 m after it. Nearby holds merge rather than squeezing a bend into less than 60 m. The bending/rolling travel is distributed through the remaining course sections. These holds keep launch distance stable and preserve exact repeated gate hardware without adding empty road. Phase gates can still occur during a flight, since their phase decision does not require landing.

Tube passages following flight are placed after the landing corridor. Gap-end to mandatory passage spacing is at least 330 m; hurdles followed by passages allow at least 390 m. Short gaps are 80–100 m and long powered gaps are 200–240 m. Powered approaches provide matching-phase thrust even with an empty battery, but the player must hold boost before takeoff. Full-width powered lanes do not require a midair phase change.

Each unfolding tube has a centered passage before the opening transition. Mandatory gates, jumps and passages stay outside changing cross-sections. Optional lane bursts end before the next opening. Tight sequences intentionally make release/braking useful.

Exact gate repetition includes the bank angle and rotated tube axis. Gates on changing banks use the shared CPU surface sampler; unsupported authored motion never enters the old analytic GPU deformation path. Radial tube-gap end caps use the same bank as the road. The cached geometry frame sampler and the runtime sampler apply the same transformation.

These are source-based authoring constraints, not playtested reachability or comfort guarantees. The user owns difficulty, readability and motion feedback.

## Selection and saved progress

- Six areas and four selectable courses per area remain unchanged. Clear an area's four courses to unlock the next. The carousel, artwork and cleared/24 counter remain in place.
- Existing course IDs and the `vector-shift-areas-001` completion namespace are unchanged, preserving clears and area access.
- Best-time keys now use layout revision `r3`. Earlier times remain stored but do not compete against the new routes.
- Compatible surfaces carry motion through within-area checkpoints. Area boundaries and incompatible surface changes start from a fresh pose. Authored bending and banking settle before the checkpoint.
- Practice (`?practice=1`) opens all courses and records neither clears nor times. For the mixed tube revision, use `?practice=1&level=conduits-spiral`; for early folding road, use `?practice=1&level=dockyards-third-signal`.
- The current course and one bounded next-course prefetch are retained. Construction-review profiles keep their original shapes because they provide no campaign motion.

## Source and verification

`campaign.js` owns encounters, short descriptions, hints and surface schedules. `campaign-motion.js` builds deterministic smooth movement spans around protected stations. `track.js` owns the shared sampling and bank transformation. `levels.js`, track snapshots and `campaign-worker.js` transfer identical geometry inputs; `gate-modules.js`, `deformed-gate.js` and `campaign-kit.js` retain correct gate/gap mounting.

Agent verification is source review and a production build only. No tests, simulations, browser checks or visual gameplay reviews were run. Further tuning should follow the user's play feedback, especially how combined phase/rotation decisions read on mobile and how banking feels during the longer Nexus courses.
