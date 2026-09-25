import {campaignMotion} from './campaign-motion.js';

// One introductory course per area; the remaining courses combine known skills.
// All obstacle widths are surface-coordinate HALF widths, as in obstacles.js.
export const CAMPAIGN_AREAS = [
  {id:'dockyards',name:'DOCKYARDS',number:'01',theme:'BANKED ROAD',skill:'Slaloms · phases · tube folds',image:'assets/areas/dockyards-r1.webp'},
  {id:'conduits',name:'CONDUITS',number:'02',theme:'INNER TUBE',skill:'Spirals · phase shifts · reversals',image:'assets/areas/conduits-r1.webp'},
  {id:'broken-span',name:'BROKEN SPAN',number:'03',theme:'JUMP ROUTES',skill:'Jump · rotate · land',image:'assets/areas/broken-span-r1.webp'},
  {id:'relay-grid',name:'RELAY GRID',number:'04',theme:'PHASE RHYTHM',skill:'Switch · thread · jump',image:'assets/areas/relay-grid-r1.webp'},
  {id:'outer-ring',name:'OUTER RING',number:'05',theme:'EXTERIOR TUBE',skill:'Helices · signals · flight',image:'assets/areas/outer-ring-r1.webp'},
  {id:'nexus',name:'NEXUS',number:'06',theme:'MASTERY CIRCUIT',skill:'Linked surfaces · combined skills',image:'assets/areas/nexus-r1.webp'},
];
export const CAMPAIGN_LAYOUT_REVISION='r3';
const gate=(s,phase)=>({s,phase,center:0,width:1,full:true});
const signals=rows=>rows.map(([s,p])=>gate(s,p));
const wall=(s,center,width)=>({s,kind:'wall',center,width,depth:5});
const wrap=u=>((u+1)%2+2)%2-1;
const passage=(s,center,width)=>({s,kind:'hole',center:wrap(center),width,depth:5,height:9});
const holes=(rows,width)=>rows.map(([s,u,w=width])=>passage(s,u,w));
const hurdle=s=>({s,kind:'jump',center:0,width:1,depth:5,height:2.4});
const gap=(start,end)=>({start,end,center:0,width:1,full:true});
// Keep each spiral ribbon near the canonical seam for the surface cut masks,
// while preserving its authored direction across the wrap.
const ribbon=(start,end,phase,from,to,width=.105)=>({start,end,phase,from:wrap(from),to:wrap(from)+to-from,width});
// Matching lanes supply launch thrust even with an empty battery. Long gaps
// still require holding boost on the approach and jumping near the edge.
const power=(start,end,phase)=>ribbon(start,end,phase,0,0,1);
const cue=(start,end,title,pc,touch=pc)=>({start,end,title,pc,touch});
const course=(id,area,name,profile,lesson,data,hints=[],options={})=>{
  const encounters={gates:[],strips:[],obstacles:[],gaps:[],chains:[],...data};
  const last=Math.max(0,...encounters.gates.map(g=>g.s+9),...encounters.obstacles.map(o=>o.s+o.depth),
    ...encounters.strips.map(strip=>strip.end),...encounters.gaps.map(gap=>gap.end));
  const length=Math.ceil((last+140)/10)*10;
  return {id,area,name,length,profile,runs:options.runs??[],motion:campaignMotion(length,encounters,options),lesson,hints,data:encounters};
};

