import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import slabs from '../../public/assets/track/slab-surface-r1.js';
import gapEdge,{GAP_EDGE_DEPTH} from '../../public/assets/track/gap-edge-r1.js';
import gapBorder from '../../public/assets/track/gap-border-r1.js';
import tubeTermination from '../../public/assets/track/tube-gap-termination-r1.js';
import {wrapTubeSurface} from '../../public/assets/track/tube-surface-r1.js';
import {subtractRectangles,subdivideAcross} from './gap-geometry.js';

const RADIUS=18,BORDER_WIDTH=.64;
export const GAP_REVIEW_LENGTH=1800;
export const gapRoadWidth=shape=>shape==='flat'?36:2*Math.PI*RADIUS;
export function gapReviewGaps(shape='flat'){
  return [
    {start:450,end:525,center:0,width:1,full:true},
    {start:1050,end:1125,center:0,width:9/(gapRoadWidth(shape)/2),full:false},
  ];
}
function bend(THREE,root,shape){
  if(shape==='flat')return root;
  root.traverse(mesh=>{if(mesh.isMesh)mesh.geometry=subdivideAcross(THREE,mesh.geometry);});
  return wrapTubeSurface(THREE,root,shape==='inside',RADIUS);
}
export function gapEnd(THREE,{shape='flat',kind='takeoff',partial=false,wrap=true}={}){
  const root=new THREE.Group(),width=partial?18:gapRoadWidth(shape),closed=shape!=='flat'&&!partial;
  const count=closed?3:1,cell=width/count;
  for(let i=0;i<count;i++){
    const lip=gapEdge(THREE,{kind,width:cell,finishedSides:!closed});
    lip.position.x=-width/2+(i+.5)*cell;root.add(lip);
  }
  root.name=`${shape}-${partial?'partial':'full'}-${kind}`;
  if(wrap){
    bend(THREE,root,shape);
    if(shape!=='flat')root.add(tubeTermination(THREE,{inside:shape==='inside',kind,partial,radius:RADIUS}));
  }
  return root;
}

// Applies equally to slabs, markings and any service/support meshes mounted
// in the source assembly: no part type can silently bridge the opening.
export function cutGapLayers(THREE,root,rectangles){
  root.updateMatrixWorld(true);
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
    const relevant=rectangles.filter(([l,r,n,f])=>b.max.x>l&&b.min.x<r&&b.max.z>n&&b.min.z<f);
    mesh.geometry=subtractRectangles(THREE,mesh.geometry,relevant);
    mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);
  });
  root.traverse(n=>{if(!n.isMesh){n.position.set(0,0,0);n.rotation.set(0,0,0);n.scale.set(1,1,1);}});
  return root;
}
export function gapAssembly(THREE,{start=400,end=575,shape='flat'}={}){
  const root=new THREE.Group();root.name=`${shape}-gap-assembly-r3`;
  end=Math.min(end,GAP_REVIEW_LENGTH);if(end<=start)return root;
  const width=gapRoadWidth(shape),half=width/2,gaps=gapReviewGaps(shape),masks=[];
  for(const gap of gaps){
    const a=gap.full?-half:gap.center*half-gap.width*half,b=gap.full?half:gap.center*half+gap.width*half;
    // Reserve the illuminated aprons and cut the open interval with one mask.
    masks.push([a,b,-gap.end-GAP_EDGE_DEPTH,-gap.start+GAP_EDGE_DEPTH]);
    if(!gap.full)for(const [l,r]of [[a-BORDER_WIDTH,a],[b,b+BORDER_WIDTH]])masks.push([l,r,-gap.end,-gap.start]);
  }
  const layers=new THREE.Group();root.add(layers);
  // Generate intact, globally aligned plate courses first. Cutting them avoids
  // compressed/sliver plates where an apron or partial hole meets a course.
  const first=Math.floor((start+50)/100)*100-50;
  for(let at=first;at<end;at+=100){
    const road=slabs(THREE,{width,length:100,columns:shape==='flat'?6:24,index:Math.max(0,Math.floor(at/100))});
    road.position.z=-at-50;layers.add(road);
  }
  if(shape==='inside'){
    const light=new THREE.MeshStandardMaterial({color:0xe3dfd2,emissive:0xe3dfd2,emissiveIntensity:.6});light.name='gap-course-neutral-light';
    for(let at=Math.ceil(start/25)*25;at<end;at+=25)for(const side of [-1,1]){
      const m=new THREE.Mesh(new THREE.BoxGeometry(.13,.014,2),light);m.name='neutral-course-light';m.position.set(side*half*.5,.003,-at);layers.add(m);
    }
  }
  masks.push([-half-1,half+1,-end-200,-end],[-half-1,half+1,-start,-start+200]);
  cutGapLayers(THREE,layers,masks);
  for(const gap of gaps){
    for(const [at,kind]of [[gap.start,'takeoff'],[gap.end,'landing']])if(at>=start&&at<end){
      const lip=gapEnd(THREE,{shape,kind,partial:!gap.full,wrap:false});lip.position.z=-at;root.add(lip);
    }
    if(!gap.full){
      const a=Math.max(start,gap.start),b=Math.min(end,gap.end);if(b<=a)continue;
      for(const side of [-1,1]){
        const border=gapBorder(THREE,{length:b-a});
        border.position.set(gap.center*half+side*gap.width*half,0,-(a+b)/2);
        // Rotation (not reflection) preserves front faces on both sides.
        if(side<0)border.rotation.y=Math.PI;root.add(border);
      }
    }
  }
  root.userData={shape,gaps,revision:'11-complete-set-r3'};
  bend(THREE,root,shape);
  // Bulkheads/collars already use native tube coordinates. Never feed their
  // radial geometry through the unwrapped road deformation a second time.
  if(shape!=='flat')for(const gap of gaps)for(const [at,kind]of [[gap.start,'takeoff'],[gap.end,'landing']])if(at>=start&&at<end){
    const termination=tubeTermination(THREE,{inside:shape==='inside',kind,partial:!gap.full,radius:RADIUS});
    termination.position.z=-at;root.add(termination);
  }
  return root;
}
export function gapChunk(THREE,start,shape='flat'){
  const source=gapAssembly(THREE,{shape,start,end:start+100}),root=new THREE.Group(),groups=new Map(),materials=new Map(),disposed=new Set();
  source.updateMatrixWorld(true);
  source.traverse(mesh=>{
    if(!mesh.isMesh)return;const key=mesh.material.name;
    if(!materials.has(key))materials.set(key,mesh.material);else if(materials.get(key)!==mesh.material&&!disposed.has(mesh.material)){mesh.material.dispose();disposed.add(mesh.material);}
    if(mesh.geometry.attributes.position.count){
      const g=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld);
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(g);
    }
    mesh.geometry.dispose();
  });
  for(const [key,pieces]of groups){root.add(new THREE.Mesh(mergeGeometries(pieces),materials.get(key)));pieces.forEach(g=>g.dispose());}
  for(const [key,material]of materials)if(!groups.has(key))material.dispose();
  return root;
}
