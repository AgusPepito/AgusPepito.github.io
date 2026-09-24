// Original recipe candidate. Front +Z; meters; base y=0. No external assets.
export default function generate(THREE) {
  const g = new THREE.Group();
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe5e1d2, roughness: 0.43, metalness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202b38, roughness: 0.58, metalness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x66798a, roughness: 0.38, metalness: 0.75 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x102534, roughness: 0.19, metalness: 0.65 });
  const energy = new THREE.MeshStandardMaterial({ color: 0x4de1ff, emissive: 0x4de1ff, emissiveIntensity: 18, roughness: 0.25 });
  energy.name = 'phase-energy';
  const accent = new THREE.MeshStandardMaterial({ color: 0xec713b, roughness: 0.5 });
  const add = (geometry, material, x=0, y=0, z=0) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); g.add(mesh); return mesh;
  };
  const box = (w,h,d,m,x,y,z) => add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const ring = (r,t,m,x,y,z) => add(new THREE.TorusGeometry(r,t,8,24),m,x,y,z);
  // A / KESTREL: faceted monocoque and separate slab-armored nacelles.
  // Plan-view polygons extruded upward with chamfered edges; front is +Z.
  const plate = (points, thickness, material, y=0) => {
    const shape = new THREE.Shape();
    points.forEach(([x,z],i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:0.045,bevelSize:0.045,bevelSegments:1,steps:1});
    geo.rotateX(-Math.PI/2); return add(geo,material,0,y,0);
  };
  plate([[-.43,-1.4],[.43,-1.4],[.57,.15],[.25,1.83],[0,2.05],[-.25,1.83],[-.57,.15]],.24,dark,.12);
  plate([[-.38,-1.12],[.38,-1.12],[.43,.3],[0,2],[-.43,.3]],.23,ivory,.4);
  plate([[-.25,.12],[.25,.12],[.18,.87],[0,1.16],[-.18,.87]],.13,glass,.67);
  const core=add(new THREE.CylinderGeometry(.29,.29,.075,12),energy,0,.7,-.73);
  const collar=ring(.34,.045,metal,0,.7,-.73);collar.rotation.x=-Math.PI/2;
  for(const side of [-1,1]) {
    box(1.1,.13,.42,dark,side*.8,.29,-.3);
    plate([[side*.77,-1.72],[side*1.43,-1.72],[side*1.38,.18],[side*.97,1.03],[side*.76,.51]],.29,dark,.18);
    plate([[side*.83,-1.47],[side*1.39,-1.47],[side*1.29,.2],[side*.97,.97],[side*.84,.31]],.24,ivory,.49);
    ring(.24,.085,metal,side*1.1,.42,-1.77);
    add(new THREE.CylinderGeometry(.2,.2,.065,12),energy,side*1.1,.42,-1.8).rotation.x=Math.PI/2;
    const fin=box(.085,.38,.57,ivory,side*1.37,.7,-1.05); fin.rotation.z=-side*.23;
    box(.09,.1,.25,accent,side*1.41,.85,-1.16);
    for(let i=0;i<3;i++) box(.27,.035,.075,dark,side*1.07,.785,-.8+i*.17);
    box(.075,.04,.43,energy,side*.36,.7,-.62);
    box(.08,.03,.21,accent,side*.25,.69,.32);
  }
  // Revision 2: layered fittings rather than painted-on detail.
  const pipe = (a,b,r,material) => {
    const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), delta=end.clone().sub(start);
    const mesh=add(new THREE.CylinderGeometry(r,r,delta.length(),8),material);
    mesh.position.copy(start.add(end).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    return mesh;
  };
  const deckCore = (x,y,z,r) => {
    add(new THREE.CylinderGeometry(r*1.18,r*1.2,.09,16),dark,x,y,z);
    add(new THREE.CylinderGeometry(r,r,.055,24),energy,x,y+.075,z);
    ring(r*1.06,.025,metal,x,y+.085,z).rotation.x=-Math.PI/2;
    ring(r*.68,.025,energy,x,y+.11,z).rotation.x=-Math.PI/2;
    for(let i=0;i<6;i++) {
      const angle=i*Math.PI/3;
      box(.065,.035,.09,metal,x+Math.sin(angle)*r*1.11,y+.1,z+Math.cos(angle)*r*1.11).rotation.y=angle;
    }
  };
  const engineDetail = (x,y,z,r) => {
    // Rear-facing nozzle: nested lips, visible injector blades, luminous throat.
    ring(r*1.14,.055,dark,x,y,z-.05);
    ring(r,.035,metal,x,y,z-.1);
    ring(r*.82,.035,energy,x,y,z-.13);
    add(new THREE.CylinderGeometry(r*.67,r*.67,.045,20),energy,x,y,z-.13).rotation.x=Math.PI/2;
    for(let i=0;i<10;i++) {
      const angle=i*Math.PI/5, px=x+Math.sin(angle)*r*.96, py=y+Math.cos(angle)*r*.96;
      box(.035,.085,.12,metal,px,py,z-.08).rotation.z=-angle;
    }
  };
  deckCore(0,.81,-.73,.3);
  for(const side of [-1,1]) {
    engineDetail(side*1.1,.42,-1.8,.26);
    // Raised phase rails sit above the armor, readable from the chase camera.
    box(.14,.05,.88,energy,side*.98,.85,-.63);
    box(.2,.08,.94,dark,side*.98,.79,-.63);
    plate([[side*.83,-.32],[side*1.25,-.32],[side*1.23,.14],[side*.98,.57],[side*.84,.22]],.06,ivory,.8);
    for(let i=0;i<5;i++) {
      const louver=box(.25,.035,.055,metal,side*1.23,.83,-.45-i*.15);louver.rotation.x=.25;
    }
    for(const z of [-1.25,-.18,.43]) {
      add(new THREE.CylinderGeometry(.027,.027,.023,6),metal,side*.87,.865,z);
    }
    pipe([side*.47,.32,-.95],[side*.83,.32,-.58],.038,metal);
    pipe([side*.47,.38,-.92],[side*.83,.38,-.55],.017,energy);
    const finLight=box(.095,.12,.42,energy,side*1.38,.87,-1.02);finLight.rotation.z=-side*.23;
    box(.1,.035,.63,energy,side*.36,.72,.9).rotation.y=side*.12;
    box(.24,.08,.65,dark,side*.52,.15,-.3);
    for(let i=0;i<4;i++) box(.27,.055,.045,metal,side*.52,.11,-.55+i*.17);
    pipe([side*.23,.82,.2],[side*.17,.82,.83],.025,metal);
  }
  // Measure transformed vertices, then normalize to the shared gameplay envelope.
  g.updateMatrixWorld(true);
  const bounds = new THREE.Box3(), v = new THREE.Vector3();
  g.traverse(n => { if (!n.isMesh) return; const p=n.geometry.attributes.position;
    for(let i=0;i<p.count;i++) bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(n.matrixWorld));
  });
  const center=bounds.getCenter(new THREE.Vector3()), size=bounds.getSize(new THREE.Vector3());
  for(const child of g.children) { child.position.x-=center.x; child.position.y-=bounds.min.y; child.position.z-=center.z; }
  g.scale.set(3.1/size.x, 0.95/size.y, 3.9/size.z);
  return g;
}
