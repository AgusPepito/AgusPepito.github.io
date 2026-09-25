import {omitFaces,openBottomBox} from './geometry-cleanup.js';
import {surfaceMaps} from './slab-surface-r1.js';
import {obstacleLightKit} from './obstacle-lights-r1.js';

// W4 R2: one measured buttress profile drives the armor and its recessed shell.
// X repeats; Y is height; the approach face looks toward +Z. Nominal 7 x 5 m.
export default function generate(THREE,{width=18,startCap=true,endCap=true,signals=true}={}){
  const root=new THREE.Group();root.name='w4-buttressed-wall-r2';
  const lights=signals?obstacleLightKit(THREE,'wall'):null;
  const grain=surfaceMaps(THREE);
  const mats={
    graphite:new THREE.MeshStandardMaterial({color:0x4a5055,roughness:.45,metalness:.72,...grain,normalScale:new THREE.Vector2(.32,.32)}),
    ivory:new THREE.MeshStandardMaterial({color:0xcac7b7,roughness:.53,metalness:.28,...grain,normalScale:new THREE.Vector2(.12,.12)}),
    replacement:new THREE.MeshStandardMaterial({color:0xdad5c3,roughness:.59,metalness:.22,...grain,normalScale:new THREE.Vector2(.1,.1)}),
    dark:new THREE.MeshStandardMaterial({color:0x10181e,roughness:.82}),
    steel:new THREE.MeshStandardMaterial({color:0x78878c,roughness:.38,metalness:.76}),
    brass:new THREE.MeshStandardMaterial({color:0xac8b52,roughness:.49,metalness:.68}),
    light:new THREE.MeshStandardMaterial({color:0xfff5de,emissive:0xfff2d2,emissiveIntensity:2.2,roughness:.3,toneMapped:false}),
  };
  for(const [key,mat]of Object.entries(mats)){mat.name='wall-w4-r2-'+key;if(['steel','graphite','ivory','replacement'].includes(key))mat.userData.slabFinish=true;}
  function mesh(name,g,key,x=0,y=0,z=0,rigid=false){const m=new THREE.Mesh(g,mats[key]);m.name=name;m.position.set(x,y,z);m.userData.wallRigid=rigid;root.add(m);return m;}
  function box(name,x,y,z,w,h,d,key){return mesh(name,(y-h/2<=.0001?openBottomBox(THREE,w,h,d):new THREE.BoxGeometry(w,h,d)),key,x,y,z);}
  function outline(w,h,b=.1){
    b=Math.min(b,w*.15,h*.15);const s=new THREE.Shape();
    s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.lineTo(w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.lineTo(w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.lineTo(-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.closePath();return s;
  }
  function aperture(s,x,y,w,h){const p=new THREE.Path();p.moveTo(x-w/2,y-h/2);p.lineTo(x-w/2,y+h/2);p.lineTo(x+w/2,y+h/2);p.lineTo(x+w/2,y-h/2);p.closePath();s.holes.push(p);}
  const depth=.09,bevel=.025;
  function plate(name,x,y,z,w,h,key,holes=[],profile=null){
    const shape=outline(w-.05,h-.05);
    for(const hole of holes)aperture(shape,...hole);
    const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,steps:1});
    omitFaces(THREE,g,2,-1);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const px=p.getX(i)+x,py=p.getY(i)+y,pz=p.getZ(i)-depth-bevel+(profile?profile(py):z);
      p.setXYZ(i,px,py,pz);
    }
    g.computeVertexNormals();return mesh(name,g,key);
  }
  function bolt(x,y,z){const m=mesh('captive-fastener-and-washer',new THREE.CylinderGeometry(.043,.043,.035,6),'steel',x,y,z,true);m.rotation.x=Math.PI/2;
    const washer=mesh('fastener-seating-washer',new THREE.TorusGeometry(.052,.013,4,10),'dark',x,y,z-.013,true);return washer;}
  function quad(name,points,key){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(name,g,key);}
  const profilePoints=[[0,-.075],[.95,-.14],[2.15,-.72],[6.1,-1.1]];
  function profile(y){
    for(let i=1;i<profilePoints.length;i++){const [a,za]=profilePoints[i-1],[b,zb]=profilePoints[i];if(y<=b)return za+(zb-za)*(y-a)/(b-a);}
    return -1.1;
  }
  function profilePatch(name,x,w,y0,y1,inset,key){return quad(name,[[x-w/2,y0,profile(y0)+inset],[x+w/2,y0,profile(y0)+inset],[x+w/2,y1,profile(y1)+inset],[x-w/2,y1,profile(y1)+inset]],key);}
  const bays=Math.max(1,Math.round(width/4.5)),cell=width/bays,ribWidth=1.16;
  // Inset core: outer terminal cheeks own the exposed side faces. The plinth
  // starts behind the boots, so its front cannot intersect the white armor.
  box('inset-opaque-wall-core',0,3.22,-3.05,width-.26,5.76,2.8,'dark');
  box('recessed-continuous-plinth',0,.22,-2.67,width-.26,.44,4.56,'graphite');
  box('rear-structural-skin',0,3.5,-4.86,width-.26,7,.08,'dark');
  for(let i=0;i<bays;i++){
    const left=-width/2+i*cell,ribX=left+ribWidth/2;
    const right=left+cell-(endCap&&i===bays-1?ribWidth:0);
    const a=left+ribWidth+.055,b=right-.055,pw=b-a,x=(a+b)/2;
    if(lights&&pw>.7)lights.panel(root,x,3.55,-1.15,Math.min(2.05,pw-.16),2.45);
    // Bay skin has a genuine cooling aperture; dark core is 0.17 m behind it.
    plate('beveled-recessed-wall-armor',x,3.45,-1.47,pw,5.15,'graphite',[[0,1.55,pw*.72,.7]]);
    box('cooling-well-back',x,5,-1.64,pw*.75,.77,.035,'dark');
    for(let j=0;j<5;j++){
      const louver=box('inset-angled-cooling-louver',x,4.73+j*.135,-1.565,pw*.66,.045,.12,'steel');louver.rotation.x=-.25;
    }
    // Broad plate seams, corner fasteners and asymmetric lower service doors.
    plate('lower-beveled-service-door',x+(i%2?-.18:.18),1.43,-1.30,pw*.72,.97,'graphite');
    for(const dx of [-pw*.28,pw*.28])for(const y of [1.08,1.77])bolt(x+dx,y,-1.27);
    for(const dx of [-pw/2+.11,pw/2-.11])for(const y of [1.04,3.4,5.78])bolt(x+dx,y,-1.44);
    const hx=x+(i%2?-1:1)*pw*.28;
    plate('offset-tall-access-hatch',hx,2.68,-1.32,pw*.25,.93,'graphite');
    box('hatch-lock-recess',hx,2.58,-1.294,.16,.28,.025,'dark');
    box('hatch-lock-metal-lever',hx,2.58,-1.265,.065,.17,.045,'steel');
    for(const y of [2.4,2.94])box('hatch-side-hinge',hx-pw*.14,y,-1.27,.08,.15,.08,'steel');
    // Plinth machinery is forward of the recessed beam, never coplanar with it.
    plate('bay-foot-service-cassette',x,.62,-.94,pw,.47,'graphite');
    box('foot-cassette-grille-bed',x,.62,-.915,pw*.52,.27,.025,'dark');
    for(let j=0;j<7;j++)box('foot-cassette-grille-bar',x-pw*.23+j*pw*.46/6,.62,-.882,.045,.22,.045,'steel');
    // Crown has separate cladding between buttress heads, with pronounced rims.
    const crownCenter=left+cell/2;
    box('crown-front-structural-rail',crownCenter,6.58,-1.75,cell-.06,.84,.64,'dark');
    plate('crown-beveled-metal-fascia',x,6.58,-1.265,pw,.72,'graphite');
    for(const dx of [-pw/2+.14,pw/2-.14])for(const y of [6.36,6.8])bolt(x+dx,y,-1.23);
    plate('crown-service-id-plate',x,6.57,-1.10,.58,.27,'steel');
    for(const dx of [-.15,0,.15])box('crown-neutral-identification-notch',x+dx,6.57,-1.079,.035,.13,.03,'dark');
    box('rear-crown-rail',crownCenter,6.59,-4.22,cell-.06,.82,1.0,'graphite');
    box('crown-pipe-tray-floor',crownCenter,6.27,-2.92,cell-.06,.13,1.85,'dark');
    const pipe=mesh('exposed-crown-feed-pipe',new THREE.CylinderGeometry(.17,.17,cell-.065,10),'steel',crownCenter,6.68,-2.64);pipe.rotation.z=Math.PI/2;
    for(const dx of [-cell/2+.29,cell/2-.29]){
      const sleeve=mesh('stepped-crown-pipe-coupling',new THREE.CylinderGeometry(.235,.235,.28,10),'brass',crownCenter+dx,6.68,-2.64,true);sleeve.rotation.z=Math.PI/2;
      for(const da of [-.17,.17]){const ring=mesh('pipe-coupling-retainer',new THREE.CylinderGeometry(.215,.215,.055,8),'dark',crownCenter+dx+da,6.68,-2.64,true);ring.rotation.z=Math.PI/2;}
    }
    buttress(ribX,i);
    // Pipe saddle sits behind the head, sharing no exposed face with it.
    box('ivory-pipe-saddle',ribX,6.67,-2.62,.65,.6,.7,'ivory');
    plate('rear-access-panel',crownCenter,3.55,0,cell-.3,4.85,'graphite');
    const rear=root.children[root.children.length-1];
    // This plate is already baked about its own XY coordinates; reflect only Z.
    rear.geometry.scale(1,1,-1);rear.geometry.translate(0,0,-5);
    const ri=rear.geometry.index;
    if(ri)for(let j=0;j<ri.count;j+=3){const t=ri.getX(j+1);ri.setX(j+1,ri.getX(j+2));ri.setX(j+2,t);}
    else {const attrs=Object.values(rear.geometry.attributes);for(const attr of attrs)for(let j=0;j<attr.count;j+=3)for(let c=0;c<attr.itemSize;c++){const t=attr.array[(j+1)*attr.itemSize+c];attr.array[(j+1)*attr.itemSize+c]=attr.array[(j+2)*attr.itemSize+c];attr.array[(j+2)*attr.itemSize+c]=t;}}
    rear.geometry.computeVertexNormals();
  }
  function buttress(x,index){
    // Backing face is exactly 0.20 m behind the common armor profile, not a
    // second approximation only 0.006 m away. All ivory panels have thickness.
    const shape=new THREE.Shape();
    profilePoints.forEach(([y,z],i)=>i?shape.lineTo(-z+.20,y):shape.moveTo(-z+.20,y));
    shape.lineTo(1.64,6.1);shape.lineTo(1.64,0);shape.closePath();
    const rib=mesh('setback-buttress-backing',new THREE.ExtrudeGeometry(shape,{depth:ribWidth,bevelEnabled:false}),'dark',x-ribWidth/2,0,0);rib.rotation.y=Math.PI/2;
    const key=index%4===2?'replacement':'ivory';
    plate('beveled-ivory-toe-armor',x,.49,0,ribWidth-.10,.80,key,[[0,0,.53,.45]],profile);
    profilePatch('toe-recess-floor',x,.58,.23,.75,-.16,'dark');
    for(let j=0;j<4;j++){const y=.3+j*.11;profilePatch('toe-inset-metal-louver',x,.43,y,y+.035,-.09,'steel');}
    plate('beveled-ivory-sloped-boot',x,1.55,0,ribWidth-.10,1.1,key,[[0,0,.38,.66]],profile);
    profilePatch('boot-lock-pocket',x,.45,1.18,1.92,-.16,'dark');
    profilePatch('boot-recessed-brass-lock',x,.11,1.31,1.73,-.085,'brass');
    plate('lower-long-buttress-armor',x,3.1,0,ribWidth-.10,1.74,key,[[.20,-.30,.22,.66]],profile);
    profilePatch('upright-vent-pocket',x+.20,.28,2.43,3.15,-.16,'dark');
    for(let j=0;j<6;j++){const y=2.51+j*.096;profilePatch('upright-pocket-louver',x+.20,.17,y,y+.031,-.085,'steel');}
    plate('upper-long-buttress-armor',x,5.04,0,ribWidth-.10,1.98,key,[[-.22,.51,.16,.48]],profile);
    profilePatch('upper-inset-id-pocket',x-.22,.22,5.28,5.84,-.16,'dark');
    profilePatch('upper-brass-serial-insert',x-.22,.075,5.4,5.68,-.09,'brass');
    for(const y of [.16,.84,1.06,2.02,2.34,3.87,4.16,5.94])for(const dx of [-.4,.4])bolt(x+dx,y,profile(y)+.018);
    // Segmented armor leaves open joints exposing the recessed rib. Small
    // steel joint clips reinforce the breaks without paper-thin overlay seams.
    for(const y of [2.16,4.02])profilePatch('buttress-joint-bridge',x,.25,y-.032,y+.032,-.04,'steel');
    box('crown-head-setback-core',x,6.57,-1.75,ribWidth,.84,.55,'dark');
    plate('beveled-ivory-light-head',x,6.57,-1.14,ribWidth-.08,.8,key,[[0,0,.57,.48]]);
    box('head-optical-well-floor',x,6.57,-1.345,.64,.54,.04,'dark');
    for(const dx of [-.13,.13]){
      box('head-segmented-optical-cover',x+dx,6.57,-1.235,.095,.32,.035,'light');
      box('head-optical-metal-divider',x+dx+.073,6.57,-1.20,.025,.37,.045,'steel');
    }
    for(const dx of [-.4,.4])for(const y of [6.32,6.82])bolt(x+dx,y,-1.105);
    // Extra protected power feed is visible alongside the base of each rib.
    const tube=mesh('buttress-side-power-conduit',new THREE.CylinderGeometry(.07,.07,1.5,8),'steel',x+.48,3.85,-1.26);
    for(const y of [3.18,4.5])box('side-conduit-retaining-clip',x+.48,y,-1.18,.19,.12,.12,'brass');
  }
  if(endCap)buttress(width/2-ribWidth/2,bays);
  for(const side of [-1,1])if(side<0?startCap:endCap){
    // Side cheek stops behind the buttress shell; no overlapping outer face.
    box('sealed-terminal-cheek',side*(width/2-.10),3.5,-3.33,.12,7,3.34,'graphite');
    for(const z of [-1.9,-4.67])box('terminal-inset-ivory-binding',side*(width/2-.025),3.5,z,.05,6.65,.19,'ivory');
    box('terminal-service-panel',side*(width/2-.018),3.42,-3.27,.035,4.8,2.05,'steel');
    for(const y of [1.16,5.67])box('terminal-panel-lock-rail',side*(width/2-.008),y,-3.27,.016,.12,1.8,'brass');
  }
  lights?.wallEdges(root,width);
  root.userData={width,height:7,depth:5,bays,startCap,endCap,revision:'12-wall-r2',armorBackingRecess:.2};return root;
}
