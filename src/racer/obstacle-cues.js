import {section,wrap,clamp} from './track.js';
import {GAPS,JUMP} from './jumps.js';
import {solidSpans,OBSTACLES} from './obstacles.js';

// Used by both the ribbon and the physical arrow displays. Retain a valid exit
// once chosen, but release it if the driver deliberately clears the other side.
export function wallBypassCue(obstacle,race,previous=null){
  const road=section(obstacle.s),start=race.s+2,end=obstacle.s-2,length=end-start;
  if(length<=0)return null;
  const exit=obstacle.s+obstacle.depth+4;
  const closed=Array.from({length:17},(_,i)=>section(start+(exit-start)*i/16).closed).every(Boolean);
  const norm=u=>closed?wrap(u):u;
  const difference=(a,b)=>closed?wrap(a-b):a-b;
  const clearance=4/road.halfWidth;
  const candidates=[-1,1].map(side=>({side,targetU:norm(obstacle.center+side*(obstacle.width+clearance))}));
  const evaluate=candidate=>{
    const delta=difference(candidate.targetU,race.u);
    const tangent=clamp(race.lateralSpeed/section(race.s).halfWidth*length/Math.max(1,race.speed),-.3,.3);
    const samples=Array.from({length:25},(_,i)=>start+(exit-start)*i/24);
    // Include hazard boundaries explicitly; a short gap must not fall between samples.
    for(const gap of GAPS)for(const s of [gap.start-1.95,gap.start+.1,gap.end-.1,gap.end+1.95])if(s>start&&s<exit)samples.push(s);
    for(const other of OBSTACLES)for(const s of [other.s-1.95,other.s+other.depth+1.95])if(s>start&&s<exit)samples.push(s);
    for(const s of samples){
      const local=section(s),t=clamp((s-start)/length,0,1);
      const u=race.u+delta*t*t*(3-2*t)+tangent*t*(1-t)**2;
      const margin=1.85/(local.halfWidth*(1-local.curl*JUMP.hover/18));
      if(!local.closed&&Math.abs(u)>1-margin)return null;
      for(const gap of GAPS){
        if(s<gap.start-1.95||s>gap.end+1.95)continue;
        const du=local.closed?wrap(u-gap.center):u-gap.center;
        if(gap.full||Math.abs(du)<gap.width+margin)return null;
      }
      for(const other of OBSTACLES){
        if(s<other.s-1.95||s>other.s+other.depth+1.95)continue;
        // This route is a grounded bypass, not permission to jump a second wall.
        const spans=solidSpans(other);
        for(const [a,b]of spans)for(const offset of local.closed?[-2,0,2]:[0]){
          const localU=local.closed?wrap(u):u;
          if(localU>=a+offset-margin&&localU<=b+offset+margin)return null;
        }
      }
    }
    return {...candidate,delta,distance:Math.abs(delta),closed,tangent,start,length};
  };
  const valid=candidates.map(evaluate).filter(Boolean);
  // Once already clear, keep the current lane if the full corridor is valid.
  const offset=road.closed?wrap(race.u-obstacle.center):race.u-obstacle.center;
  if(Math.abs(offset)>obstacle.width+clearance*.6){
    const straight=evaluate({side:Math.sign(offset),targetU:race.u});
    if(straight)return {...straight,direction:0};
  }
  valid.sort((a,b)=>a.distance-b.distance);
  const selected=valid.find(c=>c.side===previous?.side)??valid[0];
  return selected?{...selected,direction:selected.side}:null;
}
