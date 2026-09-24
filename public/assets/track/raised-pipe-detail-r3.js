// Recipe route B: one review candidate, not a library-wide replacement.
// 12 m long, front +Z, 3.2 m structure; front/end profile leans 30 degrees from vertical.
export default function generate(THREE) {
  const g = new THREE.Group(); g.name = 'pipe-detail-r3-candidate';
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
  function box(name,x,y,z,w,h,d,mat) {return mesh(name,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
  function sloped(name,x,y,w,h,d,mat,offset=0) {
    const geometry=new THREE.BoxGeometry(w,h,d);
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
  for(const y of [.78,1.59,2.4]) {
    const z=face(y)-.36;
    const pipe=mesh('main-pipe-barrel',new THREE.CylinderGeometry(.255,.255,10.95,16,1),'pipe',0,y,z);
    pipe.rotation.z=Math.PI/2;
    for(const x of [-4.7,-2.65,2.65,4.7]) {
      const sleeve=mesh('wide-coupling-sleeve',new THREE.CylinderGeometry(.305,.305,.55,12),'inset',x,y,z);sleeve.rotation.z=Math.PI/2;
      for(const offset of [-.27,.27]) {
        const ring=mesh('coupling-retaining-band',new THREE.CylinderGeometry(.325,.325,.085,16),'steel',x+offset,y,z);ring.rotation.z=Math.PI/2;
      }
      // Bolt heads only around the exposed front half of each coupling.
      for(const a of [-.9,0,.9]) {
        const head=mesh('coupling-front-fastener',new THREE.CylinderGeometry(.045,.045,.06,6),'brass',x,y+Math.sin(a)*.32,z+Math.cos(a)*.32);
        head.rotation.x=Math.PI/2-a;
      }
    }
    for(const x of [-1,1]) {
      const cuff=mesh('central-seal-ring',new THREE.CylinderGeometry(.29,.29,.12,16),'brass',x,y,z);cuff.rotation.z=Math.PI/2;
    }
    box('pipe-saddle',0,y,z-.22,.45,.58,.5,'inset');
    box('valve-access-block',1.62,y,z+.12,.48,.43,.42,'inset');
    box('valve-front-handle',1.62,y,z+.37,.56,.105,.12,'brass');
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
  g.userData={revision:'r3-candidate',frontAngleDegrees:30,angleMeasuredFrom:'vertical',length:12,
    status:'single candidate awaiting approval',visibility:'Inward machinery, angled end cheeks and roof; no hidden equipment.'};
  return g;
}