export const CAMPAIGN_LEVELS = [
  // Dockyards teaches the controls in one mixed introduction. The road then
  // banks harder, demands continuous steering and folds into short tube runs.
  course('dockyards-clear-route','dockyards','CLEAR ROUTE','gap-flat',
    'Steer through white openings. Match gates with 1, 2 or 3. Matching lanes accelerate; W boosts and S brakes.',
    {gates:signals([[580,0],[1140,1],[1620,2],[2200,0]]),
      obstacles:[wall(300,0,.30),passage(850,-.40,.32),wall(1380,-.35,.42),passage(1990,.40,.28),passage(2400,-.40,.26)],
      strips:[ribbon(1650,1850,2,.40,.40,.26)]},[
      cue(30,230,'STEER AROUND THE WALL','A / D or ← / → to steer. White openings mark the way through.','Left pad sideways steers. White openings mark the way through.'),
      cue(340,520,'CYAN / ION ●','Press 1 to match the cyan gate.','Right pad left selects cyan.'),
      cue(880,1080,'AMBER / SOL ▲','Press 2 to match the amber gate.','Right pad down selects amber.'),
      cue(1410,1570,'VIOLET / FLUX ◆','Press 3 to match violet. Its lane also gives free acceleration.','Right pad right selects violet. Its lane also gives free acceleration.'),
      cue(1690,1890,'CONTROL YOUR SPEED','W or Shift boosts. Tap S to brake before a tight opening.','Right pad up boosts. Left pad down brakes before a tight opening.'),
    ],{amount:.65}),
  course('dockyards-first-shift','dockyards','FIRST SHIFT','gap-flat',
    'Weave across banked bends while switching phases. Every opening sets up the next turn.',
    {gates:signals([[430,1],[940,2],[1240,0],[1750,1],[2070,2]]),
      obstacles:[passage(300,-.42,.25),wall(590,.38,.43),passage(790,-.42,.24),passage(1090,.42,.24),
        wall(1400,-.38,.43),passage(1600,.42,.23),passage(1930,-.42,.23),passage(2250,.42,.23)],
      strips:[ribbon(470,550,1,-.42,-.42,.18),ribbon(1790,1860,1,.42,-.22,.16)]},[],{path:'switchback',amount:.85}),
  course('dockyards-third-signal','dockyards','THIRD SIGNAL','authored',
    'The banked road curls into a tube. Rotate through openings and keep matching the signals.',
    {gates:signals([[970,1],[1300,2],[1620,0],[1890,1],[2660,2]]),
      obstacles:[wall(270,0,.30),...holes([[820,.15],[1150,.50],[1470,.90],[1780,.45],[1990,0]],.145),passage(2830,-.42,.23)],
      strips:[ribbon(1010,1080,1,.15,.42,.12),ribbon(1660,1720,0,.90,.55,.12)]},[],
    {path:'spiral',amount:.70,runs:[{sign:1,enter:340,closed:680,open:2110,exit:2470}]}),
  course('dockyards-departure','dockyards','DEPARTURE','authored',
    'Slalom into a rotating phase run, reverse around the tube, then finish across the open road.',
    {gates:signals([[450,1],[1400,2],[1680,0],[1960,1],[2240,2],[2970,0],[3340,1]]),
      obstacles:[passage(300,-.42,.24),passage(620,.42,.23),
        ...holes([[1280,0],[1560,.50],[1840,1],[2120,.50],[2400,0]],.13),
        passage(3160,-.45,.22),passage(3520,.45,.22)],
      strips:[ribbon(1730,1800,0,.55,.92,.12),ribbon(3010,3070,0,0,-.35,.16)]},[],
    {path:'switchback',runs:[{sign:1,enter:780,closed:1080,open:2490,exit:2790}]}),

  // Conduits adds demanding rotation to the phases and lanes already learned.
  course('conduits-thread','conduits','THREAD THE NEEDLE','inside',
    'Rotate around the tube, settle through each opening, then match the next phase.',
    {obstacles:holes([[340,0,.14],[680,.42,.135],[1040,.94,.13],[1400,.38,.125],
      [1750,-.20,.12],[2090,-.78,.12],[2440,-.20,.115]],.13),
      gates:signals([[820,1],[1180,2],[1870,0]])},[
      cue(30,270,'AROUND THE TUBE','A / D rotates around the tube. Release steering as you enter the white opening.','Left pad sideways rotates around the tube. Center it as you enter the white opening.'),
      cue(390,590,'TURN, THEN SETTLE','The next opening is to the right. Settle through it, then match amber.'),
    ],{path:'spiral',amount:.8}),
  course('conduits-spiral','conduits','SPIRAL RUN','inside',
    'Keep rotating right through phase changes and optional winding acceleration lanes.',
    {obstacles:holes([[320,0],[640,.52],[960,1.04],[1280,1.56],[1600,2.08],
      [1920,2.60],[2240,3.12],[2560,3.64],[2880,4.16]],.11),
      gates:signals([[450,1],[770,2],[1090,0],[1410,1],[1730,2],[2050,0],[2370,2],[2690,1]]),
      strips:[ribbon(805,890,2,.60,1.04,.11),ribbon(1445,1530,1,1.64,2.08,.11),
        ribbon(2085,2170,0,2.68,3.12,.11),ribbon(2725,2810,1,3.72,4.16,.11)]},[],{path:'spiral'}),
  course('conduits-switchback','conduits','SWITCHBACK','inside',
    'Reverse across the tube while reading changing phases. The next opening never shares your line.',
    {obstacles:holes([[320,0],[630,.60],[940,1.20],[1250,.60],[1560,0],[1870,-.64],
      [2180,-1.28],[2490,-.64],[2800,.02],[3110,.66],[3420,.02],[3690,-.62]],.105),
      gates:signals([[450,2],[760,0],[1070,1],[1690,2],[2000,1],[2620,0],[3240,2],[3550,1]]),
      strips:[ribbon(1310,1440,1,.54,.04,.11),ribbon(2850,2980,0,.08,.60,.11)]},[],{path:'switchback',mirror:-1}),
  course('conduits-flow','conduits','TUNNEL FLOW','inside',
    'A full spiral, a reverse spiral, then alternating turns. Phase changes keep coming between passages.',
    {obstacles:holes([[300,0],[590,.56],[880,1.12],[1170,1.68],[1460,2.24],
      [1800,1.62],[2090,1],[2380,.38],[2670,-.24],[2960,-.86],
      [3300,-.18],[3590,.50],[3880,-.18],[4170,.50]],.10),
      gates:signals([[430,1],[1010,2],[1310,0],[1930,1],[2510,2],[2810,0],[3430,2],[3720,1],[4010,0]]),
      strips:[ribbon(645,770,1,.64,1.04,.10),ribbon(2150,2270,1,.94,.44,.10),
        ribbon(3020,3170,0,-.78,-.26,.10)]},[],{path:'spiral',mirror:-1,amount:1.15}),

  // The jump introduction reuses tube steering and phases. Later courses
  // combine flight with rotations immediately, rather than repeating tutorials.
  course('broken-span-hurdles','broken-span','HURDLES','inside',
    'Jump amber hurdles and gaps, then rotate to the landing passage. Match the powered lane for the long launch.',
    {obstacles:[hurdle(400),passage(790,.40,.135),hurdle(1080),passage(1470,-.40,.13),
        passage(2230,.35,.13),passage(3350,0,.125)],
      gates:signals([[580,1],[1280,2],[2100,0],[3520,1]]),
      gaps:[gap(1760,1840),gap(2720,2920)],strips:[power(2340,2708,0)]},[
      cue(40,300,'JUMP THE AMBER BARRIER','Space jumps. Release it between jumps; land before entering a white opening.','Left pad up jumps. Pull back between jumps; land before entering a white opening.'),
      cue(1490,1660,'JUMP AT THE EDGE','This first gap needs no boost. Jump when the takeoff cue turns ready.','This first gap needs no boost. Push left pad up when the takeoff cue turns ready.'),
      cue(2270,2510,'POWERED LAUNCH','Match cyan, hold W or Shift on the lane, then jump at the edge. Release boost after crossing.','Match cyan, hold right pad up on the lane, then jump at the edge. Release boost after crossing.'),
    ],{path:'spiral',amount:.65}),
  course('broken-span-crossing','broken-span','CROSSING','inside',
    'Cross a gap, rotate to the next passage, match its signal and jump again. Cruise clears the gaps.',
    {gaps:[gap(600,685),gap(1440,1530),gap(2280,2380)],
      obstacles:[...holes([[320,0],[1060,.60],[1910,-.10],[2760,-.75]],.12),hurdle(3100),passage(3500,-.15,.115)],
      gates:signals([[1190,1],[2040,2],[2900,0],[3290,1]])},[],{path:'switchback',amount:.85}),
  course('broken-span-long-reach','broken-span','LONG REACH','authored',
    'Boost across the tube break, rotate through the landing route, then launch from the banked road.',
    {gaps:[gap(1270,1470),gap(3300,3520)],
      gates:signals([[820,0],[2060,1],[2840,2],[4100,1]]),
      strips:[power(860,1258,0),power(2860,3288,2)],
      obstacles:[passage(280,-.40,.24),passage(1900,.60,.12),passage(2290,0,.12),passage(3940,-.40,.23)]},[],
    {path:'sweep',mirror:-1,amount:.85,runs:[{sign:1,enter:380,closed:700,open:2400,exit:2730}]}),
  course('broken-span-landing-line','broken-span','LANDING LINE','authored',
    'Thread, hurdle and fly through an inner tube, an open-road gap and a final rotating jump sequence.',
    {gaps:[gap(1210,1300),gap(2300,2390)],
      gates:signals([[740,1],[2110,2],[2950,0],[3850,1],[4520,2]]),
      obstacles:[passage(280,-.30,.12),hurdle(540),passage(930,.35,.12),passage(1630,0,.12),
        passage(2790,-.45,.23),passage(3110,0,.23),passage(3720,0,.115),passage(4070,.60,.115),hurdle(4350),passage(4750,0,.115)]},[],
    {path:'switchback',runs:[{sign:1,enter:-400,closed:0,open:1690,exit:1990},
      {sign:1,enter:3200,closed:3520,open:6000,exit:6320}]}),

  // Relay Grid introduces denser phase phrases, not the phase controls again.
  course('relay-grid-pulse','relay-grid','PULSE','inside',
    'Three signals form a phrase. Match the rhythm while rotating between the passage anchors.',
    {gates:signals([[500,0],[700,1],[900,2],[1250,2],[1450,1],[1650,0],
      [2020,2],[2220,0],[2420,1],[2790,2]]),
      obstacles:[...holes([[360,0],[1100,.60],[1850,-.10],[2630,-.75],[2970,-.10]],.12),hurdle(3200)]},[
      cue(30,290,'READ THE PHRASE','Cyan, amber, violet; then the pattern reverses. Look through the nearest gate to the next.'),
    ],{path:'spiral',amount:.85}),
  course('relay-grid-switch-thread','relay-grid','SWITCH AND THREAD','inside',
    'Match, rotate, thread; jump breaks up the rhythm. Land before committing to the next opening.',
    {gates:signals([[430,1],[740,2],[1120,0],[1460,1],[1780,2],[2150,0],[2500,2],[2820,1],[3440,0]]),
      obstacles:[...holes([[300,0],[610,.56],[1320,1.12],[1640,.56],[2360,0],[2680,-.62],[3000,-1.24],[3660,-.62]],.11),
        hurdle(920),hurdle(1960),hurdle(3250)],
      strips:[ribbon(1510,1560,1,1.02,.65,.11),ribbon(2540,2620,2,-.08,-.54,.11)]},[],{path:'switchback'}),
  course('relay-grid-rotating-signal','relay-grid','ROTATING SIGNAL','inside',
    'Keep the spiral moving through signals and hurdles, then reverse the orbit without losing the phase rhythm.',
    {gates:signals([[470,0],[820,1],[1170,2],[1550,0],[1910,1],[2260,2],[2610,0],[3000,2],[3370,1]]),
      obstacles:[...holes([[320,0],[670,.60],[1020,1.20],[1770,1.80],[2120,2.40],[2470,1.80],[3230,1.20],[3580,.60]],.105),
        hurdle(1360),hurdle(2820)],
      strips:[ribbon(860,970,1,.66,1.14,.10),ribbon(2310,2400,2,2.34,1.88,.10)]},[],{path:'orbit',mirror:-1,amount:.9}),
  course('relay-grid-circuit','relay-grid','RELAY CIRCUIT','authored',
    'A fast tube relay unfolds into a road jump, then closes around a reversing phase sequence.',
    {gates:signals([[420,0],[710,1],[1000,2],[1390,1],[1740,0],[2440,2],[3820,1],[4110,2],[4400,0]]),
      gaps:[gap(2660,2750)],
      obstacles:[...holes([[300,0],[590,.58],[880,1.16],[1600,.58],[1900,0],
        [3700,0],[3990,-.64],[4280,-1.28],[4570,-.64]],.105),hurdle(1190),passage(3100,0,.22)]},[],
    {path:'switchback',mirror:-1,runs:[{sign:1,enter:-360,closed:0,open:1990,exit:2310},
      {sign:1,enter:3160,closed:3480,open:5700,exit:6020}]}),

  // Exterior routes carry phases and jumps forward from the very first course.
  course('outer-ring-orbit','outer-ring','ORBIT','outside',
    'Take familiar steering, phases and jumping onto the outer shell. Keep turning through the white openings.',
    {obstacles:[...holes([[320,0,.14],[660,.45,.13],[1000,.95,.125],[1340,1.45,.12],
      [2090,.85,.12],[2430,.25,.12],[2780,-.35,.12]],.12),hurdle(1680)],
      gates:signals([[790,1],[1130,2],[1470,0],[1870,1],[2220,2],[2560,0]])},[
      cue(30,250,'OUTSIDE THE RING','Use the same steering around the outer shell. Rotate to each white opening.','Use the left pad around the outer shell. Rotate to each white opening.'),
    ],{path:'orbit',amount:.75}),
  course('outer-ring-helix','outer-ring','HELIX','outside',
    'Colored lanes spiral around the shell. Change phase, ride the lane, then thread or jump.',
    {obstacles:[...holes([[360,.25],[760,.75],[1160,1.25],[1940,1.75],[2340,2.25],
      [2740,2.75],[3140,3.25],[3540,3.75]],.11),hurdle(1510)],
      gates:signals([[490,1],[890,2],[1290,0],[1700,1],[2070,2],[2470,0],[2870,2],[3270,1]]),
      strips:[ribbon(540,650,1,.25,.75,.11),ribbon(940,1050,2,.75,1.25,.11),
        ribbon(1750,1830,1,1.30,1.75,.11),ribbon(2120,2230,2,1.75,2.25,.11),
        ribbon(2520,2630,0,2.25,2.75,.11),ribbon(2920,3030,2,2.75,3.25,.11),ribbon(3320,3430,1,3.25,3.75,.11)]},[],{path:'orbit'}),
  course('outer-ring-fast-line','outer-ring','FAST LINE','outside',
    'Accelerate into alternating rotations, then brake to settle. Phase shifts and a hurdle interrupt the line.',
    {obstacles:[...holes([[440,0],[850,.64],[1260,.02],[1670,-.62],[2080,.02],[2490,.66],[3270,.02],[3680,-.62]],.105),hurdle(2840)],
      gates:signals([[570,1],[980,2],[1390,0],[1800,1],[2210,2],[2620,0],[3030,1],[3400,2]]),
      strips:[ribbon(630,760,1,.04,.58,.10),ribbon(1040,1170,2,.60,.08,.10),ribbon(1450,1580,0,-.02,-.56,.10),
        ribbon(1860,1990,1,-.58,-.04,.10),ribbon(2270,2400,2,.06,.60,.10),ribbon(3460,3590,2,-.02,-.56,.10)]},[],
    {path:'switchback',mirror:-1,amount:1.1}),
  course('outer-ring-run','outer-ring','RING RUN','outside',
    'Burst into a helix, jump the tube break, reverse the orbit and clear the final hurdle sequence.',
    {obstacles:[...holes([[300,0],[830,.65],[1570,1.30],[1960,1.95],[2880,1.30],[3270,.65],[4060,0],[4440,-.65]],.105),
        hurdle(1150),hurdle(3640)],
      gates:signals([[440,0],[970,1],[1350,2],[2090,0],[3020,1],[3410,2],[4200,0]]),
      gaps:[gap(2380,2470)],
      strips:[ribbon(480,660,0,0,.65,.11),ribbon(1640,1810,2,1.30,1.95,.11),ribbon(3070,3150,1,1.20,.75,.10)]},[],
    {path:'orbit',mirror:-1,amount:1.1}),

  // Nexus varies surfaces from its first course. Every later course combines
  // the full vocabulary; centered passages lead into every unfolding section.
  course('nexus-thread-land','nexus','THREAD AND LAND','authored',
    'Banked road, inner-tube relay, road jump and outer spiral. Settle at the center when a tube opens.',
    {obstacles:[passage(300,-.40,.22),hurdle(650),passage(1060,0,.22),
        ...holes([[1620,.10],[1960,.62],[2300,0],[4140,0],[4490,-.60],[4840,-1.20],[5190,-.60]],.11),passage(3550,0,.22)],
      gates:signals([[440,1],[850,2],[1750,0],[2090,1],[2860,2],[4270,0],[4620,1],[4970,2]]),
      gaps:[gap(3070,3160)]},[
      cue(30,220,'LINKED SURFACES','Keep the skills flowing. Return to the center opening before a tube unfolds.'),
    ],{path:'sweep',runs:[{sign:1,enter:1140,closed:1440,open:2450,exit:2730},
      {sign:-1,enter:3650,closed:3950,open:6300,exit:6620}]}),
  course('nexus-signal-flight','nexus','SIGNAL AND FLIGHT','inside',
    'Powered jumps break up a rotating phase run. Land, turn to the next passage, then set up the next launch.',
    {gates:signals([[440,0],[1690,1],[2980,2],[4270,0],[4690,1]]),
      strips:[power(480,900,0),power(1750,2150,1),power(3040,3440,2)],
      gaps:[gap(912,1112),gap(2162,2382),gap(3452,3692)],
      obstacles:[...holes([[300,0],[1520,.60],[2800,-.10],[4130,-.75],[4910,-.15]],.105),hurdle(4490)]},[],
    {path:'spiral',mirror:-1,amount:.8}),
  course('nexus-surface-shift','nexus','SURFACE SHIFT','authored',
    'Hurdles and signals weave through inward and outward folds. Carry each landing into the next rotation.',
    {obstacles:[hurdle(300),passage(710,0,.22),hurdle(2120),passage(3730,0,.22),hurdle(5100),
        ...holes([[1440,.15],[1780,.70],[2540,0],[4450,0],[4760,-.65],[5520,-1.30],[5870,-.65],[6200,0]],.105)],
      gates:signals([[860,0],[1570,1],[1910,2],[2320,0],[3870,1],[4580,2],[4890,0],[5300,1],[5650,2],[6000,0]]),
      gaps:[gap(3240,3330)]},[],
    {path:'switchback',runs:[{sign:1,enter:950,closed:1250,open:2630,exit:2930},
      {sign:-1,enter:3970,closed:4270,open:7200,exit:7520}]}),
  course('nexus-grand-circuit','nexus','GRAND CIRCUIT','authored',
    'A sustained road slalom, inner relay, powered flight and outer spiral. Every learned action returns.',
    {obstacles:[hurdle(340),passage(730,-.45,.22),passage(1060,0,.22),hurdle(2280),passage(4990,0,.22),hurdle(6380),
        ...holes([[1630,0],[1940,.60],[2690,1.20],[3000,.60],[3310,0],
          [5730,0],[6040,-.62],[6800,-1.24],[7150,-.62],[7500,0]],.10)],
      gates:signals([[870,0],[1760,1],[2070,2],[2480,0],[2820,1],[3130,2],[3880,0],
        [5130,1],[5860,2],[6170,0],[6580,1],[6930,2],[7280,0]]),
      strips:[power(3930,4338,0),ribbon(2860,2920,1,1.10,.72,.10),ribbon(6970,7060,2,-1.16,-.70,.10)],
      gaps:[gap(4350,4570)]},[],
    {path:'orbit',mirror:-1,runs:[{sign:1,enter:1140,closed:1440,open:3420,exit:3720},
      {sign:-1,enter:5240,closed:5540,open:8400,exit:8720}]}),
];

