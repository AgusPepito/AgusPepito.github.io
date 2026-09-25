import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import slabs from '../../public/assets/track/slab-surface-r1.js';
import tubeSurface,{wrapTubeSurface} from '../../public/assets/track/tube-surface-r1.js';
import lane from '../../public/assets/track/phase-lane-r1.js';
import {PHASES,RADIUS,point,stripCenter} from './track.js';
import {subtractRectangles} from './gap-geometry.js';
import {SUN_DIRECTION, PLANET_DIRECTION} from './visual-settings.js';
import {finishMaterial} from './surface-finish.js';

export function slabReviewStrips(tube){
  const half=tube?Math.PI*RADIUS:18;
  return [{start:75,end:525,phase:2,from:-8/half,to:8/half,width:3.24/half}];
}
export function slabAssembly(THREE,{shape='flat',start=0,length=100,courseEnd=100,strips=[],cutRanges=[]}={}){
  const tube=shape!=='flat',inside=shape==='inside',half=tube?Math.PI*RADIUS:18;
  const root=slabs(THREE,{width:half*2,length,columns:tube?24:6,index:Math.floor((start+50)/100)});
  if(tube)root.add(tubeSurface(THREE,{inside,length,services:false,wrap:false,cutRanges:[[0,length]],startCap:start===-50||start===0,endCap:start+length===courseEnd}));
  for(const strip of strips)for(let at=strip.start;at<strip.end;at+=12.5){
    const a=Math.max(at,start),b=Math.min(at+12.5,strip.end,start+length);if(a>=b)continue;
    const module=lane(THREE,{kind:a===strip.start?'start':b===strip.end?'end':'middle',phase:strip.phase,color:PHASES[strip.phase].hex,length:b-a,width:strip.width*half*2});
    module.updateMatrixWorld(true);
    module.traverse(mesh=>{
      if(!mesh.isMesh)return;mesh.geometry.applyMatrix4(mesh.matrixWorld);
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const s=(a+b)/2-p.getZ(i);
        p.setXYZ(i,p.getX(i)+stripCenter(strip,s)*half,p.getY(i)+.012,start+length/2-s);
      }
      mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);
    });root.add(module);
  }
  const cuts=cutRanges.filter(([a,b])=>b>start&&a<start+length).map(([a,b])=>[-half-1,half+1,start+length/2-b,start+length/2-a]);
  if(cuts.length){
    root.updateMatrixWorld(true);
    root.traverse(m=>{if(m.isMesh){m.geometry.applyMatrix4(m.matrixWorld);m.geometry=subtractRectangles(THREE,m.geometry,cuts);}});
    root.traverse(m=>{m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);});
  }
  return tube?wrapTubeSurface(THREE,root,inside):root;
}
export function slabChunk(THREE,start,shape,courseEnd,strips,cutRanges=[]){
  const length=Math.min(100,courseEnd-start),result=new THREE.Group();if(length<=0)return result;
  const root=slabAssembly(THREE,{shape,start,length,courseEnd,strips,cutRanges}),groups=new Map(),materials=new Map(),disposed=new Set();
  root.updateMatrixWorld(true);
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const key=mesh.material.name;
    if(!materials.has(key))materials.set(key,mesh.material);
    else if(materials.get(key)!==mesh.material&&!disposed.has(mesh.material)){mesh.material.dispose();disposed.add(mesh.material);}
    const g=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld);
    if(shape==='flat'){
      const p=g.attributes.position;
      for(let i=0;i<p.count;i++){const world=point(start+length/2-p.getZ(i),p.getX(i)/18);p.setXYZ(i,world.x,world.y+p.getY(i),world.z);}
      g.computeVertexNormals();
    }
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(g);mesh.geometry.dispose();
  });
  for(const [key,pieces]of groups){
    const mesh=new THREE.Mesh(mergeGeometries(pieces),materials.get(key));
    if(key.startsWith('lane-r1-'))mesh.renderOrder=1;
    result.add(mesh);pieces.forEach(g=>g.dispose());
  }
  if(shape!=='flat')result.position.z=-start-length/2;
  return result;
}

const environments=new WeakMap();
export function disposeSlabEnvironment(renderer){
  environments.get(renderer)?.dispose();environments.delete(renderer);
}
export function applySlabEnvironment(THREE,renderer,root){
  let target=environments.get(renderer);
  if(!target){
    // Static orbital capture shared by all PBR finishes, without live cube captures.
    const studio=new THREE.Scene();studio.background=new THREE.Color(0x131c2b);
    const sources=[
      [SUN_DIRECTION,0xffe4c5,2.4,4,6],
      [PLANET_DIRECTION,0x84b8ec,.7,16,16],
      [new THREE.Vector3(-1,-.3,.4).normalize(),0x8398b3,.65,10,26],
    ];
    for(const [direction,color,strength,width,height] of sources){
      const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(strength),side:THREE.DoubleSide});
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
      panel.position.copy(direction).multiplyScalar(16);panel.lookAt(0,0,0);studio.add(panel);
    }
    const pmrem=new THREE.PMREMGenerator(renderer);target=pmrem.fromScene(studio,.08,.1,100);pmrem.dispose();
    studio.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});environments.set(renderer,target);
  }
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      if(!material.isMeshStandardMaterial)continue;
      finishMaterial(material);
      if(material.envMap!==target.texture){material.envMap=target.texture;material.needsUpdate=true;}
      const road=/^slab-r1-(graphite|worn|replacement|edge|fastener)$/.test(material.name);
      material.envMapIntensity=road ? .3 : .5;
      for(const map of [material.normalMap,material.roughnessMap])if(map)map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    }
  });
}
