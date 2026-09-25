import passage,{PASSAGE_JAMB_WIDTH} from '../../public/assets/track/service-passage-r1.js';
import {wallAssembly,conformWallParts,mergeWallParts,wallHalfWidth} from './wall-kit.js';
import {slabAssembly} from './slab-kit.js';
import {HOLE_HEIGHT} from './obstacles.js';

export function passageReviewObstacles(shape='flat'){
  const half=wallHalfWidth(shape),centers=shape==='flat'?[0,4.5,-4.5]:[0,12,half*.94];
  return centers.map((x,i)=>({s:350+i*500,kind:'hole',center:x/half,width:5/half,depth:5,height:7}));
}
export function passageAssembly(THREE,{shape='flat',opening=10,center=0,infill=false,road=false,part='all',halfWidth=wallHalfWidth(shape),closed=shape!=='flat'}={}){
  const root=new THREE.Group();root.name=`${shape}-p3-passage-r1`;
  const frame=passage(THREE,{opening,clearance:HOLE_HEIGHT});
  if(part!=='all'){
    const kept=new Set(),removed=new Set();
    for(const m of [...frame.children]){
      m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;
      const x=(b.min.x+b.max.x)/2+m.position.x;
      const keep=part==='lintel'?Math.abs(x)<opening/2:part==='left-jamb'?x<=-opening/2:x>=opening/2;
      if(keep)kept.add(m.material);else{frame.remove(m);m.geometry.dispose();removed.add(m.material);}
    }
    removed.forEach(m=>{if(!kept.has(m))m.dispose();});
  }
  root.add(conformWallParts(THREE,frame,{shape,center}));
  if(infill){
    const half=halfWidth,reach=opening/2+PASSAGE_JAMB_WIDTH;
    // One continuous run around a closed tube avoids extra terminal caps at
    // the periodic seam, even when the passage itself crosses that seam.
    const runs=!closed?[[-half,center-reach],[center+reach,half]]:[[center+reach,center+2*half-reach]];
    for(const [a,b]of runs)if(b>a){
      root.add(wallAssembly(THREE,{shape,width:b-a,center:(a+b)/2,startCap:!closed&&a===-half,endCap:!closed&&b===half}));
    }
  }
  if(road)root.add(slabAssembly(THREE,{shape,length:35,courseEnd:35}));
  root.userData={opening,clearance:HOLE_HEIGHT,center,shape,infill};return root;
}
export function passageObstacle(THREE,obstacle,shape){
  const half=wallHalfWidth(shape),source=passageAssembly(THREE,{shape,opening:obstacle.width*half*2,center:obstacle.center*half,infill:true});
  const result=mergeWallParts(THREE,source);result.position.z=-obstacle.s;return result;
}
