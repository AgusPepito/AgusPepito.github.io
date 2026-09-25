# Jump feedback R1

Purpose: make accepted jumps recognizable from the chase camera during launch, flight and landing, including rotated tube sections.

- Launch: twin feathered lift jets with white cores, a brief nozzle flare, narrow exhaust streaks and a short elliptical surface impulse. The jets use crossed alpha sheets with soft tips/sides; the rig follows the hull's steering bank and pitch. The impulse decays over the actual `JUMP.rise` interval.
- Flight: thin, soft-edged engine ribbons retain 0.40 seconds of the airborne arc instead of the usual 0.16-second wake. A faint nozzle glow replaces the large persistent hoop. Lift jets strengthen briefly over the last 0.28 seconds of the nominal jump to suggest landing thrust.
- Landing: a single feathered compression ripple follows the curved surface and fades over 0.34 seconds, with a small burst of tapered streaks. Surface samples outside the road or over a gap fade away.
- Events use accepted `airborne`/`jumpTime` transitions, including an edge-grace jump. Walking off an edge does not trigger a launch; failed button presses do not emit effects. Pause freezes the effect clock, while restarts, level handoffs and preview changes clear it.
- Pools are bounded: three surface ripples and 32 streaks in one mesh, with the existing engine trails reused. Light graphics uses 24 ring samples and six streaks per event. Reduced motion retains two steady nozzle glows and disables plumes, expanding rings, particles and trails.
- Collision, jump timing, height, steering and camera behavior are unchanged. `RaceVfx` owns the shared glow texture and a small transverse alpha texture for feathered ribbons; resources belong to the scene's existing disposal path.

Sources: `src/racer/jump-vfx.js`, `src/racer/race-vfx.js`.

Source review and build only. Gameplay and visual testing are user-owned.
