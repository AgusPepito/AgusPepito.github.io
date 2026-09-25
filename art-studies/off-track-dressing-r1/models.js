// Procedural recipe factories: no imports, images, encoded meshes or game hooks.
// Metres, Y up, base at Y=0. Named source parts are batched by the preview.
function kit(THREE, name) {
  const root = new THREE.Group(); root.name = name;
  const materials = {
    frame: new THREE.MeshStandardMaterial({color:0x263440, metalness:.72, roughness:.38}),
    recess: new THREE.MeshStandardMaterial({color:0x0c151e, metalness:.38, roughness:.61}),
    armor: new THREE.MeshStandardMaterial({color:0xc6cfd1, metalness:.48, roughness:.34}),
    steel: new THREE.MeshStandardMaterial({color:0x718794, metalness:.86, roughness:.27}),
    coupling: new THREE.MeshStandardMaterial({color:0x8c7150, metalness:.75, roughness:.34}),
    cyan: new THREE.MeshStandardMaterial({color:0x75dfff, emissive:0x12baff, emissiveIntensity:3.4, roughness:.3}),
    amber: new THREE.MeshStandardMaterial({color:0xffca76, emissive:0xff991c, emissiveIntensity:2.8, roughness:.35}),
  };
  for (const [key, material] of Object.entries(materials)) material.name=`dressing-r1-${key}`;
  function mesh(name, geometry, material, x=0, y=0, z=0, parent=root) {
    const result=new THREE.Mesh(geometry,materials[material]);
    result.name=name; result.position.set(x,y,z); parent.add(result); return result;
  }
  function box(name,w,h,d,material,x=0,y=0,z=0,parent=root) {
    return mesh(name,new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);
  }
  function cylinder(name,top,bottom,height,material,x,y,z,segments=12,parent=root) {
    return mesh(name,new THREE.CylinderGeometry(top,bottom,height,segments),material,x,y,z,parent);
  }
  function beam(name,a,b,width,depth,material,parent=root) {
    const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), direction=end.clone().sub(start);
    const center=start.clone().add(end).multiplyScalar(.5);
    const result=box(name,width,direction.length(),depth,material,...center.toArray(),parent);
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); return result;
  }
  // True annular sectors, not overlapping boxes. Shared modest tessellation.
  function sector(name,inner,outer,a,b,depth,material,z,cy=0,parent=root) {
    const shape=new THREE.Shape(); shape.moveTo(Math.cos(a)*outer,Math.sin(a)*outer);
    shape.absarc(0,0,outer,a,b,false); shape.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);
    shape.absarc(0,0,inner,b,a,true); shape.closePath();
    return mesh(name,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:3}),material,0,cy,z,parent);
  }
  // Shallow service panel facing local +Z. Four broad louvers and two catches
  // add readable construction detail without a fine grille or new materials.
  function vent(name,w,h,parent) {
    box(`${name}-recess`,w,h,.24,'recess',0,0,0,parent);
    for(const x of [-w/2,w/2])box(`${name}-rim`,.2,h,.34,'steel',x,0,.12,parent);
    for(let i=0;i<4;i++)box(`${name}-louver`,w*.77,h*.105,.25,'frame',0,(i-1.5)*h*.19,.24,parent);
    for(const y of [-h*.43,h*.43])box(`${name}-catch`,w*.35,.22,.32,'coupling',0,y,.27,parent);
  }
  function finish(metadata) {
    // Vertex bounds avoid the overestimate produced by rotated local AABBs.
    const bounds=new THREE.Box3(),point=new THREE.Vector3();root.updateMatrixWorld(true);
    root.traverse(part=>{if(!part.isMesh)return;const p=part.geometry.attributes.position;
      for(let i=0;i<p.count;i++)bounds.expandByPoint(point.fromBufferAttribute(p,i).applyMatrix4(part.matrixWorld));});
    const center=bounds.getCenter(new THREE.Vector3());
    for(const child of root.children){child.position.x-=center.x;child.position.y-=bounds.min.y;child.position.z-=center.z;}
    root.userData={role:'off-track-decoration',interactive:false,revision:2,
      dimensions:bounds.getSize(new THREE.Vector3()).toArray(),
      originOffset:[-center.x,-bounds.min.y,-center.z],...metadata};
    return root;
  }
  return {root,materials,mesh,box,cylinder,beam,sector,vent,finish};
}

