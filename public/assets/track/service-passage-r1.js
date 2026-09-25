import {surfaceMaps} from './slab-surface-r1.js';

// P3 selected service gantry. The clear opening is NEVER occupied by details:
// x in (-opening/2,+opening/2), y below clearance, z from 0 to -5.
export const PASSAGE_JAMB_WIDTH=4.5;
export default function generate(THREE,{opening=10,clearance=3.5}={}){
  const root=new THREE.Group();root.name='p3-service-passage-r1';const half=opening/2,jamb=PASSAGE_JAMB_WIDTH;
  const grain=surfaceMaps(THREE),mats={
    graphite:new THREE.MeshStandardMaterial({color:0x4a5055,roughness:.45,metalness:.72,...grain,normalScale:new THREE.Vector2(.32,.32)}),
    ivory:new THREE.MeshStandardMaterial({color:0xcac7b7,roughness:.53,metalness:.28,...grain,normalScale:new THREE.Vector2(.12,.12)}),
    dark:new THREE.MeshStandardMaterial({color:0x10181e,roughness:.82}),
    steel:new THREE.MeshStandardMaterial({color:0x78878c,roughness:.38,metalness:.76}),
    brass:new THREE.MeshStandardMaterial({color:0xac8b52,roughness:.49,metalness:.68}),
    light:new THREE.MeshStandardMaterial({color:0xfff5de,emissive:0xfff2d2,emissiveIntensity:2.2,toneMapped:false}),
  };
  for(const [key,m]of Object.entries(mats)){m.name='passage-p3-r1-'+key;if(['graphite','ivory','steel'].includes(key))m.userData.slabFinish=true;}
  function mesh(name,g,key,x=0,y=0,z=0,rigid=false){const m=new THREE.Mesh(g,mats[key]);m.name=name;m.position.set(x,y,z);m.userData.wallRigid=rigid;root.add(m);return m;}
  function box(name,x,y,z,w,h,d,key){return mesh(name,new THREE.BoxGeometry(w,h,d),key,x,y,z);}
  function plate(name,x,y,z,w,h,key,holes=[]){
    const b=.09,s=new THREE.Shape();
    s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.lineTo(w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.lineTo(w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.lineTo(-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.closePath();
    for(const [hx,hy,hw,hh]of holes){const p=new THREE.Path();p.moveTo(hx-hw/2,hy-hh/2);p.lineTo(hx-hw/2,hy+hh/2);p.lineTo(hx+hw/2,hy+hh/2);p.lineTo(hx+hw/2,hy-hh/2);p.closePath();s.holes.push(p);}
    return mesh(name,new THREE.ExtrudeGeometry(s,{depth:.09,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1}),key,x,y,z-.115);
  }
  function bolt(x,y,z){const m=mesh('gantry-captive-fastener',new THREE.CylinderGeometry(.05,.05,.04,6),'steel',x,y,z,true);m.rotation.x=Math.PI/2;}
  function verticalPipe(x,low,high,z){
    mesh('protected-jamb-conduit',new THREE.CylinderGeometry(.13,.13,high-low,14),'steel',x,(low+high)/2,z);
    for(const y of [low+.22,high-.22])mesh('jamb-conduit-coupling',new THREE.CylinderGeometry(.2,.2,.24,12),'brass',x,y,z,true);
    for(const y of [low+.42,high-.42])mesh('coupling-seal-ring',new THREE.CylinderGeometry(.17,.17,.055,12),'dark',x,y,z,true);
  }
  for(const side of [-1,1]){
    const center=side*(half+jamb/2),inner=side*(half+.53),outer=side*(half+jamb-.53),service=side*(half+2.3);
    // Solid side-column core fills the collider outside the open route.
    box('opaque-jamb-core',center,3.5,-3.25,jamb,7,3.5,'dark');
    box('jamb-ground-plinth',center,.25,-2.5,jamb,.5,5,'graphite');
    for(const x of [inner,outer]){
      box('upright-recessed-backing',x,3.5,-1.16,.98,6.96,.48,'dark');
      plate('lower-ivory-jamb-armor',x,1.7,-.66,.9,2.8,'ivory',[[0,-.4,.28,.66]]);
      box('lower-jamb-vent-floor',x,1.3,-.84,.34,.76,.04,'dark');
      for(let n=0;n<6;n++)box('jamb-pocket-louver',x,1.02+n*.1,-.755,.22,.04,.055,'steel');
      plate('upper-ivory-jamb-armor',x,4.68,-.66,.9,2.9,'ivory',[[0,.8,.25,.57]]);
      box('upper-jamb-id-pocket',x,5.48,-.84,.31,.67,.04,'dark');
      box('upper-jamb-brass-id',x,5.48,-.77,.11,.32,.055,'brass');
      for(const y of [.44,2.86,3.36,6.15])for(const dx of [-.31,.31])bolt(x+dx,y,-.625);
      plate('ivory-crown-connector',x,6.58,-.69,.94,.76,'ivory');
    }
    // Inner receiving-light cassette faces the player; nothing projects into
    // the aperture or below its lintel clearance.
    const lx=side*(half+.52);
    plate('inner-jamb-optical-bezel',lx,2.33,-.47,.55,1.14,'steel',[[0,0,.25,.81]]);
    box('inner-jamb-optical-floor',lx,2.33,-.64,.31,.88,.03,'dark');
    for(let i=0;i<4;i++)box('segmented-jamb-receiving-light',lx,2.02+i*.205,-.555,.19,.16,.035,'light');
    box('service-cassette-dark-floor',service,3.8,-1.45,2.1,5.7,.12,'dark');
    for(const dx of [-.62,.62])verticalPipe(service+dx,2.7,5.91,-1.10);
    for(const y of [3.2,5.43])box('jamb-pipe-retaining-crossbar',service,y,-.875,1.88,.14,.14,'ivory');
    plate('jamb-service-cabinet',service,1.67,-.81,1.91,1.86,'graphite');
    for(const dx of [-.69,.69])for(const y of [.98,2.33])bolt(service+dx,y,-.775);
    plate('cabinet-service-door',service+.17,1.65,-.63,1.10,1.27,'graphite');
    box('cabinet-recessed-latch',service+.45,1.65,-.59,.13,.31,.06,'steel');
    for(const y of [1.23,2.06])box('cabinet-exposed-hinge',service-.47,y,-.56,.13,.16,.12,'brass');
    plate('upper-cooling-cassette',service,6.45,-.89,2.02,.76,'graphite',[[0,0,1.56,.38]]);
    for(let i=0;i<4;i++)box('upper-cooling-fin',service,6.30+i*.10,-1.005,1.45,.04,.08,'steel');
  }
  // Lower receiving rail, deep load-bearing lintel and a separate recessed
  // truss gallery. All structural underside points stay at/above clearance.
  box('lintel-load-bearing-core',0,(clearance+.26+7)/2,-3.2,opening,7-clearance-.26,3.6,'dark');
  box('front-lintel-sill',0,clearance+.13,-.63,opening,.26,.38,'ivory');
  box('rear-lintel-sill',0,clearance+.13,-4.78,opening,.26,.44,'steel');
  box('underside-optical-recess',0,clearance+.24,-2.66,opening,.07,3.78,'dark');
  const segments=Math.max(3,Math.round(opening/.9));
  for(let i=0;i<segments;i++){
    const x=-half+(i+.5)*opening/segments;
    box('underside-segmented-receiving-cover',x,clearance+.1,-.99,opening/segments-.1,.06,.32,'light');
  }
  plate('lintel-ivory-lower-trim',0,clearance+.48,-.83,opening+.10,.42,'ivory');
  const count=Math.max(2,Math.round(opening/2.5)),cell=opening/count;
  for(let i=0;i<count;i++){
    const x=-half+(i+.5)*cell;
    plate('lintel-beveled-graphite-fascia',x,4.92,-1.03,cell-.07,1.36,'graphite');
    for(const dx of [-cell/2+.17,cell/2-.17])for(const y of [4.43,5.41])bolt(x+dx,y,-.995);
    box('upper-truss-gallery-floor',x,6.25,-1.35,cell-.04,.95,.12,'dark');
    for(const y of [5.78,6.75])box('gallery-horizontal-rail',x,y,-.97,cell-.04,.13,.18,'steel');
    if(i===Math.floor(count/2)){
      for(let j=0;j<6;j++)box('lintel-cooling-gallery-fin',x,5.96+j*.12,-1.10,cell-.24,.052,.18,'steel');
    }else{
      for(const sign of [-1,1]){
        const a=new THREE.Vector3(x+sign*(cell/2-.14),5.87,-1.10),b=new THREE.Vector3(x,6.66,-1.10),delta=b.clone().sub(a);
        const brace=mesh('recessed-lintel-diagonal-brace',new THREE.BoxGeometry(.13,delta.length(),.15),'steel');brace.position.copy(a).add(b).multiplyScalar(.5);brace.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
      }
    }
    box('ivory-upper-lintel-cap',x,6.90,-1.32,cell-.07,.20,.72,'ivory');
  }
  root.userData={opening,clearance,width:opening+2*jamb,height:7,depth:5,revision:'12-passage-r1'};return root;
}
