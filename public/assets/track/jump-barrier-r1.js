import {omitFaces,openBottomBox} from './geometry-cleanup.js';
import {surfaceMaps} from './slab-surface-r1.js';

// Author in surface coordinates. Travel is -Z; all solids stay within
// Y=0..height and Z=0..-5. All details conform with the collision envelope.
function builder(THREE,prefix){
  const root=new THREE.Group(),grain=surfaceMaps(THREE),mats={
    ivory:new THREE.MeshStandardMaterial({color:0xcec9b8,metalness:.3,roughness:.50,...grain,normalScale:new THREE.Vector2(.12,.12)}),
    graphite:new THREE.MeshStandardMaterial({color:0x454e54,metalness:.72,roughness:.43,...grain,normalScale:new THREE.Vector2(.28,.28)}),
    dark:new THREE.MeshStandardMaterial({color:0x10181e,roughness:.8}),
    steel:new THREE.MeshStandardMaterial({color:0x7b8c93,metalness:.8,roughness:.34}),
    brass:new THREE.MeshStandardMaterial({color:0xa98a54,metalness:.7,roughness:.46}),
    light:new THREE.MeshStandardMaterial({color:0xfff3db,emissive:0xfff3db,emissiveIntensity:2,toneMapped:false}),
  };
  for(const [key,m]of Object.entries(mats)){m.name=prefix+'-'+key;if(['ivory','graphite','steel','brass'].includes(key))m.userData.slabFinish=true;}
  function mesh(name,g,key,x=0,y=0,z=0){const m=new THREE.Mesh(g,mats[key]);m.name=name;m.position.set(x,y,z);root.add(m);return m;}
  function box(name,x,y,z,w,h,d,key){return mesh(name,(y-h/2<=.0001?openBottomBox(THREE,w,h,d):new THREE.BoxGeometry(w,h,d)),key,x,y,z);}
  function plateGeometry(w,h,holes=[]){
    const b=Math.min(.09,w/8,h/8),s=new THREE.Shape();
    s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.lineTo(w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.lineTo(w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.lineTo(-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.closePath();
    for(const [x,y,rw,rh]of holes){const p=new THREE.Path();p.moveTo(x-rw/2,y-rh/2);p.lineTo(x-rw/2,y+rh/2);p.lineTo(x+rw/2,y+rh/2);p.lineTo(x+rw/2,y-rh/2);p.closePath();s.holes.push(p);}
    const g=new THREE.ExtrudeGeometry(s,{depth:.09,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1});omitFaces(THREE,g,2,-1);g.translate(0,0,-.108);return g;
  }
  const plate=(name,x,y,z,w,h,key,holes=[])=>mesh(name,plateGeometry(w,h,holes),key,x,y,z);
  function topPlate(name,x,y,z,w,d,key,holes=[]){const g=plateGeometry(w,d,holes);g.rotateX(-Math.PI/2);return mesh(name,g,key,x,y,z);}
  function bolt(x,y,z){const m=mesh('washer-mounted-fastener',new THREE.CylinderGeometry(.052,.052,.04,6),'steel',x,y,z);m.rotation.x=Math.PI/2;box('fastener-drive-slot',x,y,z+.021,.038,.009,.003,'dark');}
  function pipe(x,low,high,z){
    mesh('protected-cooling-conduit',new THREE.CylinderGeometry(.105,.105,high-low,8),'steel',x,(low+high)/2,z);
    for(const y of [low+.15,high-.15]){
      mesh('conduit-coupling',new THREE.CylinderGeometry(.15,.15,.18,8),'brass',x,y,z);
      for(const dy of [-.12,.12])mesh('conduit-seal',new THREE.CylinderGeometry(.13,.13,.04,8),'dark',x,y+dy,z);
    }
  }
  function chevron(x,y,z){
    for(const side of [-1,1]){
      const m=box('inset-white-jump-chevron',x+side*.13,y,z,.075,.38,.04,'light');m.rotation.z=side*Math.PI/4;
    }
  }
  return {root,mesh,box,plate,topPlate,bolt,pipe,chevron,plateGeometry};
}

export default function generate(THREE,{width=18,height=2.4,startCap=true,endCap=true,firstModuleOnly=false}={}){
  const b=builder(THREE,'j3-louver-r1'),{root,box,plate,topPlate,bolt,pipe,chevron}=b;
  root.name='j3-repeatable-louver-barrier';
  const count=Math.max(1,Math.round(width/4.5)),pitch=width/count;
  for(let i=0;i<(firstModuleOnly?1:count);i++){
    const first=root.children.length;
    box('opaque-louver-bank-core',0,(height-.55)/2,-2.925,4.14,height-.55,3.45,'dark');
    box('continuous-ground-plinth',0,.12,-2.5,4.5,.24,5,'graphite');
    box('front-recess-backing',0,height/2,-1.30,4.30,height-.36,.15,'graphite');
    // Full five-metre top deck, with a genuine recessed cooling tray.
    topPlate('ivory-top-service-deck',0,height-.025,-2.5,4.42,4.90,'ivory',[[0,0,2.54,2.66]]);
    box('top-cooling-tray-floor',0,height-.48,-2.5,2.60,.10,2.72,'dark');
    for(let n=0;n<9;n++)box('top-cooling-louver',0,height-.22,-3.62+n*.28,2.34,.12,.10,'steel');
    for(const x of [-1.78,1.78]){
      topPlate('top-access-cover',x,height-.01,-2.5,.53,2.9,'graphite');
      for(const z of [-3.6,-1.4])box('top-cover-captive-latch',x,height-.008,z,.23,.012,.14,'brass');
    }
    plate('ivory-front-louver-frame',0,height/2,-.18,4.40,height-.12,'ivory',[
      [-1.12,0,1.43,height-.69],[1.12,0,1.43,height-.69],[0,0,.52,height-.63],
    ]);
    const rows=Math.max(4,Math.floor((height-.78)/.25)),step=(height-.80)/rows;
    for(const side of [-1,1]){
      const x=side*1.12;
      for(let n=0;n<rows;n++){
        const y=.44+(n+.5)*step;
        const fin=box('angled-deep-front-louver',x,y,-.53,1.34,.085,.53,'graphite');fin.rotation.x=-.24;
        box('louver-machined-leading-edge',x,y+.045,-.29,1.27,.025,.035,'steel');
      }
      pipe(side*.48,.43,height-.43,-.69);
      for(const y of [.24,height-.24])for(const dx of [-.65,.65])bolt(x+dx,y,-.15);
    }
    plate('jump-light-service-cassette',0,height/2,-.29,.43,height-.76,'graphite');
    for(const y of [height/2-.27,height/2+.27])chevron(0,y,-.24);
    for(const y of [.33,height-.33])plate('cassette-lock-tab',0,y,-.14,.30,.15,'brass');
    // Visible rear uses quiet armor, a real vent and protected service latches.
    const rear=plate('rear-service-panel',0,height/2,-4.95,4.32,height-.23,'graphite',[[0,0,2.7,.40]]);rear.rotation.y=Math.PI;
    for(let n=0;n<4;n++)box('rear-vent-fin',0,height/2-.13+n*.087,-4.84,2.58,.035,.06,'steel');
    const scale=pitch/4.5,cx=-width/2+(i+.5)*pitch;
    for(const m of root.children.slice(first)){m.position.x=cx+m.position.x*scale;m.scale.x*=scale;}
  }
  for(const [side,enabled]of [[-1,startCap],[1,endCap]])if(enabled){
    const cap=b.mesh('armored-exposed-end-cap',b.plateGeometry(4.70,height-.12,[[0,0,2.68,height-.75]]),'ivory',side*(width/2-.028),height/2,-2.5);cap.rotation.y=side*Math.PI/2;
    box('end-cap-recessed-service-cover',side*(width/2-.19),height/2,-2.5,.10,height-.68,2.76,'graphite');
    for(const z of [-3.5,-1.5])box('end-cap-lock-housing',side*(width/2-.10),height/2,z,.07,.28,.24,'brass');
    for(let n=0;n<5;n++)box('end-cap-cooling-slot',side*(width/2-.125),height/2-.36+n*.18,-2.5,.06,.045,1.35,'dark');
  }
  root.userData={width,height,depth:5,startCap,endCap};return root;
}

export const COMPACT_JAMB_WIDTH=2.25;
export function compactPassage(THREE,{opening=10,clearance=3.5,height=4.2}={}){
  const {root,box,plate,topPlate,bolt,pipe}=builder(THREE,'p3-compact-r1');
  root.name='p3-compact-jump-or-opening';
  const half=opening/2,jamb=COMPACT_JAMB_WIDTH;
  for(const side of [-1,1]){
    const x=side*(half+jamb/2);
    box('compact-jamb-opaque-core',x,(height-.17)/2,-3.0,jamb,height-.17,4,'dark');
    box('compact-jamb-base',x,.15,-2.5,jamb,.30,5,'graphite');
    plate('compact-ivory-jamb-frame',x,height/2,-.25,jamb-.10,height-.14,'ivory',[[0,.13,1.15,height-1.22]]);
    for(const dx of [-.29,.29])pipe(x+dx,.8,height-.55,-.67);
    plate('compact-bottom-service-door',x,.55,-.17,1.48,.46,'graphite');
    for(const dx of [-.58,.58])bolt(x+dx,.55,-.14);
    for(const y of [.4,height-.4])for(const dx of [-.89,.89])bolt(x+dx,y,-.22);
    for(const y of [1.10,1.68,2.26]){
      box('compact-jamb-receiving-bezel',x-side*.84,y,-.17,.20,.47,.10,'steel');
      box('compact-jamb-receiving-light',x-side*.84,y,-.108,.11,.36,.025,'light');
    }
    topPlate('compact-jamb-top-cap',x,height-.025,-2.5,jamb-.10,4.9,'ivory');
  }
  const lintel=height-clearance;
  box('compact-lintel-opaque-core',0,clearance+(lintel-.14)/2,-3.1,opening,lintel-.14,3.8,'dark');
  box('compact-lintel-underside',0,clearance+.055,-2.5,opening,.11,5,'steel');
  const count=Math.max(2,Math.round(opening/2)),pitch=opening/count;
  for(let i=0;i<count;i++){
    const x=-half+(i+.5)*pitch;
    plate('compact-lintel-ivory-cassette',x,clearance+lintel/2,-.20,pitch-.055,lintel-.09,'ivory',[[0,.09,pitch-.35,.18],[0,-.16,pitch-.35,.095]]);
    for(const dy of [.045,.115])box('compact-lintel-recessed-fin',x,clearance+lintel/2+dy,-.34,pitch-.43,.022,.06,'steel');
    box('compact-lintel-receiving-light',x,clearance+lintel/2-.16,-.26,pitch-.43,.065,.03,'light');
    topPlate('compact-lintel-top-armor',x,height-.025,-2.5,pitch-.045,4.9,'graphite');
    for(const z of [-3.9,-1.1])topPlate('compact-lintel-top-service-tab',x,height-.012,z,.46,.32,'brass');
  }
  root.userData={opening,clearance,height,depth:5};return root;
}
