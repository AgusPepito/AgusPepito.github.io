# Endless Phase Racer — proposed next implementation

Status: design proposal, not implemented. Revision 004 remains a finite 6.6 km course with four required phase chains. First tune those chains from user feedback, then use their rules as generation templates.

## Generate short racing sequences

Use seeded selection from small authored patterns, with phase permutations, mirrored/rotated passages, and controlled spacing. Initial vocabulary: isolated gate, broad dodge, phase/phase/dodge, phase/phase/opening, opening/phase/opening, and three-phase/final-dodge. Preserve the action order and reachable escape routes. Require different adjacent phases when switching is the challenge. Do not spawn independent random objects without considering their neighbors.

Each pattern declares its allowed surfaces, action offsets in seconds at maximum speed, safe entry/exit intervals, passage widths, lateral travel budget, phase sequence, and difficulty cost. Phase strips offer optional speed lines; the baseline route must work with an empty boost meter. No reward line should require a phase that conflicts with an overlapping mandatory gate.

## Proposed difficulty curve

Use distance-based tiers (consistent across boost use) and tune the exact thresholds after player feedback. Illustrative tiers at the present speeds:

| Distance | Pattern vocabulary | Timing and steering |
| --- | --- | --- |
| 0–2 km | Isolated gates, wide dodges | Generous warning and recovery |
| 2–5 km | Two phases then dodge | Broad openings; modest lateral changes |
| 5–9 km | Two phases then opening, alternating dodges | More tube rotation; tighter gaps |
| 9–14 km | Three phases, linked opening patterns | Shorter intervals within fixed fairness floors |
| 14 km onward | Full pattern vocabulary and variations | Cap speed/timing difficulty; vary combinations |

Increase one major pressure at a time: phase-switch cadence, passage precision, or lateral travel. Insert a quiet/boost recovery stretch after one or two demanding patterns. Avoid unlimited acceleration, which eventually defeats any reaction-time guarantee. Maximum boost speed remains the spacing budget even if the player currently travels slowly.

## Fairness rules in the generator

- Calculate spacing in reaction time, then convert to course distance using the maximum attainable forward speed. Initial minimum phase-switch interval: 0.85–1.0 seconds, subject to user tuning.
- Reserve steering time from the previous safe exit to the next valid passage, including acceleration, possible reversal, and settling. Account for the whole ship, not just its center.
- For the first challenge after a free section, allow travel from any reachable lateral position. For linked challenges, propagate the reachable safe intervals through the complete sequence.
- Use wrapped coordinates on closed tubes and bounded coordinates on flat roads; never suggest a shortcut across an open edge.
- Add tube-wide advance direction cues: the far-side opening cannot be the only visible warning. Preview a sequence before its first action and never change already-revealed geometry.
- Keep shape transitions quiet initially. Reserve a complete surface segment before placing a pattern; do not let a closed-tube pattern overlap an opening transition.
- If a candidate cannot satisfy the interval/timing budget, extend the approach or choose a simpler pattern. These are runtime generation constraints, not permission to run tests against the user's standing instruction.

## Streaming implementation

Replace the fixed global course arrays with a shared course object containing generated surface segments and pattern instances. The simulation, camera, collision, mesh builder, and HUD query the same object. Generalize the current flat/outside/inside profiles into reusable surface pieces with continuous endpoint position, tangent, curvature, and width. Alternate quiet connectors with playable segments long enough for their selected patterns.

Generate and render a rolling window roughly 1.5–2 km ahead, larger than the warning horizon. Generate a deterministic pattern list first, then construct meshes in small batches so new pieces do not hitch during a race. Retire passed segments, dispose their unique geometries, and retain shared materials/textures. Rebase world coordinates periodically during long runs. Generation must depend on the seed and segment index rather than frame timing or camera visibility.

Offer Endless alongside the finite course and empty driving mode. Track distance survived and best distance. Retry uses the same seed so players can learn; New Run selects a fresh seed. Display the seed on the results screen so a problematic layout can be reproduced. Store endless records separately from finite-course times.

## Delivery order

1. User evaluates revision-004 phase chains and gives timing/readability feedback.
2. Stream repeated surface pieces with seeded easy patterns and bounded object lifetime.
3. Add reachable-interval constraints and the difficulty tiers.
4. Extend the pattern vocabulary from user feedback; avoid adding unrelated combat clutter.

No new automated tests, simulations, browser smoke checks or visual playtesting are authorized by this proposal. Source review and production rebuilds remain the agent's delivery checks; gameplay testing belongs to the user.
