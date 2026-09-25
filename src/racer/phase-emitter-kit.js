import emitter,{setEmitterColor,EMITTER_APPROACH,EMITTER_DEPARTURE} from '../../public/assets/track/phase-emitter-r1.js';
import {wrapTubeSurface} from '../../public/assets/track/tube-surface-r1.js';
import {subdivideAcross} from './gap-geometry.js';
import {mergeWallParts,wallHalfWidth} from './wall-kit.js';
import {slabAssembly} from './slab-kit.js';
import {PHASES} from './track.js';

export {setEmitterColor};
export const EMITTER_REVIEW_LENGTH=1800;
export function emitterReviewGates(){return [350,850,1350].map((s,phase)=>({s,phase,center:0,width:1,full:true}));}
export const emitterCutRanges=gates=>gates.map(g=>[g.s-EMITTER_APPROACH,g.s+EMITTER_DEPARTURE]);

export function emitterAssembly(THREE,{shape='flat',width=wallHalfWidth(shape)*2,phase=0,color=PHASES[phase].hex,projection=true,road=false,merge=false}={}){
  const source=emitter(THREE,{width,color,projection});
  if(shape!=='flat'){
    source.updateMatrixWorld(true);
    source.traverse(m=>{
      if(!m.isMesh)return;
      m.geometry.applyMatrix4(m.matrixWorld);m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);
      // The curtain already has a fine circumference grid and vertex colors.
      if(m.name!=='phase-projection-curtain')m.geometry=subdivideAcross(THREE,m.geometry,.25);
    });
    wrapTubeSurface(THREE,source,shape==='inside');
  }
  const hardware=merge?mergeWallParts(THREE,source):source;
  hardware.traverse(m=>{if(m.isMesh){if(!m.name)m.name=m.material.name;if(m.material.name.endsWith('-curtain'))m.renderOrder=2;}});
  const root=new THREE.Group();root.name=`${shape}-phase-emitter-r1`;root.add(hardware);
  if(road){
    // A full-width station replaces the slab layers instead of hiding beneath them.
    // The gate crosses at road S=24: +Z=approach, -Z=departure.
    root.add(slabAssembly(THREE,{shape,start:0,length:48,courseEnd:48,cutRanges:emitterCutRanges([{s:24}])}));
  }
  root.userData={shape,phase,phaseColor:color};return root;
}
export function emitterGate(THREE,gate,shape){
  const root=emitterAssembly(THREE,{shape,width:wallHalfWidth(shape)*2*gate.width,phase:gate.phase,merge:true});
  root.position.z=-gate.s;return root;
}
