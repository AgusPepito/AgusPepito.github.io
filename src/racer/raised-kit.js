import frame_end from '../../public/assets/track/raised-frame-end-r2.js';
import frame_middle from '../../public/assets/track/raised-frame-middle-r2.js';
import frame_ramp_end from '../../public/assets/track/raised-frame-ramp-end-r2.js';
import frame_ramp_start from '../../public/assets/track/raised-frame-ramp-start-r2.js';
import frame_start from '../../public/assets/track/raised-frame-start-r2.js';
import pipe_coupling from '../../public/assets/track/raised-pipe-coupling-r2.js';
import pipe_end from '../../public/assets/track/raised-pipe-end-r2.js';
import pipe_offset from '../../public/assets/track/raised-pipe-offset-r2.js';
import pipe_ramp_end from '../../public/assets/track/raised-pipe-ramp-end-r2.js';
import pipe_ramp_start from '../../public/assets/track/raised-pipe-ramp-start-r2.js';
import pipe_start from '../../public/assets/track/raised-pipe-start-r2.js';
import pipe_straight from '../../public/assets/track/raised-pipe-straight-r2.js';
import pipe_valve from '../../public/assets/track/raised-pipe-valve-r2.js';
import grille_end from '../../public/assets/track/raised-grille-end-r2.js';
import grille_lattice from '../../public/assets/track/raised-grille-lattice-r2.js';
import grille_louver from '../../public/assets/track/raised-grille-louver-r2.js';
import grille_ramp_end from '../../public/assets/track/raised-grille-ramp-end-r2.js';
import grille_ramp_start from '../../public/assets/track/raised-grille-ramp-start-r2.js';
import grille_reinforced from '../../public/assets/track/raised-grille-reinforced-r2.js';
import grille_start from '../../public/assets/track/raised-grille-start-r2.js';
import cover_end from '../../public/assets/track/raised-cover-end-r2.js';
import cover_hatch from '../../public/assets/track/raised-cover-hatch-r2.js';
import cover_plain from '../../public/assets/track/raised-cover-plain-r2.js';
import cover_ramp_end from '../../public/assets/track/raised-cover-ramp-end-r2.js';
import cover_ramp_start from '../../public/assets/track/raised-cover-ramp-start-r2.js';
import cover_segmented from '../../public/assets/track/raised-cover-segmented-r2.js';
import cover_start from '../../public/assets/track/raised-cover-start-r2.js';
import cover_vented from '../../public/assets/track/raised-cover-vented-r2.js';
export const raisedKit = {'frame': { 'end': frame_end, 'middle': frame_middle, 'ramp-end': frame_ramp_end, 'ramp-start': frame_ramp_start, 'start': frame_start },'pipe': { 'coupling': pipe_coupling, 'end': pipe_end, 'offset': pipe_offset, 'ramp-end': pipe_ramp_end, 'ramp-start': pipe_ramp_start, 'start': pipe_start, 'straight': pipe_straight, 'valve': pipe_valve },'grille': { 'end': grille_end, 'lattice': grille_lattice, 'louver': grille_louver, 'ramp-end': grille_ramp_end, 'ramp-start': grille_ramp_start, 'reinforced': grille_reinforced, 'start': grille_start },'cover': { 'end': cover_end, 'hatch': cover_hatch, 'plain': cover_plain, 'ramp-end': cover_ramp_end, 'ramp-start': cover_ramp_start, 'segmented': cover_segmented, 'start': cover_start, 'vented': cover_vented }};
export function addRaisedBays(THREE, foundation, category, chunkIndex = 0) {
  const primary = { '01':'frame','02':'pipe','03':'grille','04':'cover' }[category];
  const families = primary === 'frame' ? ['frame'] : [primary, ...['pipe','grille','cover'].filter(f => f !== primary)];
  // Authored comparison blocks, not the later procedural category-05 layout system.
  const family = families[Math.floor(chunkIndex / 2) % families.length];
  const variants = { frame:['middle'],pipe:['straight','coupling','valve','offset'],grille:['lattice','louver','reinforced'],cover:['plain','segmented','hatch','vented'] }[family];
  for (const [sideIndex, x] of [-20,20].entries()) {
    const kinds = ['start', variants[(chunkIndex+sideIndex)%variants.length], variants[(chunkIndex+sideIndex+1)%variants.length], 'end'];
    if (chunkIndex === 0 || chunkIndex === 8) kinds[0] = 'ramp-start';
    if (chunkIndex === 5 || chunkIndex === 20) kinds[3] = 'ramp-end';
    kinds.forEach((initialKind,i)=>{
      let kind=initialKind;
      if(x>0) kind=kind.replace('start','TEMP').replace('end','start').replace('TEMP','end');
      const module=raisedKit[family][kind](THREE);
      // Four 25 m bays fill a 100 m road chunk: no empty breaks at family joins.
      module.scale.x=25/24;
      module.rotation.y=x>0?-Math.PI/2:Math.PI/2;
      module.position.set(x,0.6,37.5-i*25);foundation.add(module);
    });
  }
}
