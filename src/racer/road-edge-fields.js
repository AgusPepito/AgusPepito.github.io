import * as THREE from 'three';
import {LENGTH,section,frame,clamp} from './track.js';
import {GAPS,gapAt} from './jumps.js';
import {OBSTACLES,solidSpans} from './obstacles.js';
import {BAY_PITCH} from './mixed-kit.js';
import {edgeFieldMaterial,installEdgeField} from '../../public/assets/track/edge-field-r1.js';

const WALL_OVERLAP=BAY_PITCH+1.5;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};

// Extend across the entire sloped terminal bay, then fade inside the next
// solid bay. Global spans keep adjoining chunks from doubling their glow.
function fieldRuns(layout,limit){
  const runs=[];let from=null;
  for(let bay=0;bay<=Math.ceil(limit/BAY_PITCH);bay++){
    const at=Math.min(limit,bay*BAY_PITCH),open=at<limit&&!layout[bay];
    if(open&&from===null)from=at;
    if(!open&&from!==null){
      const a=from-WALL_OVERLAP,b=at+WALL_OVERLAP,previous=runs[runs.length-1];
      if(previous&&previous.end>=a)previous.end=b;
      else runs.push({start:a,end:b});
      from=null;
    }
  }
  return runs;
}

// Color describes real encounters, never random decoration. Only the edge
// beside a blocked route warns red; an open bypass keeps its guidance color.
function warningZones(side){
  const zones=[];
  for(const obstacle of OBSTACLES){
    const blocked=solidSpans(obstacle).some(([a,b])=>side<0?a<-.5:b>.5);
    if(!blocked)continue;
    zones.push({start:obstacle.s-72,end:obstacle.s+obstacle.depth+10,
      kind:obstacle.kind==='jump'?1:0});
  }
  for(const gap of GAPS){
    if(!gap.full&&Math.abs(gap.center)>.15&&Math.sign(gap.center)!==side)continue;
    zones.push({start:gap.start-85,end:gap.end+22,kind:0});
  }
  return zones;
}

function warningAt(s,zones){
  const weights=[0,0];
  for(const zone of zones){
    const weight=smooth((s-zone.start)/12)*smooth((zone.end-s)/8);
    weights[zone.kind]=Math.max(weights[zone.kind],weight);
  }
  weights[1]*=1-weights[0];
  return weights;
}

// One world-baked mesh per streamed chunk for both sides and every sign style.
export function roadEdgeFields(start,end,layouts){
  const first=Math.max(0,start),last=Math.min(end,LENGTH+30);
  if(last<=first)return null;
  const cuts=[first,last];
  for(let s=Math.ceil(first/BAY_PITCH)*BAY_PITCH;s<last;s+=BAY_PITCH)if(s>first)cuts.push(s);
  for(const gap of GAPS)for(const s of [gap.start,gap.end])if(s>first&&s<last)cuts.push(s);
  cuts.sort((a,b)=>a-b);
  const positions=[],coords=[],styles=[],indices=[];
  for(const [index,side] of [-1,1].entries()){
    const zones=warningZones(side);
    for(const run of fieldRuns(layouts[index],LENGTH+30)){
      const begin=Math.max(first,run.start),finish=Math.min(last,run.end);
      if(finish<=begin)continue;
      const stations=[begin,finish,...cuts.filter(s=>s>begin&&s<finish)];
      for(const s of [run.start+3,run.end-3])if(s>begin&&s<finish)stations.push(s);
      stations.sort((a,b)=>a-b);
      for(let i=1;i<stations.length;i++){
        const a=stations[i-1],b=stations[i],mid=(a+b)/2;
        if(b-a<.001||section(mid).closed||gapAt(mid,side*.999))continue;
        const count=Math.max(1,Math.ceil((b-a)/2.5)),base=positions.length/3;
        for(let n=0;n<=count;n++){
          const s=a+(b-a)*n/count,road=section(s),pose=frame(s,side);
          const fade=smooth((1-Math.abs(road.curl))/.14)*smooth((s-run.start)/3)*smooth((run.end-s)/3);
          const warning=warningAt(s,zones);
          // Keep the curtain on the visual road edge; collision already stops
          // the ship's center slightly inside it to allow for the hull's width.
          for(const h of [.035,6.4]){
            const p=pose.p.clone().addScaledVector(pose.right,side*.05).addScaledVector(pose.normal,h);
            positions.push(p.x,p.y,p.z);coords.push(s,h,side,fade);styles.push(...warning);
          }
          if(n<count){const at=base+n*2;indices.push(at,at+1,at+2,at+1,at+3,at+2);}
        }
      }
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('edgeCoord',new THREE.Float32BufferAttribute(coords,4));
  geometry.setAttribute('edgeStyle',new THREE.Float32BufferAttribute(styles,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,edgeFieldMaterial(THREE,first,last));
  mesh.name='exposed-road-containment';mesh.renderOrder=2;return mesh;
}

export class RoadEdgeFieldVfx{
  constructor(){this.materials=new Map();this.last=null;this.lastImpact=-1000;this.impact=new THREE.Vector3(0,0,-1000);}
  bind(root){
    root.traverse(mesh=>{
      if(!mesh.isMesh)return;
      for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
        if(!material.userData.edgeField||this.materials.has(material))continue;
        this.materials.set(material,installEdgeField(THREE,material));
      }
    });
  }
  update(race,reduced,quality){
    const reset=!this.last||race.time<this.last.time||Math.abs(race.s-this.last.s)>90||Boolean(race.demo)!==this.last.demo;
    if(reset){this.lastImpact=-1000;this.impact.z=-1000;}
    const side=Math.sign(race.u),near=clamp((Math.abs(race.u)-.72)/.23,0,1);
    if(!reset&&!reduced&&!race.demo&&race.state==='running'&&race.scrape>0&&race.time-this.lastImpact>.18){
      this.lastImpact=race.time;this.impact.set(race.s,side,race.time);
    }
    for(const [material,uniforms] of this.materials){
      const range=material.userData.edgeField;
      if(range.end<race.s-180||range.start>race.s+760)continue;
      uniforms.edgeTime.value=race.time;uniforms.edgeReduced.value=reduced?1:0;
      uniforms.edgeDetail.value=quality==='rich'?1:0;
      uniforms.edgeShip.value.set(race.s,side,race.demo?0:near);
      uniforms.edgeImpact.value.copy(this.impact);
    }
    this.last={time:race.time,s:race.s,demo:Boolean(race.demo)};
  }
}