export function campaignArea(index){return CAMPAIGN_AREAS.find(area=>area.id===CAMPAIGN_LEVELS[index]?.area);}
export function areaLevels(areaId){return CAMPAIGN_LEVELS.map((level,index)=>({...level,index})).filter(level=>level.area===areaId);}
export function campaignLabel(index){
  const area=campaignArea(index),level=CAMPAIGN_LEVELS[index];
  const first=CAMPAIGN_LEVELS.findIndex(entry=>entry.area===area.id);
  return `${area.number}.${index-first+1} / ${level.name}`;
}

// Numeric saves from the removed campaign describe different tracks. New
// completion and records use stable course IDs and a separate save namespace.
export class CampaignProgress {
  constructor(){
    this.key='vector-shift-areas-001';this.completed=new Set();
    try{
      const saved=JSON.parse(localStorage.getItem(this.key));
      if(Array.isArray(saved?.completed))for(const id of saved.completed){
        if(CAMPAIGN_LEVELS.some(level=>level.id===id))this.completed.add(id);
      }
    }catch{/* Progress remains available in memory when storage is unavailable. */}
  }
  areaComplete(id){return areaLevels(id).every(level=>this.completed.has(level.id));}
  unlocked(id){
    const at=CAMPAIGN_AREAS.findIndex(area=>area.id===id);
    return at>=0&&CAMPAIGN_AREAS.slice(0,at).every(area=>this.areaComplete(area.id));
  }
  recommended(){
    const next=CAMPAIGN_LEVELS.findIndex(level=>this.unlocked(level.area)&&!this.completed.has(level.id));
    return next<0?CAMPAIGN_LEVELS.length-1:next;
  }
  complete(index){
    this.completed.add(CAMPAIGN_LEVELS[index].id);
    try{localStorage.setItem(this.key,JSON.stringify({completed:[...this.completed]}));}catch{/* Optional storage. */}
  }
}