export function brokenArc(THREE) {
  const k=kit(THREE,'broken-arc-r2-study-r1');
  const start=THREE.MathUtils.degToRad(45), sweep=THREE.MathUtils.degToRad(280);
  const count=28, step=sweep/count, cy=128;
  const position=(r,a,z)=>[Math.cos(a)*r,cy+Math.sin(a)*r,z];
  for(let i=0;i<count;i++){
    const a=start+i*step,b=a+step,mid=(a+b)/2;
    // Four continuous steel chords enclose an open skeletal cross section.
    for(const z of [-6,4.7])for(const r of [108,124.6])
      k.sector('continuous-ring-chord',r,r+1.4,a,b,1.3,'steel',z,cy);
    k.sector('outer-backbone',121.8,124.6,a,b,8.8,'frame',-4.4,cy);
    for(const z of [-5,5]){
      k.beam('radial-web',position(109,a,z),position(125,a,z),1.65,1.8,'frame');
      k.beam('diagonal-web',position(110,a,z),position(123,b,z),.9,1.05,'steel');
    }
    k.beam('cross-depth-tie',position(110,a,-6),position(110,a,6),1.4,1.4,'steel');
    // Armored bays alternate with exposed webbing so detail reads at distance.
    if(i%4!==2){
      for(const z of [-7.1,6.1]) k.sector('segmented-face-armor',119,124.2,a+.012,b-.012,1,'armor',z,cy);
      k.sector('outer-shell-panel',125.9,126.8,a+.016,b-.016,7.8,'armor',-3.9,cy);
      if(i%2===0)for(const side of [-1,1]){
        const panel=new THREE.Group();panel.name='ring-armor-service-panel';
        panel.position.set(...position(121.5,mid,side*7.28));panel.rotation.z=mid;
        if(side<0)panel.rotation.y=Math.PI;k.root.add(panel);
        k.vent('ring-armor-vent',3.1,6.2,panel);
        for(const y of [-7,7]){
          k.box('ring-panel-seam',4.2,.28,.18,'recess',0,y,0,panel);
          k.box('ring-panel-lock',1.05,.8,.45,'steel',0,y+1.3,.18,panel);
        }
      }
    }
    if(i%2===1){
      // Short parallel conduit runs inside selected open bays, with end clamps.
      for(const r of [117,119]){
        k.beam('ring-service-conduit',position(r,a+.023,0),position(r,b-.023,0),.65,.65,'steel');
        for(const angle of [a+.037,b-.037])
          k.beam('ring-conduit-clamp',position(r-.7,angle,0),position(r+.7,angle,0),.8,1.25,'coupling');
      }
    }
    if(i%3===0){
      for(const side of [-1,1]){
        const z=side>0?6.2:-7.2;
        k.sector('light-recess',111.2,117.3,a+.033,b-.033,1,'recess',z,cy);
        k.sector('cyan-ring-light',112.5,114.2,a+.044,b-.044,.45,'cyan',side>0?7.25:-7.7,cy);
        k.sector('light-steel-divider',115,115.55,a+.044,b-.044,.4,'steel',side>0?7.25:-7.65,cy);
      }
    }
    if(i%7===4){
      const joint=new THREE.Group(); joint.position.set(...position(118,mid,0));joint.rotation.z=mid;k.root.add(joint);
      k.box('ring-service-housing',17,5.5,16,'frame',0,0,0,joint);
      k.box('service-armor',13,4.1,1,'armor',0,0,8.5,joint);
      k.box('amber-service-marker',4.4,.75,.45,'amber',0,0,9.2,joint);
    }
  }
  // Chunky capped ends make the missing arc obvious, even from far away.
  for(const angle of [start,start+sweep]){
    const terminal=new THREE.Group();terminal.name='open-arc-terminal';terminal.position.set(...position(118,angle,0));terminal.rotation.z=angle;k.root.add(terminal);
    k.box('terminal-core',24,9,19,'frame',0,0,0,terminal);
    for(const z of [-10,10]){
      k.box('terminal-inset',19,6.8,1.6,'recess',0,0,z,terminal);
      for(const x of [-10.6,10.6])k.box('terminal-armor-cheek',2.4,10.2,2.4,'armor',x,0,z,terminal);
      for(const y of [-4.5,4.5])k.box('terminal-armor-cap',19,1.4,2,'armor',0,y,z,terminal);
      for(const x of [-6.3,6.3]) k.box('terminal-amber-bar',1.1,5.2,.7,'amber',x,0,z+Math.sign(z)*1.2,terminal);
      k.box('terminal-center-grille',6.5,5.5,.6,'steel',0,0,z+Math.sign(z)*1.05,terminal);
      for(const y of [-1.8,0,1.8])k.box('terminal-grille-slot',5,.65,.3,'recess',0,y,z+Math.sign(z)*1.45,terminal);
      for(const x of [-10.6,10.6])for(const y of [-3.5,3.5]){
        k.box('terminal-lock-socket',1.2,1.2,.35,'recess',x,y,z+Math.sign(z)*1.3,terminal);
        k.box('terminal-large-fastener',.65,.65,.4,'steel',x,y,z+Math.sign(z)*1.6,terminal);
      }
    }
    k.box('terminal-back-band',25.5,2.4,20,'coupling',0,0,0,terminal);
  }
  return k.finish({concept:'R2 — Broken arc',innerDiameterMeters:216,nominalDiameterMeters:254,
    apertureCenter:[0,cy,0],openingDegrees:80,detailIntent:'open double rails, modular armor, visible ribs and recessed lights'});
}

