import { CampaignStream } from './campaign-stream.js';
import { campaignJobs } from './campaign-jobs.js';
import { levelAssetConfig, levelInfo } from './levels.js';

// Four authored campaign levels; Overload continues without a finite endpoint.
export const AUTHORED_LEVEL_COUNT = 4;
export class CampaignCache {
  constructor(event) {
    this.event=event;this.started=performance.now();this.finished=null;this.error=null;
    this.levels=Array.from({length:AUTHORED_LEVEL_COUNT},(_,index)=>{
      const config=levelAssetConfig(index);
      return {index,name:levelInfo(index).name,config,total:campaignJobs(config).length,
        stream:null,started:null,finished:null,workerMs:0,packMs:0,families:{}};
    });
    this.event('all-cache-start',{levels:AUTHORED_LEVEL_COUNT});
  }
  streamFor(index) {
    const level=this.levels[index];
    return level?new CampaignStream(level.config,{source:()=>level.stream}):null;
  }
  ready(){return this.finished!==null&&!this.error;}
  update(){
    if(this.finished!==null||this.error)return;
    const level=this.levels.find(level=>level.finished===null);
    if(level.started===null){
      level.started=performance.now();
      try{level.stream=new CampaignStream(level.config,{background:true,budgetBytes:Infinity});}
      catch(error){this.error=error.message;this.event('all-cache-error',{level:level.index,message:this.error});return;}
    }
    const metric=level.stream.update(0);
    if(metric){
      level.workerMs+=metric.workerBuildMs??0;level.packMs+=metric.workerPackMs??0;
      const family=level.families[metric.assetKind]??={assets:0,bytes:0,workerMs:0,packMs:0};
      family.assets++;family.bytes+=metric.assetBytes;family.workerMs+=metric.workerBuildMs;family.packMs+=metric.workerPackMs;
      this.event('all-cache-asset',{level:level.index,...metric});
    }
    if(level.stream.error){
      this.error=level.stream.error;this.event('all-cache-error',{level:level.index,message:this.error});return;
    }
    if(level.stream.generated===level.total&&level.stream.workerStopped){
      level.finished=performance.now();
      this.event('all-cache-level-ready',{level:level.index,bytes:level.stream.cacheBytes,durationMs:level.finished-level.started});
      if(this.levels.every(level=>level.finished!==null)){
        this.finished=performance.now();this.event('all-cache-ready',this.snapshot());
      }
    }
  }
  snapshot(){
    const now=performance.now();
    return {mode:'all-authored-levels',levelCount:AUTHORED_LEVEL_COUNT,ready:this.ready(),error:this.error,
      durationMs:(this.finished??now)-this.started,
      bytes:this.levels.reduce((n,l)=>n+(l.stream?.cacheBytes??0),0),
      generated:this.levels.reduce((n,l)=>n+(l.stream?.generated??0),0),total:this.levels.reduce((n,l)=>n+l.total,0),
      levels:this.levels.map(l=>({level:l.index,name:l.name,ready:l.finished!==null,assets:l.stream?.generated??0,total:l.total,
        bytes:l.stream?.cacheBytes??0,workerMs:l.workerMs,packMs:l.packMs,
        durationMs:l.started===null?0:(l.finished??now)-l.started,
        families:Object.fromEntries(Object.entries(l.families).map(([name,f])=>[name,{...f}]))}))};
  }
}
