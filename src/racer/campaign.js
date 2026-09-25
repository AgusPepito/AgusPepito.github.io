// Authored campaign: each course introduces or develops one clear demand.
// All obstacle widths are surface-coordinate HALF widths, as in obstacles.js.
export const CAMPAIGN_AREAS = [
  {id:'dockyards',name:'DOCKYARDS',number:'01',theme:'OPEN ROAD',description:'Find your line. Learn the phases. Leave the docks.',skill:'Steering · phase matching',image:'assets/areas/dockyards-r1.png'},
  {id:'conduits',name:'CONDUITS',number:'02',theme:'INNER TUBE',description:'Thread the openings and find a rhythm around the tube.',skill:'Passages · spirals · reversals',image:'assets/areas/conduits-r1.png'},
  {id:'broken-span',name:'BROKEN SPAN',number:'03',theme:'JUMP ROUTES',skill:'Hurdles · gaps · landings',image:'assets/areas/broken-span-r1.png'},
  {id:'relay-grid',name:'RELAY GRID',number:'04',theme:'PHASE RHYTHM',skill:'Switch · steer · thread',image:'assets/areas/relay-grid-r1.png'},
  {id:'outer-ring',name:'OUTER RING',number:'05',theme:'EXTERIOR TUBE',skill:'Helices · fast lines · braking',image:'assets/areas/outer-ring-r1.png'},
  {id:'nexus',name:'NEXUS',number:'06',theme:'MASTERY CIRCUIT',skill:'Linked surfaces · combined skills',image:'assets/areas/nexus-r1.png'},
];
export const CAMPAIGN_LAYOUT_REVISION='r2';
const gate=(s,phase)=>({s,phase,center:0,width:1,full:true});
const lane=(start,end,phase,u=0)=>({start,end,phase,from:u,to:u,width:.26});
const wall=(s,center,width)=>({s,kind:'wall',center,width,depth:5});
const passage=(s,center,width)=>({s,kind:'hole',center:((center+1)%2+2)%2-1,width,depth:5,height:9});
const hurdle=s=>({s,kind:'jump',center:0,width:1,depth:5,height:2.4});
const gap=(start,end)=>({start,end,center:0,width:1,full:true});
const ribbon=(start,end,phase,from,to,width=.105)=>({start,end,phase,from,to,width});
// Full-width powered approaches let a matching phase supply launch thrust even
// with an empty battery. A long gap still requires holding boost before jumping.
const power=(start,end,phase)=>ribbon(start,end,phase,0,0,1);
const cue=(start,end,title,pc,touch=pc)=>({start,end,title,pc,touch});
const course=(id,area,name,profile,lesson,data,hints,runs=[])=>{
  const encounters={gates:[],strips:[],obstacles:[],gaps:[],chains:[],...data};
  // End shortly after the last authored encounter, including its physical depth.
  // Keeping this derived prevents long empty checkpoint exits as layouts change.
  const last=Math.max(0,...encounters.gates.map(g=>g.s+9),...encounters.obstacles.map(o=>o.s+o.depth),
    ...encounters.strips.map(strip=>strip.end),...encounters.gaps.map(gap=>gap.end));
  return {id,area,name,length:Math.ceil((last+140)/10)*10,profile,runs,lesson,hints,data:encounters};
};

