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
  deckCore(0,.69,-.75,.27);
  for(const side of [-1,1]) {
    engineDetail(side*.97,.38,-1.41,.24);
    // Sculpted shoulder plates float over a dark seam on the swept wings.
    plate([[side*.43,.18],[side*1.26,-.69],[side*1.32,-1.03],[side*.77,-.68]],.045,metal,.56);
    plate([[side*.45,.15],[side*1.2,-.66],[side*1.22,-.87],[side*.79,-.63]],.035,ivory,.62);
    const rail=box(.12,.045,.98,energy,side*.96,.68,-.5);rail.rotation.y=side*.62;
    for(let i=0;i<5;i++) {
      const vent=box(.22,.035,.052,dark,side*.58,.63,-.2-i*.13);vent.rotation.y=side*.42;
    }
    for(const z of [-1.08,-.91,-.74]) ring(.32,.018,metal,side*.97,.38,z);
    pipe([side*.26,.74,.17],[side*.2,.76,.74],.022,ivory);
    box(.085,.045,.42,energy,side*.17,.64,1.13);
    box(.29,.08,.53,dark,side*.73,.03,-.64);
    for(let i=0;i<4;i++) box(.3,.03,.05,metal,side*.73,-.025,-.85+i*.14);
    add(new THREE.CylinderGeometry(.03,.03,.02,6),accent,side*.82,.71,-.53);
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
