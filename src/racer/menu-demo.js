import {Race} from './simulation.js';
import {LENGTH,GATES,STRIPS,onStrip} from './track.js';
import {GAPS} from './jumps.js';
import {OBSTACLES} from './obstacles.js';

// Render-only preview: never steps physics, records scores or changes race state.
export class MenuDemo {
  constructor(){
    this.pose=new Race();this.pose.demo=true;this.index=0;this.elapsed=0;this.time=0;
    const blocked=[...GATES.map(g=>[g.s-60,g.s+50]),...OBSTACLES.map(o=>[o.s-80,o.s+o.depth+65]),
      ...GAPS.map(g=>[g.start-100,g.end+90]),[LENGTH-80,LENGTH]].sort((a,b)=>a[0]-b[0]);
    this.shots=[];let cursor=35;
    for(const [a,b] of blocked){
      if(a-cursor>=180)this.shots.push([cursor,Math.min(a,cursor+650)]);
      cursor=Math.max(cursor,b);
    }
    if(!this.shots.length)this.shots.push([20,Math.max(21,Math.min(180,LENGTH-100))]);
  }
  update(dt,view){
    const shot=this.shots[this.index],duration=(shot[1]-shot[0])/48;
    if(!view.reduced){this.elapsed+=dt;this.time+=dt;}
    // Cut directly between prepared shots without a black interval that can
    // resemble dropped frames against the already-dark interior tubes.
    if(this.elapsed>=duration){this.elapsed=0;this.index=(this.index+1)%this.shots.length;view.snap=true;}
    const [start,end]=this.shots[this.index];
    this.pose.s=Math.min(end,start+this.elapsed*48);this.pose.time=this.time;
    this.pose.u=0;this.pose.speed=48;this.pose.state='ready';
    this.pose.phase=STRIPS.find(strip=>onStrip(strip,this.pose.s,0))?.phase??this.index%3;
    this.pose.stripBoost=false;
    return this.pose;
  }
}