export const CAMPAIGN_LEVELS = [
  course('dockyards-clear-route','dockyards','CLEAR ROUTE','flat',
    'Steer around solid walls and through white-lit openings. Any phase is safe here.',
    {obstacles:[wall(420,0,.30),wall(780,-.36,.40),passage(1100,.42,.25),
      wall(1400,.38,.42),passage(1740,-.40,.24),passage(2050,.42,.24)]},[
      cue(40,330,'FIND YOUR LINE','A / D or ← / → to steer. Pass either side of the wall.','Left pad: drag sideways. Pass either side of the wall.'),
      cue(800,1010,'THROUGH THE OPENING','Follow the white arrows. Stay low; no jump needed.'),
    ]),
  course('dockyards-first-shift','dockyards','FIRST SHIFT','flat',
    'Match cyan and amber gates. Each color also has its own symbol.',
    {gates:[gate(430,0),gate(740,1),gate(1040,0),gate(1320,1),
      gate(1560,0),gate(1790,1),gate(2020,0),gate(2250,1)]},[
      cue(40,350,'CYAN / ION ●','Press 1 for cyan before the gate.','Right pad left selects cyan before the gate.'),
      cue(460,670,'AMBER / SOL ▲','Press 2 for amber. Match the next gate.','Right pad down selects amber. Match the next gate.'),
    ]),
  course('dockyards-third-signal','dockyards','THIRD SIGNAL','flat',
    'Add violet to your phases. Matching a colored lane gives free acceleration.',
    {gates:[gate(540,0),gate(850,1),gate(1180,2),gate(1450,0),
      gate(1720,2),gate(2000,1),gate(2280,0),gate(2560,2)],
    strips:[lane(200,460,0),lane(1220,1380,2,.38),lane(1780,1940,2,-.38),lane(2330,2490,0,.38)]},[
      cue(40,400,'MATCH THE LANE','Press 1 and follow cyan for free acceleration.','Select cyan with the right pad left. Follow its lane for free acceleration.'),
      cue(880,1110,'VIOLET / FLUX ◆','Press 3 for violet. The next lane uses the same phase.','Right pad right selects violet. The next lane uses the same phase.'),
      cue(1470,1630,'CONTROL YOUR SPEED','W boosts. Tap S to brake before the next gate.','Right pad up boosts. Left pad down brakes before the next gate.'),
    ]),
  course('dockyards-departure','dockyards','DEPARTURE','flat',
    'Use what you know: steer, match a phase, then line up with the opening. Boost is optional.',
    {gates:[gate(680,1),gate(1200,2),gate(1990,0),gate(2500,1),gate(3020,2)],
      strips:[lane(970,1100,1,-.45),lane(2540,2670,1,.42)],
      obstacles:[wall(420,0,.32),passage(930,-.45,.23),passage(1470,.44,.22),wall(1730,.35,.43),
        passage(2250,-.42,.22),passage(2760,.42,.21),passage(3270,-.40,.21)]},[
      cue(40,320,'DEPARTURE','Steer, match, then thread. Read one action ahead.'),
      cue(3050,3190,'SET UP YOUR EXIT','Release boost and line up with the final opening.'),
    ]),
  course('conduits-thread','conduits','THREAD THE NEEDLE','inside',
    'Rotate to each offset opening. Release steering through the passage; any phase works.',
    {obstacles:[[500,0,.135],[900,.40,.135],[1290,-.08,.125],[1680,-.52,.125],
      [2050,-.02,.125],[2420,.46,.12],[2790,-.12,.12]].map(([s,u,width])=>passage(s,u,width))},[
      cue(40,390,'INSIDE THE CONDUIT','A / D steers around the tube. Follow the white opening.','Drag the left pad sideways to rotate. Follow the white opening.'),
      cue(1320,1540,'TURN, THEN SETTLE','Rotate left to the next opening. Release steering as you pass.'),
    ]),
  course('conduits-spiral','conduits','SPIRAL RUN','inside',
    'Openings step around the tube in one direction. Turn between them, then settle through each one.',
    {obstacles:[[500,0],[820,.46],[1140,.92],[1440,1.38],[1740,1.86],
      [2040,2.34],[2340,2.82],[2630,3.32],[2920,3.82],[3210,4.32]].map(([s,u])=>passage(s,u,.105))},[
      cue(40,390,'FOLLOW THE SPIRAL','The openings rotate right. Turn between them; settle as you pass.'),
      cue(1770,1940,'KEEP ROTATING','Continue right around the tube. The next opening is another quarter turn.'),
    ]),
  course('conduits-switchback','conduits','SWITCHBACK','inside',
    'Commit to longer rotations, then reverse. Read the next opening before adding speed.',
    {obstacles:[[500,0],[810,.56],[1120,1.12],[1430,.56],[1740,0],[2040,-.58],
      [2340,-1.16],[2640,-.58],[2940,.02],[3230,.66],[3520,.02],[3810,-.62]].map(([s,u])=>passage(s,u,.10))},[
      cue(40,390,'READ THE NEXT OPENING','This route turns right, then back left.'),
      cue(1150,1340,'REVERSE THE ARC','The next opening is back to your left.'),
      cue(2370,2550,'REVERSE AGAIN','Turn back right. Brake if you need more time.'),
    ]),
  course('conduits-flow','conduits','TUNNEL FLOW','inside',
    'Full rotations, a reverse spiral, then alternating openings. Keep moving until the checkpoint.',
    {obstacles:[[500,0],[790,.50],[1080,1],[1370,1.50],[1660,2],
      [2000,1.40],[2280,.80],[2560,.20],[2840,-.40],[3120,-1],
      [3460,-.36],[3730,.28],[4000,-.40],[4270,.24],[4540,-.44]].map(([s,u])=>passage(s,u,.095))},[
      cue(40,390,'TUNNEL FLOW','Rotate right, reverse, then alternate. Stay ready for the next opening.'),
      cue(1690,1900,'NEXT / REVERSE','The next spiral turns back left.'),
      cue(3150,3350,'NEXT / SWITCHBACK','Right, right, then alternate. Keep boost under control.'),
    ]),
  // Broken Span: jump timing first, then gaps and powered launches. Passages
  // after gaps sit beyond the fast-jump landing range, not at the landing lip.
  course('broken-span-hurdles','broken-span','HURDLES','gap-flat',
    'Jump the low amber barriers. Release jump between hurdles; braking gives you time to land.',
    {obstacles:[520,920,1320,1690,2040,2390,2740].map(hurdle)},[
      cue(60,390,'JUMP THE BARRIER','Space jumps. Follow the upward lights; release Space between jumps.','Push the left pad up to jump. Pull back between jumps to rearm.'),
      cue(1360,1570,'LAND BEFORE THE NEXT','Release boost. Tap S if the next hurdle is arriving too quickly.','Release boost. Pull the left pad down if the next hurdle arrives too quickly.'),
    ]),
  course('broken-span-crossing','broken-span','CROSSING','gap-flat',
    'Jump near the edge. These short gaps can be crossed at normal cruise speed.',
    {gaps:[gap(560,640),gap(1050,1135),gap(1540,1630),gap(2030,2125),gap(2520,2620)],
      obstacles:[passage(2950,0,.30)]},[
      cue(60,410,'WAIT FOR THE EDGE','No boost needed. Press Space when the jump cue says JUMP.','No boost needed. Push the left pad up when the cue says JUMP.'),
      cue(1740,1910,'JUMP, LAND, REARM','Release Space after takeoff so the next jump is ready.','Pull the left pad back after takeoff so the next jump is ready.'),
      cue(2710,2850,'LAND AND LINE UP','Settle onto the road, then take the white opening.'),
    ]),
  course('broken-span-long-reach','broken-span','LONG REACH','gap-flat',
    'Match cyan on the powered approach, hold boost, then jump near the lip. The lane supplies boost even with an empty battery.',
    {gaps:[gap(900,1100),gap(1990,2210),gap(3130,3370)],
      strips:[power(480,888,0),power(1570,1978,0),power(2690,3118,0)],
      obstacles:[passage(1500,0,.30),passage(2610,0,.28),passage(3760,0,.26)]},[
      cue(60,420,'POWERED TAKEOFF','Select cyan with 1. Hold W on the cyan approach, then jump near the edge.','Select cyan with right pad left. Hold right pad up on the lane; jump near the edge.'),
      cue(520,750,'BUILD SPEED FIRST','Keep W held on cyan. Wait for the jump cue to turn ready.','Keep the right pad up on cyan. Wait for the jump cue to turn ready.'),
      cue(1180,1390,'RELEASE AND LAND','Release W after crossing. Tap S before the opening if needed.','Release boost after crossing. Pull left pad down before the opening if needed.'),
      cue(2720,2930,'LONGEST SPAN','The cyan lane supplies thrust even with an empty battery. Hold boost before jumping.'),
    ]),
  course('broken-span-landing-line','broken-span','LANDING LINE','gap-flat',
    'Jump, land, then steer to the opening. Cruise clears the gaps; avoid entering a passage while airborne.',
    {gaps:[gap(1280,1370),gap(2820,2920)],
      obstacles:[hurdle(500),passage(920,-.35,.26),passage(1800,.35,.25),
        hurdle(2160),passage(2580,-.35,.24),passage(3370,.35,.24)]},[
      cue(60,370,'LAND, THEN THREAD','Jump the barrier. Land before steering through the opening on the left.'),
      cue(1430,1650,'SET UP THE LANDING','Release boost and move right after landing. Stay low through the opening.'),
      cue(3020,3240,'FINAL LANDING LINE','One last opening on the right. Settle before entering.'),
    ]),

  // Relay Grid: familiar phases followed by steering, never a first jump lesson.
  course('relay-grid-pulse','relay-grid','PULSE','flat',
    'Read repeated three-phase patterns, then their reversal. Steering is free here.',
    {gates:[[480,0],[760,1],[1040,2],[1310,0],[1580,1],[1850,2],
      [2160,2],[2390,1],[2620,0],[2850,1],[3080,2]].map(([s,p])=>gate(s,p))},[
      cue(60,360,'FIND THE PULSE','Cyan, amber, violet. Use 1, 2, 3 and look one gate ahead.','Cyan, amber, violet. Right pad left, down, right; look one gate ahead.'),
      cue(1900,2070,'REVERSE THE PATTERN','Violet, amber, cyan. Read the color instead of repeating by memory.'),
    ]),
  course('relay-grid-switch-thread','relay-grid','SWITCH AND THREAD','flat',
    'Choose a phase, cross its gate, then steer into the white opening. Repeat across alternating sides.',
    {gates:[[450,0],[980,1],[1510,2],[2040,0],[2570,2],[3100,1]].map(([s,p])=>gate(s,p)),
      obstacles:[[690,-.42,.23],[1220,.42,.23],[1750,-.42,.22],[2280,.42,.22],
        [2810,-.42,.21],[3340,.42,.21]].map(([s,u,w])=>passage(s,u,w))},[
      cue(60,350,'SWITCH, THEN STEER','Match the phase gate first. The next white opening is on the left.'),
      cue(1260,1430,'KEEP THE TWO-STEP','Set your phase early, then line up with the next passage.'),
    ]),
  course('relay-grid-rotating-signal','relay-grid','ROTATING SIGNAL','inside',
    'Phase gates alternate with rotating tube passages. Complete each switch before the precise turn.',
    {gates:[[500,0],[1000,1],[1500,2],[2000,0],[2500,1],[3000,2]].map(([s,p])=>gate(s,p)),
      obstacles:[[760,0],[1260,.42],[1760,.88],[2260,1.34],[2760,1.80],[3260,2.26]]
        .map(([s,u])=>passage(s,u,.12))},[
      cue(60,390,'SIGNALS IN THE TUBE','Match the color, then rotate to the white opening. No jumps here.'),
      cue(1800,1910,'KEEP TURNING RIGHT','The passages keep rotating right; the gates keep their three-color rhythm.'),
    ]),
  course('relay-grid-circuit','relay-grid','RELAY CIRCUIT','inside',
    'Switch and rotate through repeated phrases, then reverse direction while reading the next phase.',
    {gates:[[450,0],[870,1],[1290,2],[1710,1],[2130,0],[2550,2],[2970,0],[3400,1]].map(([s,p])=>gate(s,p)),
      obstacles:[[660,0],[1080,.46],[1500,.94],[1920,.46],[2340,-.04],[2760,-.54],
        [3180,0],[3610,.56]].map(([s,u])=>passage(s,u,.11))},[
      cue(50,340,'RELAY CIRCUIT','Read the phase first, then the opening. Keep boost optional.'),
      cue(1540,1650,'REVERSE LEFT','The next opening turns back left. Amber comes first.'),
      cue(2800,2910,'TURN BACK RIGHT','The final phrase turns right. Cyan, then amber.'),
    ]),

  // Outer Ring: the outside shell has a slower unpowered route everywhere.
  // Lane exits precede openings so releasing/braking is a deliberate action.
  course('outer-ring-orbit','outer-ring','ORBIT','outside',
    'Drive around the outside of the tube. Use the same steering as Conduits; any phase is safe.',
    {obstacles:[[500,0],[900,.32],[1300,.68],[1700,1.04],[2080,.62],[2460,.20],
      [2840,-.24],[3220,0]].map(([s,u])=>passage(s,u,.12))},[
      cue(50,390,'OUTSIDE THE RING','A / D rotates around the outer shell. Follow the white opening.','Drag the left pad sideways to rotate around the outer shell.'),
      cue(1740,1950,'REVERSE YOUR ORBIT','The next openings turn back left. Keep the road under the ship.'),
    ]),
  course('outer-ring-helix','outer-ring','HELIX','outside',
    'Cyan lanes spiral around the shell. Follow them for speed, then settle through each opening.',
    {obstacles:[[620,.35],[1020,.80],[1420,1.25],[1820,1.70],[2220,2.15],
      [2620,2.60],[3020,3.05],[3420,3.50],[3820,3.95]].map(([s,u])=>passage(s,u,.11)),
      strips:[ribbon(200,470,0,0,.35),ribbon(680,870,0,.35,.80),ribbon(1080,1270,0,.80,1.25),
        ribbon(1480,1670,0,-.75,-.30),ribbon(1880,2070,0,-.30,.15),ribbon(2280,2470,0,.15,.60),
        ribbon(2680,2870,0,.60,1.05),ribbon(3080,3270,0,-.95,-.50),ribbon(3480,3670,0,-.50,-.05)]},[
      cue(40,350,'FOLLOW THE HELIX','Select cyan with 1. The lane rotates right; settle at each white opening.','Select cyan with right pad left. Follow the lane right; settle at each opening.'),
      cue(2250,2410,'KEEP THE SAME DIRECTION','Continue around the shell. Release steering as you enter each passage.'),
    ]),
  course('outer-ring-fast-line','outer-ring','FAST LINE','outside',
    'Amber lanes reward a precise fast route. Leaving the lane gives a slower approach to the same opening.',
    {obstacles:[[620,0],[1080,.52],[1540,.04],[2000,-.48],[2460,.04],[2920,.56],[3380,.08],[3840,-.44]]
        .map(([s,u])=>passage(s,u,.11)),
      strips:[ribbon(200,390,1,-.30,0,.09),ribbon(680,850,1,0,.52,.09),ribbon(1140,1310,1,.52,.04,.09),
        ribbon(1600,1770,1,.04,-.48,.09),ribbon(2060,2230,1,-.48,.04,.09),ribbon(2520,2690,1,.04,.56,.09),
        ribbon(2980,3150,1,.56,.08,.09),ribbon(3440,3610,1,.08,-.44,.09)]},[
      cue(50,360,'CHOOSE YOUR PACE','Select amber with 2 to use the fast lane. Unlit road remains a slower route.','Select amber with right pad down for the fast lane. Unlit road is the slower route.'),
      cue(1590,1780,'SPEED HAS AN EXIT','Release W as the lane ends. Tap S if you need more time to align.','Release boost as the lane ends. Pull left pad down for more time to align.'),
    ]),
  course('outer-ring-run','outer-ring','RING RUN','outside',
    'Accelerate along a matching lane, release or brake, then thread two openings before the next burst.',
    {gates:[gate(1590,1),gate(2700,2),gate(3810,0)],
      strips:[ribbon(300,680,0,0,.45),ribbon(1650,1850,1,.05,-.55),
        ribbon(2760,2960,2,-.10,.50),ribbon(3870,4070,0,.08,-.52)],
      obstacles:[[1000,.45],[1260,.05],[2140,-.55],[2410,-.10],[3250,.50],[3520,.08],
        [4360,-.52],[4630,-.08]].map(([s,u])=>passage(s,u,.10))},[
      cue(50,300,'BURST, BRAKE, THREAD','Match cyan to start. Each lane ends before a pair of openings.'),
      cue(730,890,'END THE BURST','Release W and tap S. Thread both openings before accelerating again.','Release right pad up and pull left pad down. Thread both openings before boosting again.'),
      cue(4110,4250,'FINAL PAIR','Leave the lane, settle your speed, then finish through two openings.'),
    ]),

  // Nexus combines learned actions, with intact landing corridors and clear
  // transitions. The final tube passage returns to the center before unfolding.
  course('nexus-thread-land','nexus','THREAD AND LAND','gap-flat',
    'Thread a passage, jump, land, then reposition. Normal speed clears these gaps.',
    {gaps:[gap(1560,1660),gap(3200,3300)],
      obstacles:[passage(480,-.42,.23),hurdle(820),passage(1220,.42,.23),
        passage(2080,-.42,.22),hurdle(2440),passage(2860,.42,.22),passage(3720,-.42,.22)]},[
      cue(50,350,'THREAD AND LAND','Stay low through the opening. Jump the barrier after it, then land before turning.'),
      cue(1690,1930,'LAND BEFORE TURNING','Release boost. The next opening is on the left, beyond the landing.'),
    ]),
  course('nexus-signal-flight','nexus','SIGNAL AND FLIGHT','gap-flat',
    'Set your phase before the powered approach, build speed, jump, then land through a broad corridor.',
    {gates:[gate(450,0),gate(1890,1),gate(3350,2)],
      strips:[power(510,948,0),power(1950,2388,1),power(3410,3848,2)],
      gaps:[gap(960,1160),gap(2400,2620),gap(3860,4100)],
      obstacles:[passage(1580,0,.24),passage(3040,0,.23),passage(4530,0,.22)]},[
      cue(50,350,'SIGNAL BEFORE FLIGHT','Cyan first. Match the gate, hold W on the lane, then jump at the lip.','Cyan first. Match the gate, hold right pad up on the lane, then jump at the lip.'),
      cue(1660,1800,'AMBER LAUNCH','Switch to amber before the gate. Its lane supplies the next powered takeoff.'),
      cue(3110,3260,'VIOLET LAUNCH','The final launch is violet. Build speed before jumping; release boost after crossing.'),
    ]),
  course('nexus-surface-shift','nexus','SURFACE SHIFT','authored',
    'Flat road, inner tube, flat connector, outer tube, then road. Centered exit passages prepare each transition.',
    {gates:[gate(2930,1),gate(5540,2)],
      obstacles:[passage(420,0,.24),...[[1210,0],[1470,.48],[1730,.96],[1990,.48],[2250,0],
        [3890,0],[4140,-.46],[4390,-.92],[4640,-.46],[4890,0]].map(([s,u])=>passage(s,u,.12)),
        passage(5820,.40,.22)]},[
      cue(50,310,'SURFACE SHIFT','The road folds into a tube. Stay centered through the first transition.'),
      cue(2310,2640,'RETURN TO OPEN ROAD','Keep your line centered while the tube unfolds.'),
      cue(3080,3490,'OUTSIDE COMES NEXT','The next tube bends outward. Stay centered until it closes.'),
      cue(4960,5270,'FINAL UNFOLD','Hold the center line. Violet and one final opening await on the road.'),
    ],[{sign:1,enter:650,closed:1050,open:2350,exit:2750},
      {sign:-1,enter:3250,closed:3650,open:4950,exit:5350}]),
  course('nexus-grand-circuit','nexus','GRAND CIRCUIT','authored',
    'A complete circuit: hurdle and passage, inner-tube relays, a road gap, then an exterior signal run.',
    {gates:[gate(1140,1),gate(2270,2),gate(2670,0),gate(5340,1),gate(5740,2),gate(6140,0)],
      gaps:[gap(3760,3850)],
      obstacles:[hurdle(450),passage(870,-.40,.22),...[[2070,0],[2470,.52],[2870,0]]
        .map(([s,u])=>passage(s,u,.11)),passage(4240,0,.22),
        ...[[5140,0],[5540,-.55],[5940,-1.10],[6340,-.55],[6600,0]].map(([s,u])=>passage(s,u,.105))]},[
      cue(50,320,'GRAND CIRCUIT','Use what you know. Jump, land, thread, then match amber.'),
      cue(1250,1660,'NEXT / INNER RELAY','Settle at the center. The tube begins with a white opening, then violet.'),
      cue(2930,3320,'NEXT / ROAD GAP','Stay centered as the tube opens. The next gap needs a normal-speed jump.'),
      cue(4350,4740,'NEXT / OUTER RELAY','Center up for the outer shell. Match the signals and rotate through the openings.'),
      cue(6400,6520,'FINAL OPENING','Return to the center of the shell and cross the checkpoint.'),
    ],[{sign:1,enter:1450,closed:1850,open:3070,exit:3470},
      {sign:-1,enter:4520,closed:4920,open:8000,exit:8400}]),
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
