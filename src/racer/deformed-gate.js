import {subdivide,mountCourseSurface} from './course-surface.js';
import {isRigidPart} from './rigid-instances.js';
import {section,point,trackProfileSnapshot} from './track.js';
import {mergeWallParts} from './wall-kit.js';
import {inspectionBatches} from './inspection-batches.js';

// The shader supports the campaign's analytic profiles. Authored review curves
// keep their existing CPU sampler rather than silently changing their shape.
export function canDeformGate(){return ['mixed','flat','gap-flat','inside','outside'].includes(trackProfileSnapshot().shape);}

export function deformGateModule(THREE,source,gate,{inspect=false,timings=null}={}){
  const began=performance.now(),half=section(gate.s).halfWidth,width=gate.width*half*2;
  const count=Math.max(1,Math.round(width/6)),pitch=width/count;
  const curtain=new THREE.Group(),hardware=new THREE.Group();
  for(const child of [...source.children]) (child.material?.name.endsWith('-curtain')?curtain:hardware).add(child);
  hardware.updateMatrixWorld(true);
  hardware.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    const rigid=isRigidPart(mesh);let anchor=new THREE.Vector3();
    if(rigid){mesh.geometry.computeBoundingBox();mesh.geometry.boundingBox.getCenter(anchor);}
    else{
      mesh.geometry=subdivide(THREE,mesh.geometry,0,.4);
      mesh.geometry=subdivide(THREE,mesh.geometry,2,2);
    }
    mesh.geometry.computeVertexNormals();
    const p=mesh.geometry.attributes.position,anchors=new Float32Array(p.count*4);
    if(rigid)for(let i=0;i<p.count;i++)anchors.set([anchor.x,anchor.y,anchor.z,1],i*4);
    mesh.geometry.setAttribute('gateAnchor',new THREE.BufferAttribute(anchors,4));
  });
  hardware.traverse(n=>{n.position.set(0,0,0);n.rotation.set(0,0,0);n.scale.set(1,1,1);});
  // The curtain has no repeated hardware; keep its existing CPU deformation.
  mountCourseSurface(THREE,curtain,gate.s,half,{center:()=>gate.center,cacheFrames:true});
  const prepared=performance.now();
  const merged=inspect?inspectionBatches(THREE,hardware,'Gate'):mergeWallParts(THREE,hardware,{indexed:true,worldBaked:true});
  const result=new THREE.Group(),parts=[];merged.traverse(m=>{if(m.isMesh)parts.push(m);});
  // Conservative world-space bounds for shader-displaced geometry. These also
  // travel in the worker packet so culling and inspector fitting see the gate.
  const bounds=new THREE.Box3();
  for(let s=gate.s-16;s<=gate.s+10;s+=.5)for(let i=0;i<=64;i++)bounds.expandByPoint(point(s,gate.center-gate.width+2*gate.width*i/64));
  bounds.expandByScalar(3);
  const profile=trackProfileSnapshot();
  for(const part of parts){
    part.material.userData.trackDeform={station:gate.s,half,center:gate.center,length:profile.length,profile:profile.shape};
    const mesh=new THREE.InstancedMesh(part.geometry,part.material,count),matrix=new THREE.Matrix4();
    mesh.name=part.name||part.material.name;
    for(let i=0;i<count;i++)mesh.setMatrixAt(i,matrix.makeTranslation(i*pitch,0,0));
    mesh.instanceMatrix.needsUpdate=true;mesh.boundingBox=bounds.clone();mesh.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
    result.add(mesh);
  }
  result.add(inspect?inspectionBatches(THREE,curtain,'Gate'):mergeWallParts(THREE,curtain,{indexed:true,worldBaked:true}));
  result.traverse(m=>{if(m.isMesh&&m.material.name.endsWith('-curtain'))m.renderOrder=2;});
  result.userData.gateModules={mode:'deformed-modules',count,pitch,deformation:'vertex-shader',profile:profile.shape};
  if(timings)Object.assign(timings,{conformMs:prepared-began,mergeMs:performance.now()-prepared,modulePlan:result.userData.gateModules});
  return result;
}
