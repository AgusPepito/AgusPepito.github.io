// Only parts already mounted with a single rigid track frame are eligible.
// Deformed panels, washers, pipes and cables keep their existing vertex path.
export const isRigidPart = mesh => mesh.userData.wallRigid || /fastener|captive-hex|door-lock|door-handle/.test(mesh.name);

function attributes(g) {
  return [...Object.keys(g.attributes).sort().map(name => [name,g.attributes[name]]), ['index',g.index]].filter(([,a])=>a);
}
function fingerprint(g) {
  let hash=2166136261;
  for (const [name,a] of attributes(g)) {
    if (a.isInterleavedBufferAttribute) return null;
    const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);
    for (const byte of bytes) hash=Math.imul(hash^byte,16777619);
    for (const ch of `${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`) hash=Math.imul(hash^ch.charCodeAt(0),16777619);
  }
  return hash>>>0;
}
function sameGeometry(a,b) {
  const aa=attributes(a),bb=attributes(b);
  if(aa.length!==bb.length)return false;
  return aa.every(([name,x],i)=>{
    const [other,y]=bb[i];
    if(name!==other||x.itemSize!==y.itemSize||x.normalized!==y.normalized||x.array.constructor!==y.array.constructor||x.array.byteLength!==y.array.byteLength)return false;
    const xb=new Uint8Array(x.array.buffer,x.array.byteOffset,x.array.byteLength),yb=new Uint8Array(y.array.buffer,y.array.byteOffset,y.array.byteLength);
    return xb.every((v,j)=>v===yb[j]);
  });
}

export function collectRigidInstances(THREE,root) {
  const buckets=new Map(), membership=new Map();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||!isRigidPart(mesh)||Array.isArray(mesh.material)||mesh.material.transparent||!mesh.visible||mesh.matrixWorld.determinant()<=0)return;
    const hash=fingerprint(mesh.geometry);
    if(hash===null)return;
    const key=`${mesh.material.uuid}:${mesh.renderOrder}:${mesh.castShadow}:${mesh.receiveShadow}:${mesh.frustumCulled}:${hash}`;
    let bucket=buckets.get(key);if(!bucket){bucket=[];buckets.set(key,bucket);}
    let group=bucket.find(g=>sameGeometry(g.source,mesh.geometry));
    if(!group){group={source:mesh.geometry,parts:[],matrices:[],material:mesh.material};bucket.push(group);}
    group.parts.push(mesh);
  });
  const groups=[...buckets.values()].flat().filter(group=>group.parts.length>=32);
  for(const group of groups){
    group.geometry=group.source.clone();group.geometry.computeVertexNormals();
    for(const mesh of group.parts)membership.set(mesh,group);
  }
  const transform=new THREE.Matrix4(),basis=new THREE.Matrix4(),back=new THREE.Vector3(),offset=new THREE.Vector3();
  const vertex=new THREE.Vector3(),box=new THREE.Box3(),anchor=new THREE.Vector3();
  return {
    // Find the same bounding-box center used by the old baked rigid path.
    anchor(mesh){
      box.makeEmpty();const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        vertex.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
        // applyMatrix4 previously wrote these coordinates to Float32 attributes.
        vertex.set(Math.fround(vertex.x),Math.fround(vertex.y),Math.fround(vertex.z));box.expandByPoint(vertex);
      }
      return box.getCenter(anchor);
    },
    has:mesh=>membership.has(mesh),
    add(mesh,pose,anchor){
      back.copy(pose.forward).negate();basis.makeBasis(pose.right,pose.normal,back);
      offset.copy(pose.p).addScaledVector(pose.right,-anchor.x).addScaledVector(pose.forward,anchor.z);
      basis.setPosition(offset);transform.multiplyMatrices(basis,mesh.matrixWorld);
      membership.get(mesh).matrices.push(transform.clone());
    },
    finish(){
      const output=[];
      for(const group of groups){
        const first=group.parts[0],mesh=new THREE.InstancedMesh(group.geometry,group.material,group.parts.length);
        mesh.name=`shared-${first.name}`;mesh.renderOrder=first.renderOrder;
        mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.frustumCulled=first.frustumCulled;
        group.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
        mesh.computeBoundingBox();mesh.computeBoundingSphere();
        for(const part of group.parts)part.removeFromParent();
        new Set(group.parts.map(part=>part.geometry)).forEach(g=>g.dispose());
        root.add(mesh);output.push(mesh);
      }
      return output;
    },
  };
}
