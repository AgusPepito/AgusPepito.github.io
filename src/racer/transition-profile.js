// Shared by collision, rendered construction and the standalone asset library.
export const TRANSITION_RADIUS=18;
export const TRANSITION_COURSES={
  '09':{length:1800,runs:[{sign:-1,enter:200,closed:600,open:1050,exit:1450}]},
  '10':{length:3000,runs:[{sign:1,enter:200,closed:600,open:1000,exit:1400},{sign:-1,enter:1700,closed:2050,open:2350,exit:2700}]},
};
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export function runSection(runs,s){
  let curl=0,name='FLAT CONNECTOR';
  for(const run of runs){
    if(s<run.enter||s>=run.exit)continue;
    const amount=s<run.closed?ease((s-run.enter)/(run.closed-run.enter)):s<=run.open?1:1-ease((s-run.open)/(run.exit-run.open));
    curl=run.sign*amount;
    name=amount===1?(run.sign>0?'INSIDE TUBE':'OUTSIDE TUBE'):s<run.closed?(run.sign>0?'CURLING INWARD':'ROLLING OUTWARD'):'OPENING TO FLAT';
    break;
  }
  return {curl,halfWidth:18+(Math.PI*TRANSITION_RADIUS-18)*Math.abs(curl),closed:Math.abs(curl)===1,name};
}
export function transitionSection(category,s){return runSection(TRANSITION_COURSES[category].runs,s);}
export function transitionPoint(category,s,u){
  const {curl,halfWidth}=transitionSection(category,s),x=u*halfWidth,k=curl/TRANSITION_RADIUS;
  return Math.abs(k)<1e-8?[x,0,-s]:[Math.sin(k*x)/k,(1-Math.cos(k*x))/k,-s];
}
export function transitionFrame(THREE,category,s,u){
  const p=new THREE.Vector3(...transitionPoint(category,s,u));
  const forward=new THREE.Vector3(...transitionPoint(category,s+.05,u)).sub(new THREE.Vector3(...transitionPoint(category,s-.05,u))).normalize();
  const {curl,halfWidth}=transitionSection(category,s),theta=curl/TRANSITION_RADIUS*u*halfWidth;
  const right=new THREE.Vector3(Math.cos(theta),Math.sin(theta),0);
  const normal=right.clone().cross(forward).normalize();right.copy(forward).cross(normal).normalize();
  return {p,right,normal,forward};
}
