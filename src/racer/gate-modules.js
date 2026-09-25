import { point, section, RADIUS, trackProfileSnapshot, trackMotionAt } from './track.js';

// Translation along a fixed bank is exact for flat cross-sections even on a
// sweeping centerline: lateral positions share a normal/frame. Tube wedges rotate
// exactly only when both curvature and the centerline stay constant over the
// full station (including the finite-difference samples used by track frames).
export function gateModulePlan(gate,{moduleWidth=6,approach=15.2,departure=9.2}={}) {
  const road=section(gate.s),width=gate.width*road.halfWidth*2,count=Math.max(1,Math.round(width/moduleWidth));
  if(count<2)return {mode:'baked',reason:'Only one module'};
  // Transition review profiles use a different authored point sampler.
  if(trackProfileSnapshot().shape.startsWith('transition-'))return {mode:'baked',reason:'Authored transition profile'};
  if(road.curl!==0&&Math.abs(road.curl)!==1)return {mode:'baked',reason:'Changing cross-section'};
  const origin=point(gate.s,0),roll=trackMotionAt(gate.s).roll,a=gate.s-approach,b=gate.s+departure;
  for(let s=a;s<=b+.001;s=Math.min(s+.25,b)){
    const at=section(s);
    if(at.curl!==road.curl||at.halfWidth!==road.halfWidth)return {mode:'baked',reason:'Station overlaps a shape transition'};
    if(Math.abs(trackMotionAt(s).roll-roll)>1e-9)return {mode:'baked',reason:'Station banks along its length'};
    if(road.curl!==0){
      const p=point(s,0);
      if(Math.abs(p.x-origin.x)>1e-9||Math.abs(p.y-origin.y)>1e-9)return {mode:'baked',reason:'Tube centerline bends through this station'};
    }
    if(s===b)break;
  }
  return {mode:road.curl===0?'flat-modules':'tube-wedges',count,pitch:width/count,roll,
    curvature:road.curl/RADIUS,axisX:origin.x-(road.curl===0?0:Math.sin(roll)*RADIUS/road.curl),
    axisY:origin.y+(road.curl===0?0:Math.cos(roll)*RADIUS/road.curl)};
}

// Input has already been deformed and batched. A single strip's geometry is
// retained per material (or per inspection family). The full-width transparent
// curtain remains on its original path. Nested instances are flattened by
// multiplying their existing matrices, without expanding their geometry.
export function repeatGateModule(THREE,source,plan){
  const result=new THREE.Group(),meshes=[];
  source.traverse(m=>{if(m.isMesh)meshes.push(m);});
  const repeat=new THREE.Matrix4(),local=new THREE.Matrix4(),combined=new THREE.Matrix4();
  for(const part of meshes){
    if(part.material.name.endsWith('-curtain')){result.add(part);continue;}
    const perModule=part.isInstancedMesh?part.count:1;
    const mesh=new THREE.InstancedMesh(part.geometry,part.material,perModule*plan.count);
    mesh.name=part.name||part.material.name;mesh.renderOrder=part.renderOrder;
    mesh.castShadow=part.castShadow;mesh.receiveShadow=part.receiveShadow;mesh.frustumCulled=part.frustumCulled;
    for(let i=0;i<plan.count;i++){
      if(plan.mode==='flat-modules')repeat.makeTranslation(i*plan.pitch*Math.cos(plan.roll),i*plan.pitch*Math.sin(plan.roll),0);
      else{
        const angle=i*plan.pitch*plan.curvature,c=Math.cos(angle),s=Math.sin(angle);
        repeat.makeRotationZ(angle);
        repeat.setPosition(plan.axisX-c*plan.axisX+s*plan.axisY,plan.axisY-s*plan.axisX-c*plan.axisY,0);
      }
      for(let j=0;j<perModule;j++){
        if(part.isInstancedMesh)part.getMatrixAt(j,local);else local.identity();
        mesh.setMatrixAt(i*perModule+j,combined.multiplyMatrices(repeat,local));
      }
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();result.add(mesh);
    if(part.isInstancedMesh)part.dispose();
  }
  return result;
}
