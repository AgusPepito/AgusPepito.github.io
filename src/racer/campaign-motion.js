// Deliberate path silhouettes, in longitudinal fraction / metres / degrees.
// Each course chooses its sweep, direction and strength; nothing is randomized.
const ROUTES = {
  sweep: [[0,0,0,0],[.18,70,10,24],[.44,-85,-8,-30],[.73,80,18,28],[1,0,0,0]],
  spiral: [[0,0,0,0],[.22,85,20,42],[.52,-75,35,100],[.78,65,-12,42],[1,0,0,0]],
  switchback: [[0,0,0,0],[.16,65,15,32],[.36,-75,-10,-42],[.57,80,20,46],[.79,-70,5,-38],[1,0,0,0]],
  orbit: [[0,0,0,0],[.25,110,30,65],[.53,-90,50,130],[.78,-30,-10,65],[1,0,0,0]],
};

export function campaignMotion(length, encounters, {path='sweep',mirror=1,amount=1}={}) {
  // Short steady stations preserve exact repeated gate hardware. Longer holds
  // keep the surface pose fixed from a jump approach through its landing.
  const holds=[[0,100],[length-80,length],
    ...encounters.gates.map(g=>[g.s-24,g.s+18]),
    ...encounters.gaps.map(g=>[g.start-100,g.end+280]),
    ...encounters.obstacles.filter(o=>o.kind==='jump').map(o=>[o.s-90,o.s+300])]
    .map(([a,b])=>[Math.max(0,a),Math.min(length,b)]).sort((a,b)=>a[0]-b[0]);
  const free=[];let end=0;
  // Join nearby holds instead of inserting a tiny bend between two fixtures.
  for(const [a,b] of holds){if(a-end>=60)free.push([end,a]);end=Math.max(end,b);}
  const distance=free.reduce((sum,[a,b])=>sum+b-a,0);
  if(!distance)return [];
  const route=ROUTES[path],moves=[];
  let travelled=0;
  for(const [a,b] of free){
    const from=travelled/distance,to=(travelled+b-a)/distance;
    for(let i=1;i<route.length;i++){
      const left=route[i-1],right=route[i],low=Math.max(from,left[0]),high=Math.min(to,right[0]);
      if(high<=low)continue;
      const fraction=(high-low)/(right[0]-left[0]);
      moves.push({start:a+(low-from)*distance,end:a+(high-from)*distance,
        x:(right[1]-left[1])*fraction*amount*mirror,
        y:(right[2]-left[2])*fraction*amount,
        roll:(right[3]-left[3])*fraction*amount*mirror*Math.PI/180});
    }
    travelled+=b-a;
  }
  return moves;
}
