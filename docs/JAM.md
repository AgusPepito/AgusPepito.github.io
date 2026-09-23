# 404 Game Jam 001 — development guardrails

Checked 2026-09-23 against the official rules:
https://github.com/404-Repo/404-game-jam

## Required for the eventual submission

- Three.js game; every 3D object is code produced through the 404 recipe. No downloaded meshes, hand modeling, asset-store models, literal vertex-array assets, or encoded mesh blobs.
- Preserve real development commits. The public entry repository's first commit must be on or after 2026-09-11 00:00 UTC. Do not squash development into a single end-of-project upload.
- Do not copy the code or assets of the 404 reference games.
- Declare all agents/tools and external images, audio, textures, and other files.
- A public play URL must pass `harness/jam.mjs <url> --commit=<sha>` with real touch input on a phone under the gate's 4G profile: ready in time, under 10 MB, under 900 draw calls and 1.5 million triangles, no missing files or console errors.
- Open the submission PR before 2026-09-25 23:59 UTC. Include the unedited gate verdict and the required entry fields.

## Current status

Mechanics prototype only. Temporary cube visuals are not claimed to be recipe-generated final assets. The rules do not explicitly discuss development placeholders; none should remain as unverified final art. Track, walls, ships, obstacles, bullets, effects, and scenery all need an explicit final asset/procedural-geometry compliance review.

Final art will follow the asset contract: one module per object, a default function receiving THREE and returning a Group, real-world meter scale, local base at y=0, no hidden external asset loading. Generate candidates, run the verifier, choose visually, and retain the receipts. Use the official asset loader during that stage.

## Outstanding

- Select final visual style and create a style lock.
- Replace and verify prototype visuals through the recipe; retain references, candidate renders, and selection notes.
- Test on actual phone hardware, including touch steering and performance.
- Publish the game source and deploy the self-contained build (not yet done).
- Run the official jam gate on that live URL and commit.
- Complete team/eligibility declarations and submission.

## Sources

- https://github.com/404-Repo/404-game-recipe/blob/main/GAME.md
- https://github.com/404-Repo/404-game-recipe/blob/main/404.md
- https://github.com/404-Repo/404-game-recipe/blob/main/docs/asset-contract.md

