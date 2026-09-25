import { mergeWallParts } from './wall-kit.js';

// Inspection-only grouping keeps authored part names after track deformation.
// Gameplay still merges across these families by material for fewer draw calls.
export function inspectionBatches(THREE, source, category) {
  const families=new Map(), parts=[];
  source.traverse(m=>{if(m.isMesh)parts.push(m);});
  for(const mesh of parts){
    const name=mesh.name||mesh.material.name||'Geometry';
    if(!families.has(name))families.set(name,new THREE.Group());
    families.get(name).add(mesh);
  }
  const result=new THREE.Group();
  for(const [name,group] of families){
    const merged=mergeWallParts(THREE,group,{indexed:true,worldBaked:true});
    merged.traverse(m=>{if(m.isMesh)m.name=`${category} / ${name}`;});
    result.add(merged);
  }
  return result;
}
