import barrier,{compactPassage,COMPACT_JAMB_WIDTH} from '../../public/assets/track/jump-barrier-r1.js';
import {wallHalfWidth,conformWallParts,mergeWallParts} from './wall-kit.js';
import {passageAssembly} from './passage-kit.js';
import {slabAssembly} from './slab-kit.js';
import {HOLE_HEIGHT,WALL_HEIGHT} from './obstacles.js';

export const OBSTACLE_REVIEW_LENGTH=2100;
export function obstacleReviewSequence(shape='flat'){
  const half=wallHalfWidth(shape);
  return [
    {s:350,kind:'hole',center:0,width:5/half,height:WALL_HEIGHT,depth:5},
    {s:850,kind:'hole',center:(shape==='flat'?4.5:12)/half,width:5/half,height:4.2,depth:5},
    {s:1350,kind:'jump',center:0,width:1,height:2.4,depth:5},
    {s:1800,kind:'hole',center:shape==='flat'?-.25:.96,width:5/half,height:4.2,depth:5},
  ];
}
export function barrierAssembly(THREE,{shape='flat',width=18,center=0,height=2.4,startCap=true,endCap=true}={}){
  const root=barrier(THREE,{width,height,startCap,endCap});
  conformWallParts(THREE,root,{shape,center});root.name=`${shape}-j3-louver-bank`;return root;
}
export function obstacleAssembly(THREE,{shape='flat',type='jump-only',opening=10,center=0,road=false,halfWidth=wallHalfWidth(shape),closed=shape!=='flat'}={}){
  const root=new THREE.Group(),half=halfWidth;
  root.name=`${shape}-${type}-assembly`;
  if(type==='opening-only')root.add(passageAssembly(THREE,{shape,opening,center,infill:true,halfWidth,closed}));
  else if(type==='jump-only')root.add(barrierAssembly(THREE,{shape,width:half*2,startCap:!closed,endCap:!closed}));
  else{
    root.add(conformWallParts(THREE,compactPassage(THREE,{opening,clearance:HOLE_HEIGHT,height:4.2}),{shape,center}));
    const reach=opening/2+COMPACT_JAMB_WIDTH;
    const runs=!closed?[[-half,center-reach],[center+reach,half]]:[[center+reach,center+half*2-reach]];
    for(const [a,b]of runs)if(b>a)root.add(barrierAssembly(THREE,{shape,width:b-a,center:(a+b)/2,height:4.2,startCap:!closed&&a===-half,endCap:!closed&&b===half}));
  }
  if(type!=='opening-only'){
    const marks=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xe5ddc8,emissive:0xfff3db,emissiveIntensity:.65,roughness:.5});mat.name='j3-approach-white';
    const count=Math.max(1,Math.round(half*2/6)),pitch=half*2/count;
    for(let i=0;i<count;i++){
      const x=-half+(i+.5)*pitch;
      // Leave a clean approach to the optional opening, including tube seams.
      const delta=!closed?x-center:((x-center+half)%(half*2)+half*2)%(half*2)-half;
      if(type==='jump-or-opening'&&Math.abs(delta)<opening/2+COMPACT_JAMB_WIDTH)continue;
      for(const z of [12,24])for(const side of [-1,1]){
        const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,1.0),mat);m.name='white-jump-approach-chevron';
        m.position.set(x+side*.32,.035,z);m.rotation.y=side*Math.PI/4;marks.add(m);
      }
    }
    root.add(conformWallParts(THREE,marks,{shape}));
  }
  if(road)root.add(slabAssembly(THREE,{shape,length:70,courseEnd:70}));
  root.userData={shape,type,opening,center,height:type==='jump-only'?2.4:type==='opening-only'?WALL_HEIGHT:4.2,depth:5};
  return root;
}
export function modeledObstacle(THREE,obstacle,shape){
  const type=obstacle.kind==='jump'?'jump-only':obstacle.height===4.2?'jump-or-opening':'opening-only';
  const source=obstacleAssembly(THREE,{shape,type,opening:obstacle.width*wallHalfWidth(shape)*2,center:obstacle.center*wallHalfWidth(shape)});
  const group=mergeWallParts(THREE,source);group.position.z=-obstacle.s;return group;
}
