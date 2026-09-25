import generate from '../../../public/assets/track/phase-emitter-r1.js';
import {mountRecipeAsset} from '../recipe-runtime.js';
export default function asset(THREE,options){return mountRecipeAsset(THREE,generate(THREE,options));}
export const EMITTER_APPROACH=15;
export const EMITTER_DEPARTURE=9;
export function setEmitterColor(root,color){
  const materials=new Set();
  root.traverse(n=>{if(n.isMesh)for(const m of (Array.isArray(n.material)?n.material:[n.material]))if(m.userData.phaseTint)materials.add(m);});
  for(const m of materials){m.color.set(color);if(m.emissive)m.emissive.set(color);}
  root.userData.phaseColor=color;
}

