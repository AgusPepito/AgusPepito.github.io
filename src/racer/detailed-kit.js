import frame_end from '../../public/assets/track/raised-frame-end-r3.js';
import frame_middle from '../../public/assets/track/raised-frame-middle-r3.js';
import frame_ramp_end from '../../public/assets/track/raised-frame-ramp-end-r3.js';
import frame_ramp_start from '../../public/assets/track/raised-frame-ramp-start-r3.js';
import frame_start from '../../public/assets/track/raised-frame-start-r3.js';
import pipe_coupling from '../../public/assets/track/raised-pipe-coupling-r3.js';
import pipe_end from '../../public/assets/track/raised-pipe-end-r3.js';
import pipe_offset from '../../public/assets/track/raised-pipe-offset-r3.js';
import pipe_ramp_end from '../../public/assets/track/raised-pipe-ramp-end-r3.js';
import pipe_ramp_start from '../../public/assets/track/raised-pipe-ramp-start-r3.js';
import pipe_start from '../../public/assets/track/raised-pipe-start-r3.js';
import pipe_straight from '../../public/assets/track/raised-pipe-straight-r3.js';
import pipe_valve from '../../public/assets/track/raised-pipe-valve-r3.js';
import grille_end from '../../public/assets/track/raised-grille-end-r3.js';
import grille_lattice from '../../public/assets/track/raised-grille-lattice-r3.js';
import grille_louver from '../../public/assets/track/raised-grille-louver-r3.js';
import grille_ramp_end from '../../public/assets/track/raised-grille-ramp-end-r3.js';
import grille_ramp_start from '../../public/assets/track/raised-grille-ramp-start-r3.js';
import grille_reinforced from '../../public/assets/track/raised-grille-reinforced-r3.js';
import grille_start from '../../public/assets/track/raised-grille-start-r3.js';
import cover_end from '../../public/assets/track/raised-cover-end-r3.js';
import cover_hatch from '../../public/assets/track/raised-cover-hatch-r3.js';
import cover_plain from '../../public/assets/track/raised-cover-plain-r3.js';
import cover_ramp_end from '../../public/assets/track/raised-cover-ramp-end-r3.js';
import cover_ramp_start from '../../public/assets/track/raised-cover-ramp-start-r3.js';
import cover_segmented from '../../public/assets/track/raised-cover-segmented-r3.js';
import cover_start from '../../public/assets/track/raised-cover-start-r3.js';
import cover_vented from '../../public/assets/track/raised-cover-vented-r3.js';
export const detailedKit = {'frame': { 'end': frame_end, 'middle': frame_middle, 'ramp-end': frame_ramp_end, 'ramp-start': frame_ramp_start, 'start': frame_start },'pipe': { 'coupling': pipe_coupling, 'end': pipe_end, 'offset': pipe_offset, 'ramp-end': pipe_ramp_end, 'ramp-start': pipe_ramp_start, 'start': pipe_start, 'straight': pipe_straight, 'valve': pipe_valve },'grille': { 'end': grille_end, 'lattice': grille_lattice, 'louver': grille_louver, 'ramp-end': grille_ramp_end, 'ramp-start': grille_ramp_start, 'reinforced': grille_reinforced, 'start': grille_start },'cover': { 'end': cover_end, 'hatch': cover_hatch, 'plain': cover_plain, 'ramp-end': cover_ramp_end, 'ramp-start': cover_ramp_start, 'segmented': cover_segmented, 'start': cover_start, 'vented': cover_vented }};
export function addDetailedBays(THREE, foundation, category, chunkIndex = 0) {
  const primary = { '01':'frame','02':'pipe','03':'grille','04':'cover' }[category];
  const families = primary === 'frame' ? ['frame'] : [primary, ...['pipe','grille','cover'].filter(f => f !== primary)];
  // Authored comparison blocks, not the later procedural category-05 layout system.
  const family = families[Math.floor(chunkIndex / 2) % families.length];
  const variants = { frame:['middle'],pipe:['straight','coupling','valve','offset'],grille:['lattice','louver','reinforced'],cover:['plain','segmented','hatch','vented'] }[family];
  for (const [sideIndex, x] of [-20,20].entries()) {
    const kinds = ['start', ...Array.from({length:6},(_,i)=>variants[(chunkIndex+sideIndex+i)%variants.length]), 'end'];
    if (chunkIndex === 0 || chunkIndex === 8) kinds[0] = 'ramp-start';
    if (chunkIndex === 5 || chunkIndex === 20) kinds[7] = 'ramp-end';
    kinds.forEach((initialKind,i)=>{
      let kind=initialKind;
      if(x>0) kind=kind.replace('start','TEMP').replace('end','start').replace('TEMP','end');
      const module=detailedKit[family][kind](THREE);
      // Eight 12.5 m bays fill a 100 m road chunk: no empty breaks at family joins.
      module.scale.x=12.5/12;
      module.rotation.y=x>0?-Math.PI/2:Math.PI/2;
      module.position.set(x,0.6,43.75-i*12.5);foundation.add(module);
    });
  }
}

