# Mechanics experiments

## Current experiment: 002 — player-held overdrive

The user activates racing by holding Space, either Shift key, or the OVERDRIVE button. Releasing returns smoothly to combat. The track still changes width and bends, but neither the camera mode nor speed mode depends on the zone.

- Combat speed: 26 m/s (94 km/h). Overdrive target: 82 m/s (295 km/h).
- Lower chase view, 55-to-73-degree field-of-view transition, brighter frequent ground marks, roadside posts, and peripheral speed streaks. Reduced-motion preference suppresses streaks and camera banking.
- Additional staggered barriers in both wide and narrow sections; more frequent enemy waves.
- Physical collision damage scales up to 1.8 times at maximum speed. Bullet damage is unchanged. Releasing overdrive before a bend is a deliberate risk-management choice.
- Keyboard and two-finger touch input remain independently held/released; pause, focus loss, and restart clear all held controls.
- Camera-only and speed-only tuning remain available, both activated by the same hold action.
- The user alone judges the visual result and gameplay feel. Agents run nonvisual correctness checks.

## Archived baseline: 001

The original zone-driven prototype below is preserved at tag `prototype-01-zone-transitions`.

## Hypothesis

A ship moving on a single ground plane can feel like a scrolling shooter on a wide road and a fast racer on a narrow road. Width, camera distance, and forward speed change continuously; the steering rules do not switch.

## The current experiment

- A 2,100-meter looping course with open combat, a funnel, an S-shaped channel, another open area, and a final chicane.
- Automatic forward travel: 26 m/s in open areas, rising toward 43 m/s as the road narrows. Steering reaches 19 m/s laterally with short acceleration/deceleration smoothing.
- WASD/arrows or an analog drag control move sideways and fore/aft. Fore/aft travel is bounded relative to the scrolling course.
- Auto-fire, three-enemy formations in open areas, sparse moving enemies in tight areas, and clearly contrasting static barriers.
- Shoot enemies for 100 points (180 for racers), overtake for 40, complete a lap for 1,000 and a small shield refill.
- Wall scrapes cost 8 shield; bullets 12; enemy contact 18; barriers 22. Brief invulnerability prevents stacked damage, and physical collisions briefly reduce speed. The player can recover from a mistake.
- The Tune panel independently toggles camera transition, speed transition, practice mode, and simple synthesized impact sounds. Tuning pauses a running game.

## First playtest questions

1. Does the narrowing road make you naturally prioritize a safe line?
2. Is the low view readable through bends and obstacles?
3. Does steering feel precise in combat and controllable at racing speed?
4. Does camera-only feel fast enough, or does acceleration improve it?
5. Does shooting still contribute during the racing sections?

## Deliberately unfinished

This build has no final art, bosses, progression, weapon upgrades, music, or submission deployment. Enemy balance and track pacing are starting values, not a finished difficulty curve. All visible geometry is a temporary mechanics placeholder.

## Implementation boundaries

- `src/track.js`: continuous width/center samples and obstacle data, shared by collision and presentation.
- `src/simulation.js`: fixed-step movement, enemies, projectiles, scoring, and collision; independent of Three.js.
- `src/camera.js`: view targets, independently testable across phone and desktop aspect ratios.
- `src/view.js` and `src/placeholders/`: replaceable visuals. The final 404 assets must preserve the simulation dimensions or change them deliberately.
- `src/main.js`: actual keyboard/pointer controls, lifecycle, HUD, sound, and the official gate's telemetry interface.

The official jam gate verifies loading and input, not the feel of the whole course. Real playtesting is still required.
