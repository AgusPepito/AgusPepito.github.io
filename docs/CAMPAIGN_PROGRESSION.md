# Campaign progression proposal

Historical design proposal, 2026-09-25. The R3 campaign supersedes this proposal's long sequences of isolated lessons: each area's first course introduces its focus, then the next three combine familiar skills immediately. All 24 courses now have authored bends/banking, and tube folds appear during Dockyards. See [delivery notes](CAMPAIGN_AREAS.md) for the current layouts. The text below preserves the original rationale, not current placement values or progression rules. The old campaign and Overload content were removed at the user's request. Fun combinations remain design hypotheses except for the user's positive feedback about tube passages. No tests or gameplay inspection were performed.

## Direction

Build six recognizable areas with four short authored levels each: 24 main levels, followed by optional expert remixes. Each area has a dominant challenge, a memorable setting, and a small progression from discovery to confidence. Tutorials become the opening encounters of real levels. Reuse known skills throughout, with deliberate gaps between learning something and combining it under pressure.

An area is organized around what the player enjoys doing: threading openings, sustaining a phase rhythm, making a clean landing, or choosing a fast line. Surface types support that identity. Inside and outside tubes should feel like different places with different kinds of runs, rather than obligatory ingredients in every level.

## Original source findings, before campaign replacement

- `src/racer/levels.js` has three introductory layouts, one mixed Combinations course, and Overload variants of that same course. Overload changes phase order, mirrors placements, narrows openings and extends gaps; the feeling of randomness does not come from newly generated campaign layouts.
- The second introductory level is already 6,600 m and uses the complete mixed flat/outside/inside profile. This makes mastering one surface difficult before the next is introduced.
- `src/racer/track.js` fixes the mixed profile's surface changes at absolute distances. Distinct area courses need configurable sections, not just more obstacle arrays over the same route.
- `src/racer/sequences.js` describes spacing around a 190 m/s maximum, while `src/racer/simulation.js` now targets 110 cruise, 154 on a matching strip, 250 manual boost, and 285 combined. For illustration, 160 m on a straight is about 1.45 seconds at cruise but only 0.56 seconds at 285. Actual available time also depends on visibility, acceleration and the surface frame.
- Checkpoints currently finish levels, refill boost and save progression. Seamless handoffs carry speed, phase and lateral state into the next level. There are no mid-level respawns to assume in this proposal.

## Proposed areas

| Area | Identity | Four levels, in order | Deliberately withheld |
| --- | --- | --- | --- |
| 1. Dockyards | Wide open roads; steering and phase basics | **Clear Route:** dodge broad walls and line up with a wide opening. **First Shift:** isolated cyan/amber gates with room to read. **Third Signal:** introduce violet and matching boost lanes. **Departure:** an easy race combining these familiar actions, with safe optional boost stretches. | Jumps, gaps, tube orientation and rapid switching. |
| 2. Conduits | Inner tubes; satisfying passage sequences | **Thread the Needle:** generous openings and small rotations. **Spiral Run:** successive openings rotate gradually in one direction. **Switchback:** predictable left/right reversals. **Tunnel Flow:** longer phrases that combine those patterns with breathing spaces. | Mandatory jumps, phase chains and boost-dependent survival. |
| 3. Broken Span | Jump timing; launch, flight and landing | **Hurdles:** isolated low barriers on intact road. **Crossing:** short gaps at normal speed. **Long Reach:** safely introduce boost-assisted gaps with available charge and visible landings. **Landing Line:** jump, land, settle, then line up for the next familiar obstacle. | Narrow passages or phase switches during a first-time jump lesson. |
| 4. Relay Grid | Phase rhythm plus steering | **Pulse:** readable, repeating phase patterns. **Switch and Thread:** choose phase, then enter a passage. **Rotating Signal:** a familiar tube passage pattern with separated phase changes. **Relay Circuit:** deliberate phase/steering phrases and recovery stretches. | New jump requirements or simultaneous three-way decisions. |
| 5. Outer Ring | Exterior tubes; line planning and speed control | **Orbit:** safe introduction to the outside surface. **Helix:** follow a winding lane through familiar obstacles. **Fast Line:** optional boosted lines and a dependable slower route. **Ring Run:** plan a burst, release or brake, thread the opening, accelerate out. | Unsignaled gaps or unfamiliar mechanics at high speed. |
| 6. Nexus | Mastery through selected combinations | **Thread and Land:** passages and jumps with clear separation. **Signal and Flight:** phase selection before takeoff. **Surface Shift:** familiar phrases connected across surface transitions. **Grand Circuit:** several distinct sections with recovery between them. | Surprise new rules. The finale demonstrates learned skills. |

Working names and the 24-level scope are proposals. Each four-level arc should have a distinct layout and pacing; it is not the same level replayed with narrower holes. The first level of a new area relaxes precision/density while introducing its new context. Earlier skills return without demanding peak performance immediately.

## Combinations to develop