export function relayCrown(THREE) {
  const k=kit(THREE,'relay-crown-p3-study-r1');
  k.cylinder('lower-counterweight',8,4.5,9,'frame',0,4.5,0,16);
  k.cylinder('base-machinery',7.5,8,10,'recess',0,14,0,16);
  k.cylinder('main-dark-column',5.7,6.6,72,'recess',0,54,0,16);
  k.cylinder('upper-neck',4.8,5.7,14,'frame',0,94,0,16);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,x=Math.cos(a)*6.9,z=Math.sin(a)*6.9;
    k.cylinder('vertical-service-pipe',.75,.75,73,'steel',x,53,z,8);
    for(const y of [33,70]){
      k.cylinder('pipe-coupling-sleeve',1.1,1.1,2.1,'frame',x,y,z,8);
      k.cylinder('pipe-coupling-band',1.15,1.15,.55,'coupling',x,y,z,8);
    }
    for(const y of [16,46,79]){
      const panel=k.box('spine-armor-segment',2.9,13,1.2,'armor',Math.cos(a)*8,y,Math.sin(a)*8);
      panel.rotation.y=Math.PI/2-a;
      if(y===46){
        const face=new THREE.Group();face.position.set(Math.cos(a)*8.75,y,Math.sin(a)*8.75);
        face.rotation.y=Math.PI/2-a;k.root.add(face);k.vent('spine-service-vent',2.25,5.8,face);
        for(const offset of [-5,5])k.box('spine-panel-seam',2.5,.22,.2,'recess',0,offset,0,face);
      }
    }
    k.beam('base-splayed-strut',[x*.52,1,z*.52],[x*1.4,21,z*1.4],1.3,1.6,'steel');
  }
  for(const [y,r] of [[23,11.8],[59,11],[91,10.3]]){
    k.cylinder('collar-black-band',r,r,6.4,'recess',0,y,0,24);
    k.cylinder('collar-lower-flange',r+1,r+1,1.1,'steel',0,y-3.6,0,24);
    k.cylinder('collar-upper-flange',r+.7,r+.7,1.2,'steel',0,y+3.6,0,24);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const node=new THREE.Group();node.position.set(Math.sin(a)*(r-.4),y,Math.cos(a)*(r-.4));node.rotation.y=a;k.root.add(node);
      k.box('collar-armor-tile',6.7,5.6,1.5,'armor',0,.3,0,node);
      k.box('collar-light-recess',5.2,1.5,.5,'recess',0,-1.05,1,node);
      k.box('collar-cyan-dash',4.6,.7,.35,'cyan',0,-1.05,1.4,node);
      for(const x of [-2.35,2.35])k.box('collar-fastener',.55,.55,.4,'steel',x,1.7,1,node);
      k.box('collar-access-seam',2.6,.22,.25,'recess',0,1.8,1,node);
      for(const x of [-2.8,2.8])k.box('collar-edge-latch',.5,1.6,.45,'frame',x,-.5,1,node);
    }
  }
  k.cylinder('crown-bearing',11.2,9.5,3.5,'coupling',0,101,0,24);
  k.cylinder('crown-core-cage',4.7,4.7,17,'frame',0,112,0,12);
  k.cylinder('crown-core-cap',5.6,4.7,2,'armor',0,121,0,12);
  for(const y of [105,117])k.cylinder('core-cage-retainer',5.25,5.25,.8,'steel',0,y,0,12);
  k.cylinder('crown-tip-beacon',.7,.7,2.4,'amber',0,123,0,8);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    const node=new THREE.Group();node.position.set(Math.sin(a)*4.55,111.5,Math.cos(a)*4.55);node.rotation.y=a;k.root.add(node);
    k.box('core-light-channel',2,12,1,'recess',0,0,0,node);
    k.box('core-cyan-cell',1.1,10.5,.5,'cyan',0,0,.7,node);
  }
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3, radial=(r,y)=>[Math.sin(a)*r,y,Math.cos(a)*r];
    k.beam('crown-lower-arm',radial(8,97),radial(15,111),4.5,4.8,'frame');
    k.beam('crown-upper-arm',radial(15,111),radial(19,128),4.2,4.6,'armor');
    k.beam('crown-arm-recess',radial(16.1,113),radial(19.5,126),1.5,5,'recess');
    k.cylinder('crown-knuckle',3.1,3.1,3.2,'steel',...radial(15,111),12);
    k.cylinder('knuckle-split-band',3.25,3.25,.75,'coupling',...radial(15,111),12);
    const prong=new THREE.Group();prong.position.set(...radial(20.1,121));prong.rotation.y=a;prong.rotation.x=Math.atan(4/17);k.root.add(prong);
    k.vent('prong-cooling-panel',2.3,5.2,prong);
    k.cylinder('prong-end-cap',2.4,2.8,3,'frame',...radial(19,129),8);
    k.cylinder('prong-amber-marker',.65,.65,3,'amber',...radial(19,132),8);
  }
  return k.finish({concept:'P3 — Relay crown',detailIntent:'three prongs, exposed service spine, stepped cyan collars'});
}

