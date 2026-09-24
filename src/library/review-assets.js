import foundation from '../../public/assets/track/flat-foundation-r1.js';
import lane from '../../public/assets/track/phase-lane-r1.js';
import marker from '../../public/assets/track/neutral-edge-marker-r1.js';
import { detailedKit } from '../racer/detailed-kit.js';
import { addMixedBays, expandRuns, mountDetailedBay } from '../racer/mixed-kit.js';
import { addPhaseLanes } from '../racer/lane-kit.js';
import { PHASES } from '../racer/track.js';
import tubeSurface, {wrapTubeSurface} from '../../public/assets/track/tube-surface-r1.js';
import serviceBelt, {SERVICE_BELT_VARIANTS} from '../../public/assets/track/tube-service-belt-r2.js';
import { tubeAssembly } from '../racer/tube-kit.js';

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
    ...Object.fromEntries([['07',false],['08',true]].map(([id,inside])=>[id,[
      ...SERVICE_BELT_VARIANTS.map(variant=>[`variation-${variant}`,`R2 variation · ${variant==='armor'?'quiet armor':variant+'-heavy'} · 12 m belt`,()=>wrapTubeSurface(THREE,serviceBelt(THREE,{variant}),inside)]),
      ['variation-road','R2 variation · pipe belt in graphite road',()=>tubeAssembly(THREE,{inside,length:100,courseEnd:100,belts:[{at:50,variant:'pipe'}]})],
      ['detail-r2','Approved R2 · ivory service section in road',()=>tubeAssembly(THREE,{inside,length:100,courseEnd:100,detail:true,detailAt:50})],
      ['detail-belt','Approved R2 · complete twelve-metre ivory belt',()=>wrapTubeSurface(THREE,serviceBelt(THREE),inside)],
      ...['pipe','cooling','access','armor'].map(family=>[`detail-${family}`,`Approved R2 · ${family} cartridge`,()=>detailedTubePart(THREE,inside,family)]),
      ['assembly',`${inside?'Inside':'Outside'} tube with phase lane`,()=>tubeAssembly(THREE,{inside,length:100,courseEnd:100,strips:[{start:12.5,end:87.5,phase:inside?2:1,from:0,to:.4,width:3.24/(Math.PI*18)}]})],
      ['skin','Curved road skin and panel courses',()=>tubeSurface(THREE,{inside,services:false,startCap:false,endCap:false})],
      ['mouth','Exposed mouth cross-section',()=>tubePart(THREE,inside,n=>n.name.includes('mouth'))],
      ['bands','Flush bands and closure seam',()=>tubePart(THREE,inside,n=>n.name.includes('band')||n.name.includes('closure'))],
      ...['pipe','grille','cover'].map(family=>[family,`Protected ${family} service recess`,()=>tubePart(THREE,inside,n=>n.userData.serviceFamily===family)]),
      ...(inside?[['lights','Neutral recessed light strips',()=>tubePart(THREE,inside,n=>n.name.includes('light'))]]:[]),
    ]])),
  };
}

function tubePart(THREE,inside,select) {
  const root=tubeSurface(THREE,{inside});
  const removedMaterials=new Set(),keptMaterials=new Set();
  for(const mesh of [...root.children]) {
    if(select(mesh))keptMaterials.add(mesh.material);
    else {root.remove(mesh);mesh.geometry.dispose();removedMaterials.add(mesh.material);}
  }
  for(const material of removedMaterials)if(!keptMaterials.has(material))material.dispose();
  return root;
}

function detailedTubePart(THREE,inside,family){
  const root=serviceBelt(THREE);
  // Keep one cartridge near the central driving meridian for a useful fit.
  const cell=2*Math.PI*18/24;
  const targetIndex={access:12,armor:11,pipe:14,cooling:10}[family];
  const x=-Math.PI*18+(targetIndex+.5)*cell;
  const materials=new Set(),kept=new Set();
  for(const mesh of [...root.children]){
    mesh.geometry.computeBoundingBox();
    const bounds=mesh.geometry.boundingBox;
    const center=(bounds.min.x+bounds.max.x)/2+mesh.position.x;
    if(mesh.userData.serviceFamily===family&&Math.abs(center-x)<cell/2)kept.add(mesh.material);
    else{root.remove(mesh);mesh.geometry.dispose();materials.add(mesh.material);}
  }
  for(const material of materials)if(!kept.has(material))material.dispose();
  return wrapTubeSurface(THREE,root,inside);
}
