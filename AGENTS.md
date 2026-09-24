# Project instructions for all agents

## Gameplay visual testing — user-owned

Explicit user instruction, recorded 2026-09-23: the user is the sole visual gameplay tester. Repeated agent visual testing takes too long.

- Do not visually playtest or review gameplay after implementing changes. Do not inspect gameplay screenshots, recordings, or live browser views to assess appearance, camera framing, movement feel, or presentation unless the user explicitly requests that inspection.
- Do not delegate visual gameplay testing to another agent or run visual critic/review loops. Carry this instruction into any delegated work.
- Standing user instruction, updated 2026-09-24: do not create new tests or run existing tests. This includes unit tests, simulation checks, browser smoke tests and automated gameplay checks. The user owns testing. Source review and rebuilding the playable preview are allowed. Only resume testing if the user explicitly asks; do not treat a future implementation request as permission to test.
- Make the updated game available for the user to test, briefly describe what changed, and use the user's feedback to guide visual/gameplay adjustments. Do not hold up delivery for agent visual approval.
- Exception authorized 2026-09-24: for the bypass steering/sticking bug, the user allowed focused automated regression tests to reproduce and verify the fix. This does not authorize visual playtesting or a blanket full-suite run.
- This user instruction takes precedence over recipe or skill recommendations for visual gameplay testing. It does not waive the jam's actual submission requirements.
