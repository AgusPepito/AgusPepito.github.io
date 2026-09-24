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
  // C / SPLITFRAME: primitive-built outriggers and exposed central energy drum.
  const chassis=box(.72,.24,2.95,dark,0,.24,.1);
  const nose=add(new THREE.ConeGeometry(.5,1.7,4),ivory,0,.49,1.1);nose.rotation.x=Math.PI/2;nose.rotation.z=Math.PI/4;
  box(.56,.18,1.2,ivory,0,.47,-.44);
  box(.38,.2,.7,glass,0,.65,.32);
  const core=add(new THREE.CylinderGeometry(.34,.34,.12,12),energy,0,.67,-.8);
  const cage=ring(.39,.06,dark,0,.73,-.8);cage.rotation.x=-Math.PI/2;
  for(const side of [-1,1]) {
    for(const z of [-.9,.25]) {const strut=box(.88,.13,.16,metal,side*.73,.3,z);strut.rotation.y=side*.2;}
    const pod=add(new THREE.CylinderGeometry(.35,.3,2.5,6),dark,side*1.12,.4,-.3);pod.rotation.x=Math.PI/2;
    box(.55,.16,1.85,ivory,side*1.12,.65,-.2);
    box(.1,.26,1.56,ivory,side*1.43,.4,-.12);
    const podNose=add(new THREE.ConeGeometry(.34,.75,6),ivory,side*1.12,.4,1.28);podNose.rotation.x=Math.PI/2;
    ring(.26,.075,metal,side*1.12,.4,-1.6);
    add(new THREE.CylinderGeometry(.2,.2,.07,12),energy,side*1.12,.4,-1.64).rotation.x=Math.PI/2;
    box(.085,.045,1.22,energy,side*1.13,.76,-.33);
    const fin=box(.075,.32,.64,ivory,side*1.4,.82,-.91);fin.rotation.z=-side*.28;
    box(.085,.13,.16,accent,side*1.43,.9,-1.04);
    for(let i=0;i<4;i++) box(.29,.04,.06,dark,side*1.12,.76,.27-i*.12);
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
  deckCore(0,.82,-.8,.31);
  for(const side of [-1,1]) {
    engineDetail(side*1.12,.4,-1.66,.28);
    for(const z of [-1.12,-.48,.22]) {
      box(.62,.06,.085,metal,side*1.12,.78,z);
      box(.07,.35,.085,metal,side*1.45,.52,z);
      add(new THREE.CylinderGeometry(.027,.027,.025,6),accent,side*1.34,.83,z);
    }
    box(.2,.045,.72,energy,side*1.12,.81,-.25);
    box(.16,.04,.23,energy,side*1.12,.81,-1.01);
    pipe([side*.36,.48,-1.13],[side*.85,.5,-.98],.045,metal);
    pipe([side*.36,.57,-1.13],[side*.85,.59,-.98],.024,energy);
    pipe([side*.38,.29,.42],[side*.85,.29,.64],.035,metal);
    for(let i=0;i<4;i++) box(.28,.08,.055,metal,side*1.12,.05,-.72+i*.22);
    box(.09,.18,.34,energy,side*1.43,.82,-.81);
    pipe([side*.2,.8,.04],[side*.2,.8,.57],.024,ivory);
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
