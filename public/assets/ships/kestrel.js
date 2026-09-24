// Original recipe candidate. Front +Z; meters; base y=0. No external assets.
export default function generate(THREE) {
  const g = new THREE.Group();
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe5e1d2, roughness: 0.43, metalness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202b38, roughness: 0.58, metalness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x66798a, roughness: 0.38, metalness: 0.75 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x102534, roughness: 0.19, metalness: 0.65 });
  const energy = new THREE.MeshStandardMaterial({ color: 0x4de1ff, emissive: 0x4de1ff, emissiveIntensity: 1.8, roughness: 0.25 });
  energy.name = 'phase-energy';
  const accent = new THREE.MeshStandardMaterial({ color: 0xec713b, roughness: 0.5 });
  const add = (geometry, material, x=0, y=0, z=0) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); g.add(mesh); return mesh;
  };
  const box = (w,h,d,m,x,y,z) => add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const ring = (r,t,m,x,y,z) => add(new THREE.TorusGeometry(r,t,6,16),m,x,y,z);
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
