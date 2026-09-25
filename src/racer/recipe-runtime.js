import {surfaceMaps} from './recipe-surface-maps.js';
import {installPhaseField} from '../../public/assets/track/phase-field-r1.js';
import {installObstacleLight} from '../../public/assets/track/obstacle-lights-r1.js';

// Recipe modules describe geometry and flat-colour materials. The game owns
// surface finishes, animated effects and the original course mounting frame.
export function applyRecipeMaterial(THREE, source) {
  let material=source;
  const effect=source.userData.recipeEffect;
  if(effect?.unlit&&!source.isMeshBasicMaterial){
    material=new THREE.MeshBasicMaterial();
    THREE.Material.prototype.copy.call(material,source);
    material.color.copy(source.color);
    material.fog=source.fog;
    material.wireframe=source.wireframe;
    material.vertexColors=Boolean(effect.vertexColors);
    source.dispose();
  }else if(source.userData.recipeVertexColors){
    material.vertexColors=true;
  }
  if(material.userData.recipeSurface)Object.assign(material,surfaceMaps(THREE));
  installPhaseField(THREE,material);
  installObstacleLight(THREE,material);
  return material;
}

export function mountRecipeAsset(THREE, root) {
  const offset=root.userData.recipeOriginOffset;
  if(offset){
    // Undo only the contract's origin translation, before course deformation.
    // Do not add another parent: existing callers inspect direct child parts.
    for(const child of root.children){
      child.position.x-=offset[0];child.position.y-=offset[1];child.position.z-=offset[2];
    }
    delete root.userData.recipeOriginOffset;
  }
  const materials=new Map();
  const finish=source=>{
    if(!materials.has(source))materials.set(source,applyRecipeMaterial(THREE,source));
    return materials.get(source);
  };
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(finish):finish(mesh.material);
  });
  return root;
}
