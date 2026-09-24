import start from '../../public/assets/track/pipe-start-r1.js';
import straight from '../../public/assets/track/pipe-straight-r1.js';
import coupling from '../../public/assets/track/pipe-coupling-r1.js';
import valve from '../../public/assets/track/pipe-valve-r1.js';
import offset from '../../public/assets/track/pipe-offset-r1.js';
import end from '../../public/assets/track/pipe-end-r1.js';

export const pipeKit = { start, straight, coupling, valve, offset, end };
export function addPipeBays(THREE, foundation, chunkIndex = 0) {
  const sequences = [
    ['start', 'straight', 'coupling', 'end'],
    ['start', 'valve', 'offset', 'end'],
    ['start', 'coupling', 'straight', 'end'],
    ['start', 'offset', 'valve', 'end'],
  ];
  for (const [sideIndex, x] of [-20, 20].entries()) {
    const sequence = sequences[((chunkIndex + sideIndex) % sequences.length + sequences.length) % sequences.length];
    // +Z faces the player; sequence reads in driving order.
    for (let i = 0; i < 4; i++) {
      const insert = pipeKit[sequence[i]](THREE);
      insert.position.set(x, 0.15, 36 - i * 24); foundation.add(insert);
    }
  }
}
