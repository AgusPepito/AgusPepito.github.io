# Prototype validation — 2026-09-23

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
