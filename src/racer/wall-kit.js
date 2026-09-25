import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import wall from './recipe-assets/buttressed-wall-r1.js';
import {subdivideAcross} from './gap-geometry.js';
import {slabAssembly} from './slab-kit.js';
import {indexGeometry,mergeIndexedGeometries} from './compact-geometry.js';

export const WALL_REVIEW_LENGTH=1800;
export const wallHalfWidth=shape=>shape==='flat'?18:Math.PI*18;
export function wallReviewObstacles(shape='flat'){
  const half=wallHalfWidth(shape);
  return [[350,0,9],[800,.42,18],[1250,shape==='flat'?-.35:.96,22.5]].map(([s,center,width])=>({s,center,width:width/2/half,kind:'wall',height:7,depth:5}));
}
export function wallAssembly(THREE,{shape='flat',width=18,center=0,startCap=true,endCap=true,signals=true}={}){
  const root=wall(THREE,{width,startCap,endCap,signals});
  conformWallParts(THREE,root,{shape,center});root.name=`${shape}-repeatable-wall-r2`;root.userData.shape=shape;return root;
}
export function conformWallParts(THREE,root,{shape='flat',center=0}={}){
  root.position.x=center;
  root.updateMatrixWorld(true);
  const k=shape==='flat'?0:(shape==='inside'?1:-1)/18;
  root.traverse(m=>{
    if(!m.isMesh)return;m.geometry.applyMatrix4(m.matrixWorld);
    if(k){
      if(!m.userData.wallRigid)m.geometry=subdivideAcross(THREE,m.geometry,.25);
      m.geometry.computeBoundingBox();const anchor=m.geometry.boundingBox.getCenter(new THREE.Vector3());
      const p=m.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=(m.userData.wallRigid?anchor.x:x)*k,sn=Math.sin(a),cs=Math.cos(a);
        if(m.userData.wallRigid)p.setXYZ(i,sn/k-y*sn+(x-anchor.x)*cs,(1-cs)/k+y*cs-(x-anchor.x)*sn,z);
        else p.setXYZ(i,sn/k-y*sn,(1-cs)/k+y*cs,z);
      }
      m.geometry.computeVertexNormals();
    }
    m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);
  });
  root.traverse(n=>{if(!n.isMesh){n.position.set(0,0,0);n.rotation.set(0,0,0);n.scale.set(1,1,1);}});return root;
}
export function wallObstacle(THREE,obstacle,shape){
  const half=wallHalfWidth(shape),source=wallAssembly(THREE,{shape,width:obstacle.width*half*2,center:obstacle.center*half});
  const result=mergeWallParts(THREE,source);result.position.z=-obstacle.s;return result;
}
export function mergeWallParts(THREE,source,{indexed=false,timings=null,worldBaked=false}={}){
  const result=new THREE.Group(),groups=new Map(),materials=new Map(),discarded=new Set(),instances=[];
  source.updateMatrixWorld(true);
  source.traverse(m=>{
    if(!m.isMesh)return;
    // Instance matrices already place these rigid parts in world coordinates.
    // Keep them separate from the material-batched, fully deformed geometry.
    if(m.isInstancedMesh){instances.push(m);return;}
    const key=m.material.name;
    if(!materials.has(key))materials.set(key,m.material);else if(materials.get(key)!==m.material)discarded.add(m.material);
    const began=timings?performance.now():0;
    // worldBaked is only used for owned campaign meshes whose transforms were
    // already applied/reset by mountCourseSurface. Consume them without cloning
    // or transforming all positions/normals through the identity matrix again.
    const g=indexed&&worldBaked?indexGeometry(THREE,m.geometry)
      :(indexed?indexGeometry(THREE,m.geometry.clone()):m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrixWorld);
    if(timings)timings.indexCopyMs=(timings.indexCopyMs??0)+performance.now()-began;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(g);m.geometry.dispose();
  });
  const mergeBegan=timings?performance.now():0;
  for(const [key,pieces]of groups){result.add(new THREE.Mesh(indexed?mergeIndexedGeometries(THREE,pieces):mergeGeometries(pieces),materials.get(key)));pieces.forEach(g=>g.dispose());}
  for(const mesh of instances){
    const shared=materials.get(mesh.material.name);
    if(shared)mesh.material=shared;
    result.add(mesh);
  }
  if(timings)timings.mergeBuffersMs=performance.now()-mergeBegan;
  discarded.forEach(m=>m.dispose());return result;
}
export function wallRoadStudy(THREE,{shape='flat'}={}){
  const root=new THREE.Group();root.add(slabAssembly(THREE,{shape,length:30,courseEnd:30}));
  root.add(wallAssembly(THREE,{shape,width:18}));return root;
}
