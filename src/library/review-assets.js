import foundation from '../../public/assets/track/flat-foundation-r1.js';
import lane from '../../public/assets/track/phase-lane-r1.js';
import marker from '../../public/assets/track/neutral-edge-marker-r1.js';
import { detailedKit } from '../racer/detailed-kit.js';
import { addMixedBays, expandRuns, mountDetailedBay } from '../racer/mixed-kit.js';
import { addPhaseLanes } from '../racer/lane-kit.js';
import { PHASES } from '../racer/track.js';

function road(THREE, layouts, lanes = false) {
  const root = foundation(THREE);
  for (const child of [...root.children]) if (child.name === 'service-bays') {
    child.traverse(mesh => mesh.geometry?.dispose()); root.remove(child);
  }
  addMixedBays(THREE, root, 0, layouts.map(expandRuns));
  if (lanes) addPhaseLanes(THREE, root, -50, PHASES.map((_,phase) => ({start:-37.5,end:37.5,phase,from:(phase-1)*.48,to:(phase-1)*.48,width:.18})));
  return root;
}
const mixed = [
  [['pipe',2],['grille',2],['cover',2],['frame',2]],
  [['cover',3],['frame',2],['pipe',3]],
];
const exposed = [
  [['pipe',3],[null,2],['cover',3]],
  [['grille',3],[null,2],['frame',3]],
];
function join(THREE, a, b) {
  const root = new THREE.Group(); root.name = `${a}-to-${b}-interface`;
  for (const [i,[family,kind]] of [[a,'end'],[b,'start']].entries()) {
    const bay = mountDetailedBay(THREE,root,family,kind,-1,6.25-i*12.5);
    bay.position.x=0; bay.position.y=0;
  }
  return root;
}

export function reviewCatalog(THREE) {
  return {
    '05': [
      ['assembly','Mixed road · R1',() => road(THREE,mixed)],
      ['exposed','Ramps and bare-road interval',() => road(THREE,exposed)],
      ['pipe-grille','Pipe → grille full-height join',() => join(THREE,'pipe','grille')],
      ['grille-cover','Grille → cover full-height join',() => join(THREE,'grille','cover')],
      ['cover-pipe','Cover → pipe full-height join',() => join(THREE,'cover','pipe')],
      ['empty','Empty housing · reused R3 frame',() => detailedKit.frame.middle(THREE)],
    ],
    '06': [
      ['assembly','Three phase lanes in mixed road · R1',() => road(THREE,mixed,true)],
      ...PHASES.flatMap((p,phase) => ['start','middle','end'].map(kind => [
        `${['cyan','amber','violet'][phase]}-${kind}`,`${p.name} · ${kind}`,() => lane(THREE,{kind,phase,color:p.hex}),
      ])),
      ['edge-marker','Neutral flush edge marker',() => marker(THREE)],
    ],
  };
}
