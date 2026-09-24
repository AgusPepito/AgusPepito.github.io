import grilleStart from '../../public/assets/track/grille-start-r1.js';
import lattice from '../../public/assets/track/grille-lattice-r1.js';
import louver from '../../public/assets/track/grille-louver-r1.js';
import reinforced from '../../public/assets/track/grille-reinforced-r1.js';
import grilleEnd from '../../public/assets/track/grille-end-r1.js';
import coverStart from '../../public/assets/track/cover-start-r1.js';
import plain from '../../public/assets/track/cover-plain-r1.js';
import segmented from '../../public/assets/track/cover-segmented-r1.js';
import hatch from '../../public/assets/track/cover-hatch-r1.js';
import vented from '../../public/assets/track/cover-vented-r1.js';
import coverEnd from '../../public/assets/track/cover-end-r1.js';
import { addPipeBays } from './pipe-kit.js';

export const grilleKit = { start: grilleStart, lattice, louver, reinforced, end: grilleEnd };
export const coverKit = { start: coverStart, plain, segmented, hatch, vented, end: coverEnd };
export function addSurfaceBays(THREE, foundation, category, chunkIndex = 0, comparison = false) {
  // Sparse comparison sections show real family changeovers without modifying prior approvals.
  if (comparison && chunkIndex % 8 === 7) {
    if (category === '03') return addPipeBays(THREE, foundation, chunkIndex);
    return addSurfaceBays(THREE, foundation, '03', chunkIndex);
  }
  const kit = category === '03' ? grilleKit : coverKit;
  const patterns = category === '03'
    ? [['lattice', 'lattice'], ['louver', 'louver'], ['reinforced', 'reinforced']]
    : [['plain', 'plain'], ['plain', 'plain'], ['segmented', 'segmented'], ['hatch', 'vented']];
  for (const [sideIndex, x] of [-20, 20].entries()) {
    const middle = patterns[((chunkIndex + sideIndex) % patterns.length + patterns.length) % patterns.length];
    ['start', ...middle, 'end'].forEach((kind, i) => {
      const insert = kit[kind](THREE); insert.position.set(x, 0.15, 36 - i * 24); foundation.add(insert);
    });
  }
}
