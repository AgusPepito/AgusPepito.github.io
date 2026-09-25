import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import tubeSurface, { wrapTubeSurface } from '../../public/assets/track/tube-surface-r1.js';
import lane from './recipe-assets/phase-lane-r1.js';
import serviceBelt, {SERVICE_BELT_LENGTH} from './recipe-assets/tube-service-belt-r2.js';
import { PHASES, RADIUS, stripCenter } from './track.js';

const laneHalfWidth=3.24/(Math.PI*RADIUS);
// Centers stay inside the 100 m render chunks (which begin at -50 m).
// Unequal gaps give each 12 m service section a quiet graphite approach.
export const SERVICE_VARIATION_LAYOUT=[
  {at:100,variant:'pipe',offset:0},
  {at:300,variant:'cooling',offset:2},
  {at:600,variant:'access',offset:1},
  {at:800,variant:'armor',offset:3},
  {at:1100,variant:'cooling',offset:5},
  {at:1300,variant:'pipe',offset:3},
  {at:1500,variant:'armor',offset:1},
  {at:1700,variant:'access',offset:4},
];
export function tubeReviewStrips(inside) {
  if(inside) return [
    {start:25,end:1725,phase:2,from:0,to:2,width:laneHalfWidth},
    {start:200,end:700,phase:0,from:.7,to:1.3,width:laneHalfWidth},
    {start:900,end:1450,phase:1,from:.45,to:1.1,width:laneHalfWidth},
  ];
  return [
    {start:25,end:575,phase:0,from:0,to:.65,width:laneHalfWidth},
    {start:625,end:1175,phase:1,from:.65,to:1.35,width:laneHalfWidth},
    {start:1225,end:1725,phase:2,from:1.35,to:2,width:laneHalfWidth},
  ];
}

export function tubeAssembly(THREE, {inside=false,start=0,length=100,courseStart=0,courseEnd=100,strips=[],services=true,detail=false,detailAt=50,belts=null}={}) {
  const radius=RADIUS,half=Math.PI*radius,end=start+length;
  const halfBelt=SERVICE_BELT_LENGTH/2;
  const localBelts=(belts??(detail?[{at:detailAt}]:[])).filter(belt=>belt.at-halfBelt>=start&&belt.at+halfBelt<=end);
  const root=tubeSurface(THREE,{inside,radius,length,sectionIndex:Math.floor((start-courseStart)/100),startCap:start===courseStart,endCap:end===courseEnd,services:detail||belts!==null?false:services,wrap:false,cutRanges:localBelts.map(belt=>[belt.at-start-halfBelt,belt.at-start+halfBelt])});
  for(const {at,variant,offset} of localBelts){const belt=serviceBelt(THREE,{radius,variant,offset});belt.position.z=start+length/2-at;root.add(belt);}
  for(const strip of strips) for(let at=strip.start;at<strip.end;at+=12.5) {
    const a=Math.max(at,start),b=Math.min(at+12.5,strip.end,end);
    if(a>=b) continue;
    const kind=a===strip.start?'start':b===strip.end?'end':'middle';
    const module=lane(THREE,{kind,phase:strip.phase,color:PHASES[strip.phase].hex,length:b-a,width:strip.width*half*2});
    module.updateMatrixWorld(true);
    module.traverse(mesh=>{
      if(!mesh.isMesh)return;
      mesh.geometry.applyMatrix4(mesh.matrixWorld);
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++) {
        const s=(a+b)/2-p.getZ(i);
        p.setXYZ(i,p.getX(i)+stripCenter(strip,s)*half,p.getY(i)+.012,start+length/2-s);
      }
      mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);
    });
    root.add(module);
  }
  wrapTubeSurface(THREE,root,inside,radius);
  return root;
}

export function tubeChunk(THREE,start,inside,courseLength,strips,detail=false,variations=false) {
  const length=Math.min(100,courseLength-start);
  const result=new THREE.Group();
  if(length<=0)return result;
  const root=tubeAssembly(THREE,{inside,start,length,courseStart:-50,courseEnd:courseLength,strips,detail,detailAt:100,belts:variations?SERVICE_VARIATION_LAYOUT:null});
  const grouped=new Map(),materials=new Map(),disposed=new Set();
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const name=mesh.material.name;
    if(!materials.has(name))materials.set(name,mesh.material);
    else if(mesh.material!==materials.get(name)&&!disposed.has(mesh.material)){mesh.material.dispose();disposed.add(mesh.material);}
    if(!grouped.has(name))grouped.set(name,[]);
    grouped.get(name).push(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone());
    mesh.geometry.dispose();
  });
  for(const [name,pieces] of grouped) {
    const mesh=new THREE.Mesh(mergeGeometries(pieces),materials.get(name));
    if(name.startsWith('lane-r1-'))mesh.renderOrder=1;
    result.add(mesh);pieces.forEach(geometry=>geometry.dispose());
  }
  result.position.z=-start-length/2;
  return result;
}
