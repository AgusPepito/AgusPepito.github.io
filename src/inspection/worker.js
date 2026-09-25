import * as THREE from 'three';
import {setTrackProfile,GATES,STRIPS} from '../racer/track.js';
import {OBSTACLES} from '../racer/obstacles.js';
import {GAPS} from '../racer/jumps.js';
import {campaignChunk,campaignGate,campaignDecorations,campaignObstacle} from '../racer/campaign-kit.js';
import {packAsset} from '../racer/asset-transfer.js';

self.onmessage=({data})=>{
  try{
    const {config,kind,start,gate,obstacle,grouped,modules=true,optimizations=true}=data,began=performance.now();
    setTrackProfile(config.length,config.shape);
    for(const [target,source] of [[GATES,config.gates],[STRIPS,config.strips],[OBSTACLES,config.obstacles],[GAPS,config.gaps]])target.splice(0,target.length,...source);
    const root=kind==='gates'?campaignGate(THREE,gate,null,{inspect:grouped,modules,deform:optimizations}):kind==='obstacle'?campaignObstacle(THREE,obstacle,{modules:optimizations}):campaignChunk(THREE,start,campaignDecorations(),{inspect:grouped,skipMasked:optimizations});
    const built=performance.now(),{packet,transfer}=packAsset(root);
    self.postMessage({packet,bytes:transfer.reduce((n,b)=>n+b.byteLength,0),buildMs:built-began,packMs:performance.now()-built},transfer);
  }catch(error){self.postMessage({error:error.message});}
};
