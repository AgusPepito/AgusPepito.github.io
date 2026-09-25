import pipe_coupling from '../../public/assets/track/raised-pipe-coupling-r3.js';
import pipe_offset from '../../public/assets/track/raised-pipe-offset-r3.js';
import pipe_straight from '../../public/assets/track/raised-pipe-straight-r3.js';
import pipe_valve from '../../public/assets/track/raised-pipe-valve-r3.js';
import grille_lattice from '../../public/assets/track/raised-grille-lattice-r3.js';
import grille_louver from '../../public/assets/track/raised-grille-louver-r3.js';
import grille_reinforced from '../../public/assets/track/raised-grille-reinforced-r3.js';
import cover_end from '../../public/assets/track/raised-cover-end-r3.js';
import cover_hatch from '../../public/assets/track/raised-cover-hatch-r3.js';
import cover_plain from '../../public/assets/track/raised-cover-plain-r3.js';
import cover_ramp_end from '../../public/assets/track/raised-cover-ramp-end-r3.js';
import cover_ramp_start from '../../public/assets/track/raised-cover-ramp-start-r3.js';
import cover_segmented from '../../public/assets/track/raised-cover-segmented-r3.js';
import cover_start from '../../public/assets/track/raised-cover-start-r3.js';
import cover_vented from '../../public/assets/track/raised-cover-vented-r3.js';
import wallLights from '../../public/assets/track/sidewall-lights-r1.js';
import {mountEdgeLight,LIT_WALL_OFFSET} from './roadside-lighting.js';
// Active R3 set: central pipe/grille pieces; all terminal pieces belong to armor.
const sourceKit = {
  pipe: {straight:pipe_straight,coupling:pipe_coupling,valve:pipe_valve,offset:pipe_offset},
  grille: {lattice:grille_lattice,louver:grille_louver,reinforced:grille_reinforced},
  cover: {plain:cover_plain,segmented:cover_segmented,hatch:cover_hatch,vented:cover_vented,
    start:cover_start,end:cover_end,'ramp-start':cover_ramp_start,'ramp-end':cover_ramp_end},
};
// Apply one fixture design to every source family, preserving the approved
// wall shapes and the exact start/end/ramp choice made by the mounting helper.
export const detailedKit=Object.fromEntries(Object.entries(sourceKit).map(([family,variants])=>[
  family,Object.fromEntries(Object.entries(variants).map(([kind,factory])=>[kind,THREE=>{
    const module=factory(THREE);module.add(wallLights(THREE,{kind}));return module;
  }])),
]));
export const isBayTerminal = kind => ['start','end','ramp-start','ramp-end'].includes(kind);
export const detailedBayFactory = (family,kind) => detailedKit[isBayTerminal(kind)?'cover':family][kind];
export function addDetailedBays(THREE, foundation, category, chunkIndex = 0) {
  if(category==='01')return; // Basic housings were removed from the active R3 set.
  const primary = { '02':'pipe','03':'grille','04':'cover' }[category]||'cover';
  const families = [primary, ...['pipe','grille','cover'].filter(f => f !== primary)];
  // Authored comparison blocks, not the later procedural category-05 layout system.
  const family = families[Math.floor(chunkIndex / 2) % families.length];
  const variants = {pipe:['straight','coupling','valve','offset'],grille:['lattice','louver','reinforced'],cover:['plain','segmented','hatch','vented'] }[family];
  for (const [sideIndex, x] of [-(18+LIT_WALL_OFFSET),18+LIT_WALL_OFFSET].entries()) {
    const kinds = ['start', ...Array.from({length:6},(_,i)=>variants[(chunkIndex+sideIndex+i)%variants.length]), 'end'];
    if (chunkIndex === 0 || chunkIndex === 8) kinds[0] = 'ramp-start';
    if (chunkIndex === 5 || chunkIndex === 20) kinds[7] = 'ramp-end';
    kinds.forEach((initialKind,i)=>{
      let kind=initialKind;
      if(x>0) kind=kind.replace('start','TEMP').replace('end','start').replace('TEMP','end');
      const module=detailedBayFactory(family,kind)(THREE);
      // Eight 12.5 m bays fill a 100 m road chunk: no empty breaks at family joins.
      module.scale.x=12.5/12;
      module.rotation.y=x>0?-Math.PI/2:Math.PI/2;
      module.position.set(x,0.6,43.75-i*12.5);foundation.add(module);
      mountEdgeLight(THREE,foundation,x>0?1:-1,{height:.6,z:43.75-i*12.5});
    });
  }
}


