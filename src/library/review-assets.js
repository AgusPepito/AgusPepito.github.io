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
import {transitionAssembly} from '../racer/transition-kit.js';
import {TRANSITION_COURSES} from '../racer/transition-profile.js';
import gapEdge from '../../public/assets/track/gap-edge-r1.js';
import gapSurface from '../../public/assets/track/gap-surface-r2.js';
import {gapAssembly,gapEnd} from '../racer/gap-kit.js';
import gapBorder from '../../public/assets/track/gap-border-r1.js';
import tubeTermination from '../../public/assets/track/tube-gap-termination-r1.js';
import {wallAssembly,wallRoadStudy} from '../racer/wall-kit.js';
import {passageAssembly} from '../racer/passage-kit.js';
import {emitterAssembly} from '../racer/phase-emitter-kit.js';
import {barrierAssembly,obstacleAssembly} from '../racer/obstacle-kit.js';
import {checkpointAssembly} from '../racer/checkpoint-kit.js';

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
    '13':['flat','outside','inside'].flatMap(shape=>[
      [`${shape}-checkpoint`,`${shape} · complete checkered checkpoint`,()=>checkpointAssembly(THREE,{shape})],
      [`${shape}-checkpoint-road`,`${shape} · checkpoint seated in road`,()=>checkpointAssembly(THREE,{shape,road:true})],
      [`${shape}-checkpoint-hardware`,`${shape} · checkers and recessed instruments`,()=>checkpointAssembly(THREE,{shape,projection:false})],
      [`${shape}-checkpoint-module`,`${shape} · detailed checker and instrument module`,()=>checkpointAssembly(THREE,{shape,width:12,projection:false,merge:false})],
    ]),
    '12':['flat','outside','inside'].flatMap(shape=>[
      [`${shape}-barrier-middle`,`${shape} · J3 repeatable louver middle`,()=>barrierAssembly(THREE,{shape,width:4.5,startCap:false,endCap:false})],
      [`${shape}-barrier-start`,`${shape} · J3 start and armored end cap`,()=>barrierAssembly(THREE,{shape,width:4.5,endCap:false})],
      [`${shape}-barrier-end`,`${shape} · J3 finish and armored end cap`,()=>barrierAssembly(THREE,{shape,width:4.5,startCap:false})],
      [`${shape}-barrier-run`,`${shape} · J3 four-bay louver bank`,()=>barrierAssembly(THREE,{shape})],
      ...['opening-only','jump-or-opening','jump-only'].map(type=>[`${shape}-obstacle-${type}`,`${shape} · ${type} assembly`,()=>obstacleAssembly(THREE,{shape,type,road:true})]),
      [`${shape}-obstacle-offset`,`${shape} · offset jump-or-opening assembly`,()=>obstacleAssembly(THREE,{shape,type:'jump-or-opening',center:shape==='flat'?-4.5:Math.PI*18*.96,road:true})],
      [`${shape}-gate`,`${shape} · F1/F2 complete phase gate`,()=>emitterAssembly(THREE,{shape,merge:true})],
      [`${shape}-gate-road`,`${shape} · recessed gate seated in road`,()=>emitterAssembly(THREE,{shape,road:true,merge:true})],
      [`${shape}-gate-hardware`,`${shape} · power station without projection`,()=>emitterAssembly(THREE,{shape,projection:false,merge:true})],
      [`${shape}-gate-module`,`${shape} · detailed six-metre emitter module`,()=>emitterAssembly(THREE,{shape,width:6,projection:false})],
      [`${shape}-passage`,`${shape} · P3 service passage frame`,()=>passageAssembly(THREE,{shape})],
      [`${shape}-passage-infill`,`${shape} · passage joined to W4 walls`,()=>passageAssembly(THREE,{shape,infill:true})],
      [`${shape}-passage-offset`,`${shape} · offset passage with walls and road`,()=>passageAssembly(THREE,{shape,center:shape==='flat'?4.5:12,infill:true,road:true})],
      ...['left-jamb','right-jamb','lintel'].map(part=>[`${shape}-passage-${part}`,`${shape} · P3 ${part}`,()=>passageAssembly(THREE,{shape,part})]),
      [`${shape}-run`,`${shape} · four-bay W4 wall with sealed ends`,()=>wallAssembly(THREE,{shape})],
      [`${shape}-start`,`${shape} · starting bay and terminal cap`,()=>wallAssembly(THREE,{shape,width:4.5,endCap:false})],
      [`${shape}-middle`,`${shape} · repeatable middle bay`,()=>wallAssembly(THREE,{shape,width:4.5,startCap:false,endCap:false})],
      [`${shape}-end`,`${shape} · ending bay and terminal cap`,()=>wallAssembly(THREE,{shape,width:4.5,startCap:false})],
      [`${shape}-road`,`${shape} · wall seated on the road surface`,()=>wallRoadStudy(THREE,{shape})],
      ...(shape==='flat'?[]:[
        [`${shape}-ring`,`${shape} · continuous wall ring / repeat joins`,()=>wallAssembly(THREE,{shape,width:2*Math.PI*18,startCap:false,endCap:false})],
        [`${shape}-seam`,`${shape} · wall crossing tube closure`,()=>wallAssembly(THREE,{shape,width:18,center:Math.PI*18})],
      ]),
    ]),
    '11':[
      ['takeoff','R2 · takeoff with embedded light arrows',()=>gapEdge(THREE,{kind:'takeoff'})],
      ['landing','R2 · landing with bright edge strip',()=>gapEdge(THREE,{kind:'landing'})],
      ['takeoff-surface','R2 · takeoff optical fixtures and top plates',()=>gapSurface(THREE,{kind:'takeoff'})],
      ['landing-surface','R2 · landing optical fixtures and top plates',()=>gapSurface(THREE,{kind:'landing'})],
      ['cut-section','Exposed deck · six-metre cut-section detail',()=>gapEdge(THREE,{width:6})],
      ['beam-caps','Sealed edge beams and flange seats',()=>gapCutPart(THREE,n=>/sealed-edge-beam-cap|bolted-ivory-flange-seat|exposed-flange-fastener/.test(n.name))],
      ['pipe-caps','Sealed pipe ends and retaining rings',()=>gapCutPart(THREE,n=>/sealed-pipe|pipe-cap/.test(n.name))],
      ['partial-takeoff','Partial opening · eighteen-metre takeoff',()=>gapEnd(THREE,{partial:true})],
      ['partial-landing','Partial opening · eighteen-metre landing',()=>gapEnd(THREE,{partial:true,kind:'landing'})],
      ['partial-border','Partial opening · illuminated lateral cut trim',()=>gapBorder(THREE)],
      ['warning-housing','Recessed edge lights · replaceable optical housing',()=>gapBorder(THREE,{length:2.5})],
      ['assembly','Flat · full gap and both road ends',()=>gapAssembly(THREE)],
      ['partial-assembly','Flat · partial opening and intact bypasses',()=>gapAssembly(THREE,{start:1000,end:1175})],
      ...['outside','inside'].flatMap(shape=>[
        [`${shape}-termination`,shape==='inside'?'Inside · deep service collar and energy rim':'Outside · sealed plated bulkhead and energy rim',()=>tubeTermination(THREE,{inside:shape==='inside',kind:'landing'})],
        [`${shape}-partial-termination`,`${shape} · partial cut service sector`,()=>tubeTermination(THREE,{inside:shape==='inside',kind:'landing',partial:true})],
        [`${shape}-takeoff`,`${shape} tube · full takeoff rim`,()=>gapEnd(THREE,{shape})],
        [`${shape}-landing`,`${shape} tube · full illuminated landing rim`,()=>gapEnd(THREE,{shape,kind:'landing'})],
        [`${shape}-partial-takeoff`,`${shape} tube · partial takeoff`,()=>gapEnd(THREE,{shape,partial:true})],
        [`${shape}-partial-landing`,`${shape} tube · partial landing`,()=>gapEnd(THREE,{shape,partial:true,kind:'landing'})],
        [`${shape}-assembly`,`${shape} tube · full gap assembly`,()=>gapAssembly(THREE,{shape})],
        [`${shape}-partial-assembly`,`${shape} tube · partial opening and bypass`,()=>gapAssembly(THREE,{shape,start:1000,end:1175})],
      ]),
    ],
    ...Object.fromEntries(['09','10'].map(category=>{
      const run=TRANSITION_COURSES[category].runs[0];
      return [category,[
        ['closing','Flat → tube · complete closing assembly',()=>transitionAssembly(THREE,{category,start:run.enter,length:run.closed-run.enter})],
        ['opening','Tube → flat · reverse assembly',()=>transitionAssembly(THREE,{category,start:run.open,length:run.exit-run.open})],
        ['midpoint','Half-curled road · plates and lane',()=>transitionAssembly(THREE,{category,start:350,length:100})],
        ['closure','Final closure · meeting edge trim',()=>transitionAssembly(THREE,{category,start:550,length:100})],
        ['trim','Converging edges and flush bands',()=>transitionAssembly(THREE,{category,start:run.enter,length:run.closed-run.enter,parts:'trim'})],
        ['service','Curved pipe service section · flexible joints',()=>transitionAssembly(THREE,{category,start:300,length:12.5})],
        ['cooling','Curved cooling service section',()=>transitionAssembly(THREE,{category,start:500,length:12.5})],
        ['skin','Variable-width metal plate courses',()=>transitionAssembly(THREE,{category,start:350,length:50,services:false,lanes:false,parts:'skin'})],
      ]];
    })),
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

function gapCutPart(THREE,select){
  const source=gapEdge(THREE,{width:6}),root=new THREE.Group(),meshes=[],kept=new Set(),removed=new Set();
  source.traverse(n=>{if(n.isMesh)meshes.push(n);});
  for(const mesh of meshes){
    if(select(mesh)){root.add(mesh);kept.add(mesh.material);}
    else{mesh.geometry.dispose();removed.add(mesh.material);}
  }
  for(const mat of removed)if(!kept.has(mat))mat.dispose();return root;
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
