import checkpoint,{CHECKPOINT_HALF_LENGTH} from '../../public/assets/track/checkpoint-r1.js';
import {wrapTubeSurface} from '../../public/assets/track/tube-surface-r1.js';
import {subdivideAcross} from './gap-geometry.js';
import {mergeWallParts,wallHalfWidth} from './wall-kit.js';
import {slabAssembly} from './slab-kit.js';

export const CHECKPOINT_REVIEW_AT=350;
export const CHECKPOINT_REVIEW_LENGTH=950;
export const checkpointCutRanges=(stations=[CHECKPOINT_REVIEW_AT])=>stations.map(s=>[s-CHECKPOINT_HALF_LENGTH,s+CHECKPOINT_HALF_LENGTH]);
export function checkpointAssembly(THREE,{shape='flat',width=wallHalfWidth(shape)*2,projection=true,road=false,merge=true}={}){
  const source=checkpoint(THREE,{width,projection});
  if(shape!=='flat'){
    source.updateMatrixWorld(true);
    source.traverse(m=>{
      if(!m.isMesh)return;
      m.geometry.applyMatrix4(m.matrixWorld);m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);
      if(m.name!=='checkpoint-white-curtain')m.geometry=subdivideAcross(THREE,m.geometry,.25);
    });
    wrapTubeSurface(THREE,source,shape==='inside');
  }
  const hardware=merge?mergeWallParts(THREE,source):source;
  hardware.traverse(m=>{if(m.isMesh){if(!m.name)m.name=m.material.name;if(m.material.name.endsWith('-curtain'))m.renderOrder=2;}});
  const root=new THREE.Group();root.name=`${shape}-checkpoint-r1`;root.add(hardware);
  if(road)root.add(slabAssembly(THREE,{shape,length:70,courseEnd:70,cutRanges:[[35-CHECKPOINT_HALF_LENGTH,35+CHECKPOINT_HALF_LENGTH]]}));
  return root;
}
export function checkpointStation(THREE,shape,station=CHECKPOINT_REVIEW_AT){const root=checkpointAssembly(THREE,{shape});root.position.z=-station;return root;}