| Combination | Expected appeal | Authoring rule |
| --- | --- | --- |
| Inner tube + rotating passages | Sustained steering creates a flowing corkscrew route; already supported by user feedback. | Rotate openings in readable increments. Keep several ahead visible where geometry permits. |
| Alternating passages + short straight recovery | A recognizable left/right rhythm followed by a satisfying release. | Establish a repeatable pattern before introducing its variation. |
| Phase switch + passage | Selecting a color and positioning the ship creates a purposeful two-step sequence. | Teach the two actions separately; initially finish the switch before steering precision peaks. |
| Jump + broad landing + reposition | The landing feels like an achievement that sets up the next move. | Reserve real settling time and a clear landing corridor before the next wall or low opening. |
| Winding boost lane + clear exit | Holding a line rewards control with speed. | Use a familiar phase first; mark the exit before the boost carries the player into the next hazard. |
| Fast approach + brake/release + passage + acceleration | The player manages the pace instead of holding maximum boost continuously. | Introduce braking in a safe section first and budget for lingering speed after boost release. |

Do not assume more simultaneous mechanics means more fun. A passage-dense tube can sustain a complete level without adding jumps or phase gates. Delay jumps beneath passage ceilings, hazards on a first surface transition, and boost lanes feeding directly into an unseen precision obstacle.

## Example: the Conduits arc

1. **Thread the Needle:** a safe introduction to the inner surface; a centered opening; repeat it; then two gently offset openings. The challenge is simply arriving aligned.
2. **Spiral Run:** establish three passages stepping around the circumference in one direction; recovery stretch; repeat with a longer arc. The player recognizes the route and commits to a smooth turn.
3. **Switchback:** repeat a familiar arc; show a clear upcoming reversal; then alternate two short arcs. Keep openings generous while changing the steering task.
4. **Tunnel Flow:** opening phrase, spiral phrase, rest, switchback phrase, rest, final familiar sequence. Increase sustained execution, without simultaneously tightening openings and forcing phase switches.

These are encounter sketches, not placement-ready coordinates. The visible opening sequence, attainable steering path and approach speed determine actual spacing. Tube bulkheads can occlude later openings, so any hidden target needs enough revealed approach time rather than reliance on memorization.

## Difficulty and progression rules

- **One new demand at a time.** Initially change one of phase complexity, opening precision, rotation distance, speed, surface context, or sequence length. Combining familiar demands belongs later.
- **Design in time and usable clearance.** Account for ship width, tube curvature, lateral travel, steering reversal and a margin for correction. Match an opening's physical clearance across surfaces; the same normalized width means different metres on a road and tube.
- **Read, act, recover.** Count available time from when the next cue and route become legible. As unverified starting targets, allow roughly 2–3 seconds before an isolated unfamiliar action at its intended approach speed, then budget steering/jump execution separately. Tune with user feedback; this is not a universal safe spacing formula.
- **Difficulty rises in waves.** A level establishes a pattern, repeats it with a small variation, gives relief, then ends with a satisfying use of the same skills. An area's finale introduces no new mechanic. A new area's opening reduces execution pressure.
- **Separate completion from speed mastery.** Early clear routes should not require manual boost. Teach boost explicitly before requiring it for a gap; ensure charge/run-up and recovery are available even after reasonable earlier use. Optional best times and later expert remixes reward faster execution without blocking the main path.
- **Keep failures affordable.** Provisional targets: 20–35 seconds for early levels, 30–60 for established challenges, 45–75 for finales at the intended first-clear pace. Existing retries restart the current level; keep levels short instead of assuming a new respawn system.
- **Teach through encounters.** Brief contextual prompts before the first use, consistent white action/red danger/phase-color signals, and no mandatory action hidden in menu text. Introduce optional boost and braking in safe stretches before testing them.
- **Predictable retries.** Authored encounter order and placements remain fixed. Save randomized or mirrored remixes for an optional later mode.
- **Safe arrivals.** Each level begins with enough road to settle inherited speed, orientation and phase. Returning to a level directly must also be viable from the current reset state. Area boundaries may need a dedicated transition instead of automatic direct handoff between incompatible surfaces.

## Player-facing organization

Show six area cards with an identity, four level nodes, completion state and the next objective. Opening an area shows a short description such as "Rotate through openings inside the conduit". Completing its four levels unlocks the next area; completed levels remain directly replayable. Clear completion unlocks progression, with best times optional. Keep Driving Only available separately.

Retain smooth checkpoint flow within an area only where surface continuity and safe entry state are authored. Use an area-complete summary between areas. Put Overload/expert remixes after the campaign, rather than using them to supply the main progression.

## Original implementation sequence

Author the four Conduits layouts first as the reference for what a strong area feels like, using the user's already-positive combination. Then design the four Dockyards levels that prepare a newcomer to enter it. Let the user's feedback on those eight levels set opening widths, sequence lengths, pacing and later campaign scale before authoring the remaining sixteen.

When implementation is requested, the main touchpoints are `levels.js` for explicit area/level definitions, `track.js` and the worker configuration path for consistent configurable surface sections, and `main.js`/`racer.html` for area selection and completion. Use stable level IDs and migrate existing progress carefully: old numeric indices and best times cannot be blindly attached to different new courses. Keep construction review routes intact. `campaign-cache.js` hardcodes four authored levels; expanding to 24 needs a bounded current/next-level or area cache, rather than preloading every new course at startup.

The user remains the sole gameplay tester. Implementation verification is limited to source review and rebuilding unless the user explicitly changes that instruction.