export function serviceBoom(THREE) {
  const k=kit(THREE,'service-boom-s3-study-r1');
  // One structural mast. No suspended pods, cylinders or equipment below the arm.
  k.cylinder('mast-foot',6.5,4.5,7,'frame',0,3.5,0,12);
  k.cylinder('mast-dark-spine',4.6,5,31,'recess',0,22,0,12);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    k.cylinder('mast-steel-rail',.65,.65,29,'steel',Math.sin(a)*5.1,22,Math.cos(a)*5.1,8);
    const node=new THREE.Group();node.position.set(Math.sin(a)*5.7,20,Math.cos(a)*5.7);node.rotation.y=a;k.root.add(node);
    k.box('mast-armored-face',4,17,1.1,'armor',0,0,0,node);
    k.box('mast-light-slot',1.3,12,.55,'recess',0,0,.75,node);
    k.box('mast-cyan-dash',.65,10.5,.35,'cyan',0,0,1.15,node);
    for(const y of [-6.8,6.8]){
      k.box('mast-face-seam',3.5,.23,.2,'recess',0,y,.7,node);
      for(const x of [-1.4,1.4])k.box('mast-face-catch',.55,.65,.4,'steel',x,y,1,node);
    }
  }
  for(const y of [7,33]){
    k.cylinder('mast-bearing',7.2,7.2,2.6,'steel',0,y,0,16);
    k.cylinder('mast-bearing-band',7.4,7.4,1,'coupling',0,y,0,16);
  }
  // Four longitudinal chords and wide triangular side bays form the main arm.
  const first=-10,last=128,lower=36,upper=48;
  for(const z of [-5,5])for(const y of [lower,upper])
    k.beam('boom-longitudinal-chord',[first,y,z],[last,y,z],1.65,1.65,'frame');
  for(let i=0;i<9;i++){
    const a=first+i*(last-first)/9,b=first+(i+1)*(last-first)/9,mid=(a+b)/2;
    for(const z of [-5,5]){
      k.beam('boom-diagonal-web',[a,i%2?upper:lower,z],[b,i%2?lower:upper,z],1.1,1.15,'steel');
      k.beam('boom-vertical-rib',[a,lower,z],[a,upper,z],1.6,1.6,'frame');
    }
    k.beam('boom-cross-tie',[a,upper,-5],[a,upper,5],1.2,1.2,'steel');
    k.box('boom-roof-armor',12.8,.95,12.3,'armor',mid,49.1,0);
    if(i%2===1){
      const roof=new THREE.Group();roof.position.set(mid,49.75,0);roof.rotation.x=-Math.PI/2;k.root.add(roof);
      k.vent('boom-roof-vent',7.5,6.6,roof);
      for(const x of [-5.25,5.25]){
        k.box('roof-panel-seam',.23,10.6,.18,'recess',x,0,0,roof);
        for(const y of [-4.6,4.6])k.box('roof-lock',.8,.85,.4,'steel',x,y,.15,roof);
      }
    }
    for(const z of [-6,6]){
      k.box('boom-lower-light-recess',11,2.2,1,'recess',mid,36,z);
      k.box('boom-cyan-rail',9.2,.85,.55,'cyan',mid,36,z+Math.sign(z)*.8);
      for(const offset of [-4.8,4.8])k.box('boom-light-end-bezel',.45,1.4,.75,'steel',mid+offset,36,z+Math.sign(z)*.65);
      if(i%2===1)for(const y of [37.8,46.2]){
        k.box('truss-junction-plate',3.4,3.3,.75,'frame',a,y,z-.4*Math.sign(z));
        k.box('truss-junction-lock',.85,.85,.45,'steel',a,y,z+.15*Math.sign(z));
      }
    }
    if(i%3===0){
      for(const z of [-6,6]){
        k.box('boom-joint-armor',5,15,1.7,'armor',a,42,z);
        k.box('boom-joint-dark-inset',2.5,7,.5,'recess',a,42,z+Math.sign(z)*1.1);
        k.box('boom-amber-joint',2.3,.9,.4,'amber',a,46.5,z+Math.sign(z)*1.25);
        for(const y of [40,42,44])k.box('boom-joint-vent-slat',1.9,.48,.35,'steel',a,y,z+Math.sign(z)*1.45);
        for(const x of [-1.7,1.7])k.box('boom-joint-latch',.5,1.4,.4,'frame',a+x,38,z+Math.sign(z)*1.1);
      }
    }
  }
  for(const z of [-2.1,2.1])k.beam('internal-long-service-conduit',[first,43,z],[last,43,z],1.1,1.1,'steel');
  k.box('mast-crosshead',17,15,14,'frame',0,42,0);
  k.box('crosshead-top-shell',17.7,1.2,14.8,'armor',0,50,0);
  for(const z of [-7.25,7.25]){
    const face=new THREE.Group();face.position.set(0,43,z);if(z<0)face.rotation.y=Math.PI;k.root.add(face);
    k.vent('crosshead-service-vent',7.2,5.8,face);
  }
  for(const x of [first,last]){
    k.box('boom-terminal-housing',7,15.5,14,'frame',x,42,0);
    k.box('boom-terminal-top',7.8,1.2,15,'armor',x,50.2,0);
    for(const z of [-7.5,7.5]){
      k.box('boom-terminal-plate',5.7,11.5,1.2,'armor',x,42,z);
      k.box('boom-terminal-vent',3.8,7,.5,'recess',x,42,z+Math.sign(z)*.9);
      for(const y of [40,42,44])k.box('terminal-louver',3.2,.55,.6,'steel',x,y,z+Math.sign(z)*1.3);
      k.box('boom-terminal-marker',3.3,.8,.4,'amber',x,37.7,z+Math.sign(z)*1.3);
    }
  }
  return k.finish({concept:'S3 — Service boom / no hanging pods',detailIntent:'open cantilever truss, armored roof, cyan rails; clear underside'});
}

export default function generate(THREE,{kind='ring'}={}) {
  const factory={ring:brokenArc,pylon:relayCrown,boom:serviceBoom}[kind];
  if(!factory)throw new Error(`Unknown off-track decoration: ${kind}`);
  return factory(THREE);
}
