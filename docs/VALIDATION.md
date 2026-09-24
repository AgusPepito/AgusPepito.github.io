# Prototype validation

## Experiment 010 — 2026-09-24

67 nonvisual tests pass. New numerical camera checks cover full-body initial staging on desktop/portrait/landscape phone, actual projected shooting positions, visibility grace and reentry. Integration tests cover recurring red scouts in all encounters, three double-health Dart waves, heavy miners and wide/narrow rotating walls, four rear turrets, sustained side dashes, and safe Interceptor staging at boost speed with forward repositioning. Existing role, warning, reward, orbit, collision, control and highway tests pass.

Production build passes (about 0.59 MB). The extended encounter browser smoke passes all four runtime/menu/retry/result flows, red-scout presence and mobile touch input with no runtime errors. No screenshots or visual gameplay testing performed. The projection checks establish the programmed visibility bounds; visual readability and balance remain for the user's test.

## Experiment 009 — 2026-09-24

60 nonvisual tests pass. Updated encounter coverage checks mixed Dart role counts/bursts/fans and capped, locked prediction; three serialized Interceptor chains, speed-independent warnings and delayed engine vulnerability; orbit drift, gaps, narrowing-road bounds, persistence and moving swept collisions; targetable turret bursts, warned retaliation, lane changes and cargo hit ordering; salvage feedback, distinct outcomes, one-time completion rewards, reset and bounded simulations. Superseded lab-008 pattern assertions were replaced with the new approved behaviors. Existing highway/control tests remain passing.

Production build passes (about 0.58 MB). Nonvisual browser smoke passes every encounter's runtime, start/retry/result/menu paths and mobile touch selection, with no browser errors. No screenshots or visual gameplay checks. These results establish behavior and integration, not a claim that the new difficulty or readability is approved.

## Experiment 008 — 2026-09-24

58 nonvisual tests pass. Difficulty checks exercise idle autofire and straight boost through all four encounters: every case encounters damage, straight boost never awards a clear, and Darts require all three waves. A separate timed-dodge simulation passes both Interceptors unharmed and earns both clean-pass rewards. Other new checks cover two-link mine chain limits, convoy brake/swap warnings, and clear/partial/escaped outcomes. Existing timing, arming, swept collisions, controls, reset and highway unit checks remain passing.

Production build passes (about 0.57 MB). The encounter browser smoke passes all four start/runtime/retry/result/menu paths, escape classification, and mobile touch selection with no runtime errors. It captures no screenshots and performs no visual gameplay review. Human difficulty and readability remain for the user's playtest; the new tests establish mechanical pressure rather than a claim that the balance is final.

## Experiment 007 — 2026-09-24

52 nonvisual tests pass. New checks cover encounter isolation/reset, Dart formation warning and sequential straight fire, interceptor warning duration at boost speed and rear-engine damage, mine arming/proximity/chain persistence, independent convoy locks and forward collectible rewards, escort burst ordering, actual autofire hitting locks, and bounded simulations across cruise/fast/boost. Production build passes (about 0.57 MB).

`scripts/encounter-smoke.mjs` passes encounter selection, runtime/render paths, retry, completion/passing, return-to-selection, and mobile touch selection/start/return, with no browser errors. Its initial mine check assumed every encounter lasted five seconds; autofire cleared the mine test sooner, so the check now also accepts completion. `scripts/input-smoke.mjs` passes the existing PC/mobile drive controls and original highway regression checks. Neither script captures screenshots or performs visual gameplay review. Difficulty, warning readability and presentation await the user's playtest; final jam verification remains outstanding.

## Experiment 006 — 2026-09-24

41 nonvisual tests pass, including analog deadzone/hysteresis, circular diagonal steering, independent bindings, normal-speed repositioning, unlimited fast mode, brake priority, boost depletion/rearm, delayed recharge, pause freezing, reset, and expiration to the underlying mode. Production build passes (about 0.54 MB).

The updated nonvisual browser smoke passes actual WASD, Shift, Ctrl and Space input; pause/reset of holds; moderate mobile stick repositioning; diagonal fast mode; two-finger boost; brake cancellation; independent finger releases; pointer cancellation; traffic paths and effect controls. No runtime errors or visual gameplay inspection. Gameplay feel and boost balance remain for the user's playtest; final jam/deployment verification remains outstanding.

## Experiment 005 — 2026-09-24

