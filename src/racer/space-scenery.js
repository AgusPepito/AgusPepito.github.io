import * as THREE from 'three';
import pittedAsteroid from './recipe-assets/asteroids-r1.js';
import fracturedAsteroid from './recipe-assets/asteroid-fractured-r1.js';
import station from '../../art-studies/phase14-ring-station-r1/station.js';
import {LENGTH,point,section} from './track.js';
import {mergeWallParts} from './wall-kit.js';
import {OffTrackDressing} from './off-track-dressing.js';

function randomSequence(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}

export class SpaceScenery {
  constructor(){
    const began=performance.now();
    this.group=new THREE.Group();this.group.name='decorative-space-scenery';this.fields=[];this.stations=[];
    // Standalone recipes return Groups. Their single rock mesh remains the
    // shared instancing prototype after restoring its authored space origin.
    const rocks=[pittedAsteroid(THREE),fracturedAsteroid(THREE)].map(root=>root.children[0]);
    // Space scenery sits beyond the road's short-distance visibility fog.
    rocks.forEach(rock=>{rock.material.fog=false;});
    this.rocks=rocks;
    this.prototype=mergeWallParts(THREE,station(THREE),{indexed:true});
    this.prototype.traverse(mesh=>{if(mesh.isMesh)mesh.material.fog=false;});
    this.dressing=new OffTrackDressing();
    this.prototypeGenerationMs=performance.now()-began;
    this.setTrack();
  }
  setTrack(){
    const began=performance.now(),rocks=this.rocks,prototype=this.prototype;
    // Only placements belong to a level. Keep the expensive prototype geometry,
    // materials and their GPU buffers alive across checkpoint transitions.
    for(const field of this.fields)field.group.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});
    this.group.clear();this.fields=[];this.stations=[];
    const random=randomSequence(404251+LENGTH),transform=new THREE.Object3D(),tint=new THREE.Color();
    const offset=new THREE.Vector3();
    let asteroidCount=0;
    // Small longitudinal batches keep culling useful; two shared meshes per field.
    for(let start=0;start<LENGTH;start+=300){
      const span=Math.min(300,LENGTH-start),center=start+span/2;
      // Alternate open vistas and denser clouds. Existing prototype geometry and
      // the 450 m course clearance stay unchanged; only instance placement varies.
      const quiet=Math.floor(start/300)%6===1||Math.floor(start/300)%6===2;
      const field=new THREE.Group();field.name=`asteroid-field-${start}`;field.position.copy(point(center,0));
      // Uneven cloud centers leave empty pockets instead of two continuous ribbons.
      const clusters=Array.from({length:2+Math.floor(random()*3)},(_,index)=>{
        const s=start+span*(.1+random()*.8),curl=Math.abs(section(s).curl);
        const blend=THREE.MathUtils.smoothstep(curl,0,.85);
        const angle=(index%2?Math.PI:0)+(random()-.5)*(.65+blend*(Math.PI-.65));
        const radius=650+random()*350;
        return {s,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,
          spread:70+random()*130,depth:60+random()*110};
      });
      const counts=Array.from({length:2},()=>quiet?5+Math.floor(random()*5):12+Math.floor(random()*13));
      for(let variant=0;variant<2;variant++){
        const count=counts[variant],batch=new THREE.InstancedMesh(rocks[variant].geometry,rocks[variant].material,count);
        batch.name=rocks[variant].name;
        for(let i=0;i<count;i++){
          const cluster=clusters[Math.floor(random()*clusters.length)];
          // Uniform volume samples within an ellipsoid, not a flat sheet or shell.
          const azimuth=random()*Math.PI*2,vertical=random()*2-1;
          const radial=Math.cbrt(random()),horizontal=Math.sqrt(1-vertical*vertical);
          offset.set(Math.cos(azimuth)*horizontal*cluster.spread,
            vertical*cluster.spread,Math.sin(azimuth)*horizontal*cluster.depth).multiplyScalar(radial);
          const s=cluster.s+offset.z;
          let lateral=cluster.x+offset.x,height=cluster.y+offset.y;
          // Keep an empty cylinder around the entire playable cross-section.
          const clearance=Math.hypot(lateral,height);
          if(clearance<450){lateral*=450/clearance;height*=450/clearance;}
          transform.position.copy(point(s,0)).sub(field.position);
          transform.position.x+=lateral;transform.position.y+=height;
          transform.rotation.set(random()*Math.PI*2,random()*Math.PI*2,random()*Math.PI*2);
          const radius=i%7===0?16+random()*9:3+random()*10;
          transform.scale.set(radius*(.8+random()*.3),radius*(.8+random()*.3),radius*(.8+random()*.3));
          transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);
          tint.setRGB(.8+random()*.2,.8+random()*.2,.8+random()*.2);batch.setColorAt(i,tint);
        }
        batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;
        batch.computeBoundingSphere();field.add(batch);asteroidCount+=count;
      }
      this.group.add(field);this.fields.push({start:start-170,end:start+span+170,group:field});
    }
    // Station copies share the prototype retained from the first level.
    for(let s=700,index=0;s<LENGTH-100;s+=1800,index++){
      const model=prototype.clone(),side=index%2?1:-1;
      model.name=`distant-ring-station-${index+1}`;model.position.copy(point(s,0));
      model.position.x+=side*(1100+index%2*300);model.position.y+=100+index%3*75;
      model.rotation.set(.32+index*.13,index*.8,side*.25);model.scale.setScalar((.85+index%2*.15)*2.5);
      this.group.add(model);this.stations.push({s,group:model});
    }
    this.dressing.setTrack();this.group.add(this.dressing.group);
    const layoutMs=performance.now()-began,reusedPrototypes=Boolean(this.stats);
    this.stats={layout:'orbital-vistas-v5-dressing',stationScaleMultiplier:2.5,asteroidPrototypes:2,asteroids:asteroidCount,stations:this.stations.length,
      fieldBatches:this.fields.length*2,stationMaterials:prototype.children.length,
      dressing:this.dressing.stats,
      reusedPrototypes,prototypeGenerationMs:this.prototypeGenerationMs,layoutMs,
      generationMs:layoutMs+(reusedPrototypes?0:this.prototypeGenerationMs)};
    this.update(0);
  }
  update(distance){
    for(const field of this.fields)field.group.visible=field.end>distance-650&&field.start<distance+2400;
    for(const entry of this.stations)entry.group.visible=Math.abs(entry.s-distance)<3000;
    this.dressing.update(distance);
  }
}
