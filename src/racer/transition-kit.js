import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import slabs from './recipe-assets/slab-surface-r1.js';
import serviceBelt from './recipe-assets/tube-service-belt-r2.js';
import lane from './recipe-assets/phase-lane-r1.js';
import {TRANSITION_COURSES,transitionSection,transitionFrame} from './transition-profile.js';

export const TRANSITION_SERVICES={
  '09':[[300,'pipe'],[500,'cooling'],[800,'access'],[1150,'armor'],[1350,'pipe']],
  '10':[[300,'pipe'],[500,'cooling'],[800,'access'],[1100,'cooling'],[1300,'armor'],[1850,'pipe'],[2150,'access'],[2500,'cooling']],
};
export function transitionStrips(category){return [{start:75,end:TRANSITION_COURSES[category].length-75,phase:category==='09'?0:2,from:0,to:0,width:.18,widthMeters:6.48}];}

// Plate/frame faces follow the actual surface. Discrete fittings use one rigid
// tangent frame, retaining their proportions through changing road width.
function deform(THREE,root,category,center,half,{lanePart=false}={}){
  const connectors=[];
  root.updateMatrixWorld(true);
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    const p=mesh.geometry.attributes.position;
    const rigid=/fastener|captive-hex|conduit|coupling|valve|hinge|door-lock|door-handle|release-catch|function-stencil|identification-plaque|manifold/.test(mesh.name);
    let local,pose;
    if(rigid){mesh.geometry.computeBoundingBox();local=mesh.geometry.boundingBox.getCenter(new THREE.Vector3());pose=transitionFrame(THREE,category,center-local.z,local.x/(lanePart?transitionSection(category,center-local.z).halfWidth:half));}
    if(mesh.name==='broad-service-conduit'){
      const bounds=mesh.geometry.boundingBox,radius=(bounds.max.x-bounds.min.x)/2;
      for(const sign of [-1,1]){
        const z=sign>0?bounds.max.z:bounds.min.z;
        const a=pose.p.clone().addScaledVector(pose.normal,local.y).addScaledVector(pose.forward,-(z-local.z));
        const endFrame=transitionFrame(THREE,category,center-z-sign*.4,local.x/half);
        const b=endFrame.p.addScaledVector(endFrame.normal,local.y);
        connectors.push({a,b,radius,material:mesh.material});
      }
    }
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=center-z;
      if(rigid){
        const v=pose.p.clone().addScaledVector(pose.right,x-local.x).addScaledVector(pose.normal,y).addScaledVector(pose.forward,-(z-local.z));
        p.setXYZ(i,v.x,v.y,v.z);
      }else{
        const u=lanePart?x/transitionSection(category,s).halfWidth:x/half;
        const f=transitionFrame(THREE,category,s,u),v=f.p.addScaledVector(f.normal,y);
        p.setXYZ(i,v.x,v.y,v.z);
      }
    }
    mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);mesh.geometry.computeVertexNormals();
  });
  root.traverse(n=>{if(!n.isMesh){n.position.set(0,0,0);n.rotation.set(0,0,0);n.scale.set(1,1,1);}});
  for(const {a,b,radius,material}of connectors){
    const curve=new THREE.LineCurve3(a,b),axis=b.clone().sub(a).normalize();
    const hose=new THREE.Mesh(new THREE.TubeGeometry(curve,4,radius,10,false),material);hose.name='articulated-conduit-end-sleeve';root.add(hose);
    for(let i=0;i<5;i++){
      const cuff=new THREE.Mesh(new THREE.TorusGeometry(radius+.018,.022,5,10),material);cuff.name='flexible-coupling-bellows';cuff.position.lerpVectors(a,b,(i+.5)/5);cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);root.add(cuff);
    }
  }
  return root;
}
function surfaceStrip(THREE,category,start,end,left,right,height,material,name){
  const count=Math.max(1,Math.ceil((end-start)/.5)),p=[],uv=[],indices=[];
  const across=Math.max(1,Math.ceil(Math.max(...[start,(start+end)/2,end].map(s=>Math.abs(right(s)-left(s))*transitionSection(category,s).halfWidth))/.3));
  for(let i=0;i<=count;i++){
    const s=start+(end-start)*i/count;
    for(let j=0;j<=across;j++){
      const t=j/across,u=left(s)+(right(s)-left(s))*t;
      const f=transitionFrame(THREE,category,s,u),v=f.p.addScaledVector(f.normal,typeof height==='function'?height(s,t):height);
      p.push(v.x,v.y,v.z);uv.push(u,s/4);
    }
  }
  for(let i=0;i<count;i++)for(let j=0;j<across;j++){const a=i*(across+1)+j,b=a+across+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material);mesh.name=name;return mesh;
}
function serviceCourse(THREE,category,at,variant){
  const center=at+6.25,half=transitionSection(category,center).halfWidth,columns=Math.max(8,Math.round(half*2/4.71)),cell=half*2/columns;
  const belt=serviceBelt(THREE,{radius:half/Math.PI,columns,variant,offset:Math.floor(at/50)%6,articulated:true});
  // Replace whole central cartridges with quiet plates. Their real opening is
  // wide enough for the lane at both ends of this course; no machinery under it.
  const clear=3.7*half/Math.min(transitionSection(category,at).halfWidth,transitionSection(category,at+12.5).halfWidth);
  const removed=new Set(),kept=new Set(),missing=new Set();belt.updateMatrixWorld(true);
  for(const mesh of [...belt.children]){
    const col=mesh.userData.serviceColumn;
    const lo=-half+col*cell,hi=lo+cell;
    if(lo<clear&&hi>-clear){missing.add(col);removed.add(mesh.material);mesh.geometry.dispose();belt.remove(mesh);}else kept.add(mesh.material);
  }
  for(const mat of removed)if(!kept.has(mat))mat.dispose();
  for(const col of missing){
    const plate=slabs(THREE,{width:cell,length:12,columns:1,index:col});
    plate.position.x=-half+(col+.5)*cell;
    // The belt authoring uses a six-metre source scaled to twelve metres.
    plate.scale.z=.5;belt.add(plate);
  }
  return deform(THREE,belt,category,center,half);
}