34 nonvisual unit tests pass. Coverage includes neutral vehicle forward travel and narrowing-road bounds, shot damage/destruction, no hostile fire or enemy score from neutral traffic, pause/reset, lethal moving contact, delayed left-to-right purple volleys, destroyed-slot gaps, entry/overtake suppression, and projectiles emitted by the running simulation. Existing following/collision recovery tests isolate purple fire to check vehicle-contact behavior independently.

Production build passes (about 0.54 MB). The nonvisual keyboard/touch/runtime smoke passes against the rebuilt local preview, including neutral traffic presence and armored rendering paths, with no runtime errors. No screenshots or visual gameplay reviews were performed. Final jam/deployment verification remains outstanding.

## Shield-row fairness revision — 2026-09-24

29 nonvisual unit tests pass. New scenarios verify safe braking/following after releasing overdrive 25 metres behind a deployed row, a gap opened within two seconds without shield loss, and a recoverable initial collision. No browser visual testing was performed.

## Experiment 004 — 2026-09-24

26 nonvisual unit tests pass. Added coverage for instant-death barriers at combat/racing speed and during damage immunity, ramp entry and lap repetition, continuous shield-row deployment, full-width coverage and usable destroyed gaps at every road width, sustained-fire kills, immunity-resistant row blocking, merge-apron bounds, and configurable speed effects. Production build passes (about 0.54 MB).

`scripts/input-smoke.mjs` passes keyboard/touch hold-and-release, pause/resume, two-finger independent release, ramp and armored rendering code paths, effect-slider updates, and runtime-error checks against the rebuilt preview. No screenshots or visual gameplay reviews were performed. Difficulty, visual feel, and effect intensity await the user's playtest. Final jam/deployment verification remains outstanding.

## Experiment 003 — 2026-09-24

19 nonvisual unit tests pass, including road-coordinate transforms, lane direction, neutral line-following through bends, shot trajectories, rotated/moving collision targets, and camera projection bounds. Production build passes (about 0.53 MB). `scripts/input-smoke.mjs` passes keyboard hold/release, Shift, pause/resume, simultaneous two-finger steering/overdrive, independent release, and runtime-error checks. No gameplay screenshots or visual reviews were performed. Final jam/deployment verification remains outstanding.

## Experiment 002

13 unit tests and the production build pass. `scripts/input-smoke.mjs` verifies keyboard/touch hold-and-release behavior, pause/resume, two-finger steering plus racing, independent finger release, and absence of runtime errors. It uses the sibling recipe's Puppeteer dependency and the same `PUPPETEER_CACHE_DIR` as the recipe checks. No screenshots or visual gameplay review were performed. The prior jam result below is historical and has not been claimed for experiment 002.

## Experiment 001 (archived baseline)

Game code tested: `cdb4c061efec1711dc8ed2255f7344163f298fb0`.
Recipe tooling: `4effad311c5e137bca316257259fe5bffd6737de`.

- `npm test`: nine tests pass, including movement/collision/score behavior and camera framing across the entire course at phone, square, laptop, and landscape-phone aspect ratios.
- `npm run build`: successful; self-contained production output, approximately 0.52 MB before transfer compression.
- Official recipe `npm run selftest`: all asset-verifier and loader checks pass.
- Browser inspection: start, combat, funnel, narrow racing, pause, practice setting, and responsive phone view checked. No browser warnings/errors observed in the interactive preview.
- The following official gate used **a local production preview with an emulated phone**, not a public deployment or physical phone. It establishes loading/input/render-budget behavior, not final asset compliance or submission eligibility. Final assets and the deployed entry still need their own checks.
- Local screenshots and full JSON are retained in `artifacts/jam-local-final/` (excluded from source control).

Unedited verdict block from `node harness/jam.mjs http://127.0.0.1:4173/ --out=../game/artifacts/jam-local-final --commit=cdb4c061efec1711dc8ed2255f7344163f298fb0`:

```text
=== 404 JAM VERDICT ===
url             http://127.0.0.1:4173/
utc             2026-09-23T18:47:34.492Z
commit          cdb4c061efec1711dc8ed2255f7344163f298fb0
viewport        390x844 @3x phone, real touch, Android Chrome UA
network         4G: 4 Mbps down, 1 Mbps up, 60 ms latency, CPU 2x slower
ready           0.8 s   budget 20 s   PASS
weight          0.5 MB   budget 10 MB   PASS
started         yes (tap on #startb)
moved           165.6 m   needs 1 m   PASS
peak draws      15   budget 900   PASS
peak tris       9,772   budget 1,500,000   PASS
median fps      235.53896431516236 (ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11))
errors          0   PASS
404s            0   PASS
external deps   none
outside folder  none, every file came from the game folder
RESULT: PASS
=== END ===
```
