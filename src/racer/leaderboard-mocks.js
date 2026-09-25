import {CAMPAIGN_LEVELS} from './campaign.js';

// Presentation fixtures only. These never pass through the score submission API.
const PILOTS = ['Nova Vale', 'Jett Mercer', 'Echo Voss', 'Kira Sol', 'Rook Atlas', 'Lyra Dash',
  'Axel Drift', 'Mika Ion', 'Zara Flux', 'Finn Orbit', 'Sora Vega', 'Nico Pulse',
  'Aya Comet', 'Remy Volt', 'Tess Vector', 'Kai Zenith', 'Luca Frost', 'Iris Quill',
  'Arlo Helix', 'Nia Cobalt', 'Rex Halo', 'Yuna Ray', 'Orin Slate', 'Cleo Swift'];

export function mockLeaderboard(index) {
  const course = CAMPAIGN_LEVELS[index];
  // Stable, course-specific examples: varied fields and duration proportional to length.
  const winningTime = Math.round(course.length / (211 + index % 7 * 3) * 1000) + 137 + index * 23;
  return Array.from({length: 10}, (_, rank) => ({
    position: rank + 1,
    display_name: PILOTS[(index * 7 + rank * 5) % PILOTS.length],
    time_ms: winningTime + Math.round(rank * (winningTime * .024 + 163) + rank * rank * 41 + (rank ? (index * rank * 71) % 199 : 0)),
    is_you: false,
  }));
}