export function transitionAssembly(THREE,{category='09',start=0,length=100,services=true,lanes=true,parts='all'}={}){
  const root=new THREE.Group();root.name=`transition-${category}-r1`;
  const ivory=new THREE.MeshStandardMaterial({color:0xc6c9c3,roughness:.57,metalness:.25});ivory.name='transition-ivory';
  const steel=new THREE.MeshStandardMaterial({color:0x64747b,roughness:.42,metalness:.65,side:THREE.DoubleSide});steel.name='transition-steel';
  const dark=new THREE.MeshStandardMaterial({color:0x11191e,roughness:.8});dark.name='transition-joint';
  const lamp=new THREE.MeshStandardMaterial({color:0xe4dfd1,emissive:0xe4dfd1,emissiveIntensity:.55});lamp.name='transition-neutral-lamp';
  const end=start+length,serviceMap=new Map(TRANSITION_SERVICES[category]);
  if(parts==='all'||parts==='skin'||parts==='services')for(let at=start;at<end;at+=12.5){
    const span=Math.min(12.5,end-at),center=at+span/2,half=transitionSection(category,center).halfWidth;
    const variant=services&&span===12.5&&serviceMap.get(at);
    if(variant){
      root.add(serviceCourse(THREE,category,at,variant));
      for(const [a,b]of [[at,at+.25],[at+12.25,at+12.5]])root.add(surfaceStrip(THREE,category,a,b,()=>-1,()=>1,-.02,steel,'service-course-end-seat'));
    }else if(parts!=='services'){
      const asset=slabs(THREE,{width:half*2,length:span,columns:Math.max(6,Math.round(half*2/5.5)),index:Math.floor(at/12.5)});
      for(const n of [...asset.children])if(n.name==='flush-ivory-edge-trim'){asset.remove(n);n.geometry.dispose();}
      root.add(deform(THREE,asset,category,center,half));
    }
  }
  if(parts==='all'||parts==='trim'){
    // Two inward-facing half trims meet once at closure. No overlapping roof cap.
    for(const side of [-1,1]){
      const edge=s=>side,inner=s=>side*(1-.24/transitionSection(category,s).halfWidth);
      root.add(surfaceStrip(THREE,category,start,end,s=>Math.min(edge(s),inner(s)),s=>Math.max(edge(s),inner(s)),.008,ivory,'converging-ivory-edge-trim'));
      const joint=s=>side*(1-.29/transitionSection(category,s).halfWidth);
      root.add(surfaceStrip(THREE,category,start,end,s=>Math.min(inner(s),joint(s)),s=>Math.max(inner(s),joint(s)),.003,dark,'edge-expansion-gasket'));
      root.add(surfaceStrip(THREE,category,start,end,edge,edge,(s,t)=>.008-(1-t)*.18*(1-Math.abs(transitionSection(category,s).curl)),steel,'tapered-exposed-edge-fascia'));
    }
    for(let s=Math.ceil(start/50)*50;s<end;s+=50){
      root.add(surfaceStrip(THREE,category,s,Math.min(s+.2,end),()=>-1,()=>1,.002,ivory,'curvature-following-flush-band'));
    }
    // Quiet neutral shoulder markers continue into the inner ceiling/walls.
    for(let s=Math.ceil(start/25)*25+9;s+1<end;s+=25)for(const side of [-1,1]){
      if(services&&serviceMap.has(Math.floor(s/12.5)*12.5))continue;
      const mid=side*.84;
      root.add(surfaceStrip(THREE,category,s,s+1,x=>mid-.06/transitionSection(category,x).halfWidth,x=>mid+.06/transitionSection(category,x).halfWidth,.014,lamp,'recessed-neutral-orientation-light'));
    }
  }
  if(lanes&&(parts==='all'||parts==='lane'))for(const strip of transitionStrips(category))for(let at=strip.start;at<strip.end;at+=12.5){
    const a=Math.max(start,at),b=Math.min(end,at+12.5,strip.end);if(a>=b)continue;
    const module=lane(THREE,{kind:a===strip.start?'start':b===strip.end?'end':'middle',phase:strip.phase,length:b-a,width:strip.widthMeters});
    root.add(deform(THREE,module,category,(a+b)/2,1,{lanePart:true}));
  }
  const used=new Set();root.traverse(n=>{if(n.isMesh)used.add(n.material);});
  for(const mat of [ivory,steel,dark,lamp])if(!used.has(mat))mat.dispose();
  root.userData={category,start,length,revision:'transition-r1',visibility:'Surface plates, shallow service recesses, flush trim and exposed fittings. No buried skeleton or portal.'};
  return root;
}
export function transitionChunk(THREE,category,start){
  const length=Math.min(100,TRANSITION_COURSES[category].length-start);if(length<=0)return new THREE.Group();
  const source=transitionAssembly(THREE,{category,start,length}),root=new THREE.Group(),groups=new Map(),mats=new Map(),disposed=new Set();
  source.updateMatrixWorld(true);
  source.traverse(mesh=>{
    if(!mesh.isMesh)return;const key=mesh.material.name;
    if(!mats.has(key))mats.set(key,mesh.material);else if(mats.get(key)!==mesh.material&&!disposed.has(mesh.material)){mesh.material.dispose();disposed.add(mesh.material);}
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push((mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));mesh.geometry.dispose();
  });
  for(const [key,pieces]of groups){const mesh=new THREE.Mesh(mergeGeometries(pieces),mats.get(key));if(key.startsWith('lane-r1-'))mesh.renderOrder=1;root.add(mesh);pieces.forEach(g=>g.dispose());}
  return root;
}
