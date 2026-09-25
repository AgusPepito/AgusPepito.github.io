import {omitFaces,openBottomBox,raisedPanelBacks} from './geometry-cleanup.js';
// Recipe route B: derived from the user-approved detailed 30-degree R3 candidate.
// 12 m long, front +Z, 3.2 m structure; front/end profile leans 30 degrees from vertical.
export default function generate(THREE) {
  const family='cover', kind='start'; const g = new THREE.Group(); g.name = 'raised-'+family+'-'+kind+'-r3';
  const lean = Math.tan(Math.PI / 6), face = y => 1.4 - y * lean;
  const palette = { armor: [0xc4c3b4, .35, .6], inset: [0x263139,.5,.65], pipe:[0x606a6a,.7,.42],
    steel:[0x8b9390,.65,.4], dark:[0x111a20,.25,.85], brass:[0x9b8150,.6,.5] };
  const mats = {};
  for (const [key,[color,metalness,roughness]] of Object.entries(palette)) {
    mats[key] = new THREE.MeshStandardMaterial({color,metalness,roughness}); mats[key].name='r3-'+key;
  }
  function mesh(name, geometry, mat, x=0,y=0,z=0) {
    const m=new THREE.Mesh(geometry,mats[mat]);m.name=name;m.position.set(x,y,z);g.add(m);return m;
  }
  function box(name,x,y,z,w,h,d,mat) {
    const buried=y-h/2<=.0001||['roof-panel','roof-vent-well','roof-vent-rib','roof-fastener'].includes(name);
    return mesh(name,buried?openBottomBox(THREE,w,h,d):new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  }
  function sloped(name,x,y,w,h,d,mat,offset=0) {
    const geometry=new THREE.BoxGeometry(w,h,d);
    if(raisedPanelBacks.has(name))omitFaces(THREE,geometry,2,-1);
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++) p.setZ(i,p.getZ(i)-p.getY(i)*lean);
    geometry.computeVertexNormals();return mesh(name,geometry,mat,x,y,face(y)+offset);
  }
  function cheek(x) {
    // One watertight extruded trapezoid: end silhouette and front supports share the same plane.
    const shape=new THREE.Shape();shape.moveTo(-1.65,0);shape.lineTo(1.4,0);
    shape.lineTo(face(3.2),3.2);shape.lineTo(-1.65,3.2);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:false,steps:1});
    geometry.rotateY(-Math.PI/2);geometry.translate(.16,0,0);
    mesh('continuous-trapezoid-end-cheek',geometry,'armor',x);
    // Visible end inspection plate follows the trapezoid, rather than hiding it under a square box.
    box('end-inset-plate',x+(x<0?-.166:.166),1.35,-.72,.025,.95,.72,'inset');
    for(const y of [1.03,1.68]) for(const z of [-.95,-.48]) {
      const bolt=mesh('end-plate-bolt',new THREE.CylinderGeometry(.055,.055,.045,6),'steel',x+(x<0?-.19:.19),y,z);
      bolt.rotation.z=Math.PI/2;
    }
  }
  cheek(-5.84);cheek(5.84);
  box('foot-rail',0,.13,1.12,12,.26,.56,'inset');
  sloped('lower-ivory-lip',0,.3,11.35,.16,.24,'armor');
  sloped('upper-ivory-lintel',0,3.04,11.35,.25,.25,'armor');
  for(const x of [-5.48,0,5.48]) {
    sloped('thirty-degree-support',x,1.65,x===0?.36:.5,2.72,.3,'armor');
    sloped('support-inset-channel',x,1.7,.12,1.6,.025,'inset',.162);
    for(const y of [.6,2.7]) sloped('support-bolt-seat',x,y,.18,.18,.035,'steel',.17);
    sloped('support-service-mark',x,.87,.19,.27,.025,'brass',.18);
  }
  sloped('shallow-cavity-backing',0,1.65,11.25,2.6,.055,'dark',-.7);
  if(family==='pipe') {
  for(const y of [.78,1.59,2.4]) {
    const z=face(y)-.36;
    if(kind==='offset') {
      const path=new THREE.CatmullRomCurve3([-5.475,-3,-1,1,3,5.475].map(x=>new THREE.Vector3(x,y+(Math.abs(x)===1?.15:0),z-(Math.abs(x)===1?.16:0))));
      const body=mesh('offset-pipe-dogleg',new THREE.TubeGeometry(path,24,.255,10,false),'pipe');body.material.side=THREE.DoubleSide;
    } else {
      const pipe=mesh('main-pipe-barrel',new THREE.CylinderGeometry(.255,.255,10.95,12,1),'pipe',0,y,z);pipe.rotation.z=Math.PI/2;
    }
    for(const x of (kind==='coupling'?[-4.7,-2.65,2.65,4.7]:[-4.7,4.7])) {
      const sleeve=mesh('wide-coupling-sleeve',new THREE.CylinderGeometry(.305,.305,.55,12),'inset',x,y,z);sleeve.rotation.z=Math.PI/2;
      for(const offset of [-.27,.27]) {
        const ring=mesh('coupling-retaining-band',new THREE.CylinderGeometry(.325,.325,.085,12),'steel',x+offset,y,z);ring.rotation.z=Math.PI/2;
      }
      // Bolt heads only around the exposed front half of each coupling.
      for(const a of [-.9,0,.9]) {
        const head=mesh('coupling-front-fastener',new THREE.CylinderGeometry(.045,.045,.06,6),'brass',x,y+Math.sin(a)*.32,z+Math.cos(a)*.32);
        head.rotation.x=Math.PI/2-a;
      }
    }
    for(const x of [-1,1]) {
      const cuff=mesh('central-seal-ring',new THREE.CylinderGeometry(.29,.29,.12,10),'brass',x,y,z);cuff.rotation.z=Math.PI/2;
    }
    box('pipe-saddle',0,y,z-.22,.45,.58,.5,'inset');
    if(kind==='valve'||kind==='coupling') {
    box('valve-access-block',1.62,y,z+.12,.48,.43,.42,'inset');
    box('valve-front-handle',1.62,y,z+.37,.56,.105,.12,'brass');
    }
  }
  }
  if(family==='grille') {
    for(const center of [-2.73,2.73]) {
      for(const x of [center-2.42,center+2.42]) sloped('grille-cartridge-side',x,1.63,.14,2.45,.14,'steel',-.1);
      for(const y of [.44,2.82]) sloped('grille-cartridge-rail',center,y,4.95,.15,.15,'steel',-.1);
      for(let x=center-2.18;x<center+2.3;x+=.39) sloped('grille-vertical-web',x,1.62,.065,2.27,.085,'pipe',-.13);
      for(let y=.6;y<2.75;y+=kind==='louver'?.28:.38) {
        sloped(kind==='louver'?'deep-louver-blade':'grille-cross-web',center,y,4.6,kind==='louver'?.18:.065,kind==='louver'?.23:.09,'pipe',-.08);
      }
      if(kind==='reinforced') {
        sloped('reinforced-center-stile',center,1.62,.21,2.28,.18,'steel',.025);
        for(const y of [.95,2.23]) sloped('reinforced-cross-brace',center,y,4.65,.16,.19,'steel',.03);
      }
      for(const x of [center-2.3,center+2.3]) for(const y of [.51,2.7]) sloped('cartridge-captive-fastener',x,y,.11,.11,.045,'brass',.005);
      // Only shallow equipment visible through the lattice, not a hidden machinery room.
      for(const x of [center-1.3,center+1.3]) {
        sloped('visible-recess-cassette',x,1.56,.64,1.6,.16,'inset',-.5);
        for(const y of [.98,1.3,1.62,1.94,2.26]) sloped('recess-cooling-fin',x,y,.7,.08,.16,'steel',-.39);
      }
      sloped('grille-release-latch',center,2.75,.45,.15,.07,'brass',.055);
    }
  }
  if(family==='cover') {
    const count=kind==='segmented'?8:4, step=10.6/count;
    for(let i=0;i<count;i++) {
      const x=-5.3+step*(i+.5);
      sloped('armor-recess-gasket',x,1.61,step-.02,2.68,.055,'inset',-.13);
      sloped('sloped-ceramic-panel',x,1.61,step-.1,2.58,.12,'armor',-.055);
      for(const y of [.48,2.71]) sloped('panel-captive-fastener',x,y,.12,.12,.06,'steel',.035);
      sloped('panel-lower-service-slot',x,.7,Math.min(.48,step*.5),.09,.025,'dark',.018);
    }
    if(kind==='hatch') for(const x of [-2.73,2.73]) {
      sloped('hatch-dark-gasket',x,1.65,2.35,1.66,.045,'inset',.025);
      sloped('hatch-inset-door',x,1.65,2.2,1.51,.085,'armor',.07);
      sloped('hatch-handle-pocket',x,1.6,.67,.22,.025,'dark',.122);
      sloped('hatch-recess-handle',x,1.6,.49,.085,.045,'steel',.15);
      for(const y of [1.15,2.17]) sloped('hatch-hinge',x-.96,y,.12,.27,.13,'steel',.15);
      for(const y of [1.16,2.15]) sloped('hatch-lock',x+.94,y,.14,.2,.1,'brass',.15);
    }
    if(kind==='vented') for(const x of [-2.73,2.73]) {
      sloped('vent-inset-well',x,1.7,2.3,1.7,.025,'dark',.025);
      for(let y=1;y<=2.4;y+=.2) sloped('vent-blade',x,y,2.07,.09,.12,'steel',.085);
      for(const dx of [-1.12,1.12]) sloped('vent-frame-stile',x+dx,1.7,.1,1.74,.12,'inset',.09);
      for(const dx of [-1,1]) for(const y of [.92,2.47]) sloped('vent-frame-fastener',x+dx,y,.1,.1,.035,'brass',.16);
    }
  }
  // Separate roof armor courses, shallow vent slots, seams and service fasteners.
  for(const x of [-4.45,-1.48,1.48,4.45]) {
    box('roof-panel',x,3.215,-1.03,2.91,.13,1.24,'armor');
    box('roof-vent-well',x,3.289,-1.22,1.28,.02,.43,'dark');
    for(let dx=-.53;dx<.6;dx+=.18) box('roof-vent-rib',x+dx,3.31,-1.22,.065,.025,.38,'inset');
    for(const dx of [-1.22,1.22]) box('roof-fastener',x+dx,3.291,-.62,.1,.025,.12,'steel');
  }
  for(const x of [-4,-2,2,4]) {
    sloped('lower-recess-pocket',x,.31,.58,.095,.03,'dark',.132);
    sloped('lower-service-tab',x+.36,.31,.12,.12,.05,'steel',.15);
  }
  if(kind==='start'||kind==='end') {
    const x=kind==='start'?-5.48:5.48;
    sloped('full-height-interface-seal',x,1.62,.13,2.8,.04,'inset',.175);
    for(const y of [.68,1.6,2.52]) sloped('interface-locking-tab',x,y,.27,.13,.08,'steel',.2);
  }
  if(kind==='ramp-start'||kind==='ramp-end') {
    g.updateMatrixWorld(true);
    g.traverse(n=>{
      if(!n.isMesh)return;
      n.geometry.applyMatrix4(n.matrixWorld);n.position.set(0,0,0);n.rotation.set(0,0,0);
      const p=n.geometry.attributes.position;
      for(let i=0;i<p.count;i++) {
        const x=p.getX(i), oldY=p.getY(i);
        const t=THREE.MathUtils.clamp((kind==='ramp-start'?x+6:6-x)/8,0,1);
        const newY=oldY*(.18+.82*t);
        p.setY(i,newY);p.setZ(i,p.getZ(i)+(oldY-newY)*lean);
      }
      n.geometry.computeVertexNormals();
    });
  }
  g.userData={revision:'r3',family,kind,frontAngleDegrees:30,angleMeasuredFrom:'vertical',length:12,
    visibility:'Inward surfaces, roof and exposed ends only; no concealed equipment.'};
  return g;
}
