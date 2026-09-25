import * as THREE from 'three';
import {installObstacleLight,updateObstacleLight} from '../../public/assets/track/obstacle-lights-r1.js';

export class ObstacleLighting {
  constructor(entries){this.entries=entries;for(const entry of entries)this.bind(entry);}
  bind(entry){
    const materials=new Set();
    entry.group.traverse(mesh=>{
      if(mesh.isMesh&&mesh.material.userData.obstacleLight){
        installObstacleLight(THREE,mesh.material);materials.add(mesh.material);
      }
    });
    entry.lightMaterials=[...materials];
  }
  update(race,signal,reduced){
    for(const entry of this.entries){
      if(!entry.group.visible)continue;
      const selected=signal?.obstacle===entry.obstacle&&!race.demo&&race.mode==='phase';
      for(const material of entry.lightMaterials??[])updateObstacleLight(material,{
        time:race.time,direction:selected?signal.direction:0,active:selected?signal.active:0,
        ready:selected&&Boolean(signal.cue?.ready),reduced,
      });
    }
  }
}
