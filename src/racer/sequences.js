// Authored building blocks for the first sequence pass. Distances leave roughly
// 0.84–1.1 seconds per action at the current maximum speed of 190 m/s.
export const PHASE_CHAINS = [
  { id: 'outer-switch', name: 'ORBIT SWITCH', gates: [{ s: 1340, phase: 1 }, { s: 1500, phase: 2 }], obstacleS: 1690 },
  { id: 'road-thread', name: 'SWITCH & THREAD', gates: [{ s: 2710, phase: 0 }, { s: 2880, phase: 1 }], obstacleS: 3080 },
  { id: 'inner-thread', name: 'TUNNEL SWITCH', gates: [{ s: 4420, phase: 0 }, { s: 4580, phase: 2 }], obstacleS: 4780 },
  { id: 'sprint-switch', name: 'FINAL SWITCH', gates: [{ s: 5680, phase: 2 }, { s: 5850, phase: 0 }], obstacleS: 6040 },
];
