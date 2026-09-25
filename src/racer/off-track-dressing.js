import * as THREE from 'three';
import generate from './dressing-assets.js';
import {LENGTH,point,trackMotionAt,trackProfileSnapshot} from './track.js';
import {mergeWallParts} from './wall-kit.js';

const KINDS=['ring','pylon','boom'];
const CLEARANCE=135, AHEAD=1800, BEHIND=450;
const Z_AXIS=new THREE.Vector3(0,0,1);
const ease=value=>{const t=THREE.MathUtils.clamp(value,0,1);return t*t*t*(t*(t*6-15)+10);};

function layoutRandom(profile){
  let seed=2166136261;
  for(const character of JSON.stringify(profile))seed=Math.imul(seed^character.charCodeAt(0),16777619)>>>0;
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}

// The authored centerline is the sum of monotone eased displacement increments.
// Summing each increment's endpoint min/max conservatively encloses ALL points
// in this s interval, including bends between endpoints and opposing moves.
// Track roll and cross-section curl do not change the centerline at u=0.
function centerlineBounds(profile,from,to){
  const bounds={minX:0,maxX:0,minY:0,maxY:0};
  for(const move of profile.motion){
    const duration=move.end-move.start;
    const a=duration>0?ease((from-move.start)/duration):Number(from>move.start);
    const b=duration>0?ease((to-move.start)/duration):Number(to>move.start);
    bounds.minX+=Math.min(move.x*a,move.x*b);bounds.maxX+=Math.max(move.x*a,move.x*b);
    bounds.minY+=Math.min(move.y*a,move.y*b);bounds.maxY+=Math.max(move.y*a,move.y*b);
  }
  if(profile.shape==='flat'){
    // Legacy flat profile's three extra centerline increments: +18, -36, +18.
    bounds.minX-=36;bounds.maxX+=36;
  }else if(!['authored','gap-flat','inside','outside'].includes(profile.shape)){
    // Legacy mixed profile: bound its extra x/y displacement terms in full.
    bounds.minX-=350;bounds.maxX+=350;bounds.minY-=40;bounds.maxY+=24;
  }
  return bounds;
}

export class OffTrackDressing {
  constructor(){
    this.group=new THREE.Group();this.group.name='mid-distance-track-dressing';
    // Keep every retained resource reachable by RaceView's existing disposal
    // traversal, even when a short level happens not to use one of the models.
    this.resources=new THREE.Group();this.resources.name='dressing-prototypes';this.resources.visible=false;
    this.placements=new THREE.Group();this.placements.name='dressing-placements';
    this.group.add(this.resources,this.placements);this.entries=[];
    const palette=new Map();this.prototypes=new Map();
    let geometryBytes=0,triangles=0;
    for(const kind of KINDS){
      const prototype=mergeWallParts(THREE,generate(THREE,{kind}),{indexed:true});
      prototype.name=`dressing-${kind}-prototype`;
      const bounds=new THREE.Box3().setFromObject(prototype),center=bounds.getCenter(new THREE.Vector3());
      // Center on the complete bounds so a single conservative sphere contains
      // the entire model under every random rotation, including the boom arm.
      const radius=bounds.getSize(new THREE.Vector3()).length()/2;
      prototype.traverse(mesh=>{
        if(!mesh.isMesh)return;
        mesh.geometry.translate(-center.x,-center.y,-center.z);
        mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
        const material=mesh.material;
        if(palette.has(material.name)){mesh.material=palette.get(material.name);material.dispose();}
        else{material.fog=false;palette.set(material.name,material);}
        mesh.name=`${kind}-${mesh.material.name}`;
        triangles+=mesh.geometry.index.count/3;
        for(const attribute of Object.values(mesh.geometry.attributes))geometryBytes+=attribute.array.byteLength;
        geometryBytes+=mesh.geometry.index.array.byteLength;
      });
      this.resources.add(prototype);this.prototypes.set(kind,{prototype,radius});
    }
    this.prototypeStats={prototypes:3,materials:palette.size,geometryBytes,triangles};
  }

  setTrack(){
    this.placements.clear();this.entries=[];
    const profile=trackProfileSnapshot(),random=layoutRandom(profile),counts={ring:0,pylon:0,boom:0};
    const origin=new THREE.Vector3(),direction=new THREE.Vector3(),normal=new THREE.Vector3();
    let order=[],lastKind=null;
    // Repeated shuffled sets avoid long runs of one shape without filling every
    // stretch. One structure per station, never matching pairs beside the road.
    for(let s=320+random()*120;s<LENGTH-180;s+=700+random()*250){
      if(!order.length){
        order=[...KINDS];
        for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
        if(order[order.length-1]===lastKind)[order[0],order[order.length-1]]=[order[order.length-1],order[0]];
      }
      const kind=order.pop(),{prototype,radius}=this.prototypes.get(kind);lastKind=kind;
      const model=prototype.clone(),side=random()<.5?-1:1;
      model.name=`off-track-${kind}-${++counts[kind]}`;
      const scale=kind==='ring'?1.05+random()*.2:.95+random()*.15;
      const extent=radius*scale;
      model.scale.setScalar(scale);
      const roll=trackMotionAt(s).roll;
      model.quaternion.setFromAxisAngle(Z_AXIS,roll);
      if(kind==='ring'){
        // Continuous spin changes the open sector; bounded tilt keeps the hoop
        // readable from the course instead of frequently turning edge-on.
        model.rotateZ(random()*Math.PI*2);
        model.rotateX((random()-.5)*.9);model.rotateY((random()-.5)*.9);
      }else if(kind==='pylon'){
        // Quarter turns relative to the banked course, rather than free tilts.
        model.rotateZ(Math.floor(random()*4)*Math.PI/2);
        model.rotateY(Math.floor(random()*4)*Math.PI/2);
      }else{
        // The mast is at local -X: turn the left-side boom so its arm points
        // outward, and the right-side boom retains its authored orientation.
        if(side<0)model.rotateY(Math.PI);
      }
      origin.copy(point(s,0));
      direction.set(Math.cos(roll)*side,Math.sin(roll)*side,0);
      normal.set(-Math.sin(roll),Math.cos(roll),0);
      const bounds=centerlineBounds(profile,s-extent-CLEARANCE,s+extent+CLEARANCE);
      const support=direction.x*(direction.x>=0?bounds.maxX:bounds.minX)
        +direction.y*(direction.y>=0?bounds.maxY:bounds.minY);
      // All model vertices lie inside extent. Place that sphere beyond the
      // centerline envelope by 135 m. Course sections span <57 m from u=0;
      // this leaves >78 m beyond the surface, plus room for walls and jumps.
      // Outside the bounded s interval, monotonic world z=-s alone separates
      // the model and course by at least the same 135 m centerline clearance.
      const distance=support-origin.dot(direction)+extent+CLEARANCE+random()*35;
      model.position.copy(origin).addScaledVector(direction,distance).addScaledVector(normal,(random()-.5)*70);
      model.userData={role:'decoration',interactive:false,kind,station:s,side};
      this.placements.add(model);this.entries.push({s,extent,model});
    }
    this.stats={...this.prototypeStats,counts,structures:this.entries.length,
      spacingMeters:[700,950],centerlineClearanceMeters:CLEARANCE,aheadMeters:AHEAD,behindMeters:BEHIND};
    this.update(0);
  }

  update(distance){
    for(const {s,extent,model} of this.entries)model.visible=s+extent>distance-BEHIND&&s-extent<distance+AHEAD;
  }
}
