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
  // B / MANTA: continuous swept lifting body with lathed engine housings.
  // Plan-view polygons extruded upward with chamfered edges; front is +Z.
  const plate = (points, thickness, material, y=0) => {
    const shape = new THREE.Shape();
    points.forEach(([x,z],i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:0.045,bevelSize:0.045,bevelSegments:1,steps:1});
    geo.rotateX(-Math.PI/2); return add(geo,material,0,y,0);
  };
  plate([[0,2.05],[.3,1.43],[.48,.64],[1.47,-.8],[1.5,-1.38],[.88,-1.23],[.38,-1.68],[-.38,-1.68],[-.88,-1.23],[-1.5,-1.38],[-1.47,-.8],[-.48,.64],[-.3,1.43]],.17,dark,.15);
  plate([[0,1.98],[.22,1.37],[.4,.5],[1.4,-.95],[1.39,-1.15],[.74,-.84],[.3,-1.42],[-.3,-1.42],[-.74,-.84],[-1.39,-1.15],[-1.4,-.95],[-.4,.5],[-.22,1.37]],.16,ivory,.38);
  const canopy=add(new THREE.SphereGeometry(1,12,8),glass,0,.58,.53);canopy.scale.set(.26,.22,.66);
  box(.19,.06,.61,energy,0,.65,-.55);
  for(const side of [-1,1]) {
    const profile=[new THREE.Vector2(.22,-.68),new THREE.Vector2(.31,-.53),new THREE.Vector2(.33,-.12),new THREE.Vector2(.25,.56),new THREE.Vector2(.11,.82)];
    const pod=add(new THREE.LatheGeometry(profile,10),ivory,side*.97,.38,-.65);pod.rotation.x=Math.PI/2;pod.material.side=THREE.DoubleSide;
    ring(.235,.065,dark,side*.97,.38,-1.36);
    add(new THREE.CylinderGeometry(.18,.18,.05,12),energy,side*.97,.38,-1.4).rotation.x=Math.PI/2;
    const fin=box(.07,.3,.55,dark,side*1.32,.49,-1.02);fin.rotation.z=-side*.48;
    box(.07,.04,.34,accent,side*.62,.59,-.34).rotation.y=side*.52;
    for(let i=0;i<3;i++) box(.18,.04,.065,metal,side*.44,.59,-.67-i*.13);
    const strip=box(.075,.035,.65,energy,side*1.22,.55,-.77);strip.rotation.y=side*.26;
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
