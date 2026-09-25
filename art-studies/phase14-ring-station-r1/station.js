// Isolated phase-14 reference study. Recipe contract: no imports or external assets.
// Metres, Y-up, ring in XZ. Static scenery; no gameplay registration or collider.
export default function generate(THREE) {
  const root = new THREE.Group();
  root.name = 'orbital-ring-station-study-r1';
  const materials = {
    hull: new THREE.MeshStandardMaterial({color:0x484e53, roughness:.6, metalness:.42}),
    shadow: new THREE.MeshStandardMaterial({color:0x171f27, roughness:.78, metalness:.2}),
    ivory: new THREE.MeshStandardMaterial({color:0xb9b9ac, roughness:.58, metalness:.28}),
    pale: new THREE.MeshStandardMaterial({color:0xd2cfc0, roughness:.54, metalness:.3}),
    steel: new THREE.MeshStandardMaterial({color:0x79838a, roughness:.47, metalness:.6}),
    light: new THREE.MeshStandardMaterial({color:0xe6dfc9, emissive:0xe6dfc9, emissiveIntensity:.65, roughness:.6}),
  };
  Object.entries(materials).forEach(([key, mat]) => { mat.name = `station-${key}`; });
  function add(name, geometry, material, x=0,y=0,z=0) {
    const mesh = new THREE.Mesh(geometry, materials[material]);
    mesh.name=name; mesh.position.set(x,y,z); root.add(mesh); return mesh;
  }
  function box(name,w,h,d,material,x,y,z,rotation=0) {
    const m=add(name,new THREE.BoxGeometry(w,h,d),material,x,y,z);
    m.rotation.y=rotation;return m;
  }
  function cylinder(name,top,bottom,height,material,y,x=0,z=0,segments=32) {
    return add(name,new THREE.CylinderGeometry(top,bottom,height,segments),material,x,y,z);
  }
  function radialBox(name,r,angle,w,h,d,material,y) {
    return box(name,w,h,d,material,Math.cos(angle)*r,y,Math.sin(angle)*r,-angle);
  }
  function beam(name,from,to,width,depth,material) {
    const a=new THREE.Vector3(...from), b=new THREE.Vector3(...to);
    const delta=b.clone().sub(a), center=a.clone().add(b).multiplyScalar(.5);
    const m=add(name,new THREE.BoxGeometry(width,delta.length(),depth),material,...center.toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  }
  function sector(name,inner,outer,a,b,height,y,material) {
    const s=new THREE.Shape();
    s.moveTo(Math.cos(a)*outer,Math.sin(a)*outer);
    s.absarc(0,0,outer,a,b,false);
    s.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);
    s.absarc(0,0,inner,b,a,true);s.closePath();
    const m=add(name,new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:6}),material,0,y,0);
    m.rotation.x=-Math.PI/2;return m;
  }

  // A thin inhabited ring, not a thick torus. Wide empty wedges are the main detail.
  const count=40, step=Math.PI*2/count;
  for(let i=0;i<count;i++) {
    const a=i*step, b=(i+1)*step;
    sector('continuous-ring-core',84.5,92,a,b,3.3,37.5,'shadow');
    sector('separated-upper-hull-course',85.1,91.7,a+.009,b-.009,.75,40.8,i%5===0?'pale':i%2===0?'ivory':'hull');
    sector('outer-belt-armor',91.7,92.35,a+.013,b-.013,2.5,37.9,i%5===0?'ivory':'hull');
    sector('lower-rim-flange',84.3,92.5,a+.007,b-.007,.5,36.95,'steel');
    // Large dark breaks and sparse windows survive distance; no sub-pixel bolts.
    if(i%5===0) {
      const angle=-(a+b)/2;
      radialBox('rim-service-block',88.3,angle,6.3,3,6.5,'ivory',43.05);
      radialBox('service-block-dark-cap',88.3,angle,5.9,.65,5.9,'shadow',44.88);
      radialBox('rim-window-cluster',92.48,angle,.22,.85,3.2,'light',39.25);
    }
  }

  // Eight slender spokes, with paired rails and only a few broad structural nodes.
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    radialBox('radial-spoke-deck',55.3,a,63,2.3,3.9,'hull',38.8);
    for(const side of [-1,1]) {
      const tangentX=-Math.sin(a)*side*1.95, tangentZ=Math.cos(a)*side*1.95;
      const m=radialBox('spoke-edge-rail',55.3,a,63,.65,.46,'steel',40.35);
      m.position.x+=tangentX;m.position.z+=tangentZ;
    }
    radialBox('ivory-spoke-socket',79,a,9,3.4,5.5,'ivory',39);
    radialBox('spoke-midpoint-coupling',53,a,3.4,2.8,5.5,'shadow',38.9);
    // Lower diagonal ties remain sparse so the open wheel silhouette stays clear.
    beam('hub-to-spoke-brace',[Math.cos(a)*19,31,Math.sin(a)*19],[Math.cos(a)*68,37.65,Math.sin(a)*68],1.2,1.2,'steel');
  }

  // Shallow concentric hub decks. These broad steps read even when windows do not.
  cylinder('lower-hub-skirt',17.5,12,5.5,'hull',30.5);
  cylinder('lower-hub-rim',23.5,23.5,1.5,'steel',34);
  cylinder('dark-hub-waist',25,23,4.5,'shadow',37);
  cylinder('main-hub-deck',26.8,25.4,2.1,'hull',40.15);
  cylinder('upper-hub-terrace',19.5,24.5,2.2,'ivory',42.3);
  cylinder('central-machinery-drum',13,15.8,5.2,'hull',46);
  cylinder('upper-collar',14.2,14.2,1,'steel',49.1);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    radialBox('hub-radial-armor',20.7,a,7,.7,3.8,i%3===0?'pale':'hull',43.4);
    radialBox('hub-window-group',25.15,a,.3,.8,2.6,i%3===0?'light':'steel',38.2);
  }
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2+.3;
    radialBox('hub-equipment-block',14,a,6,3.8,4.5,'shadow',46.7);
    radialBox('hub-equipment-armor',14,a,5.6,.55,4.2,'ivory',48.88);
  }

  // Narrow vertical spine, with an asymmetric secondary aerial like the reference.
  cylinder('mast-foot',7.5,10.2,6,'ivory',52.5,0,0,12);
  cylinder('mast-dark-column',4.4,6.5,15,'shadow',62.7,0,0,12);
  cylinder('mast-upper-column',2.5,4.2,19,'hull',79,0,0,12);
  cylinder('mast-tip',.7,1.65,18,'steel',97.5,0,0,8);
  cylinder('needle',.22,.52,9,'pale',111,0,0,6);
  for(const y of [58,69.5,85]) cylinder('mast-collar',y>70?3.4:6.5,y>70?3.4:6.5,1.2,'steel',y,0,0,12);
  for(const a of [0,Math.PI*.65,Math.PI*1.3]) {
    radialBox('mast-broad-ivory-fin',4.6,a,2.1,15,2.3,'ivory',65.5);
  }
  box('offset-aerial-base',4,3,4,'hull',-8,52,4);
  cylinder('offset-aerial',.65,1.25,26,'ivory',65,-8,4,8);
  cylinder('offset-aerial-needle',.25,.4,10,'steel',83,-8,4,6);
  box('mast-side-equipment',3.2,8,4.8,'ivory',5.6,78,0);
  box('mast-side-dark-slot',.3,5,2.1,'shadow',7.35,78,0);

  // The lower spindle balances the tall top aerial without making a second tower.
  cylinder('underside-central-drum',10,7,8,'shadow',25);
  cylinder('underside-collar',11,11,1.7,'steel',28.8);
  cylinder('lower-spindle',5.3,3.5,13,'hull',15);
  for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5]) radialBox('lower-spindle-fin',4.5,a,1.3,10,2.1,'ivory',17);
  cylinder('lower-needle',1.6,.45,9,'steel',4.5,0,0,8);
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2+.22,x=Math.cos(a)*88,z=Math.sin(a)*88;
    cylinder('rim-aerial-base',.75,1.1,3,'ivory',44,x,z,8);
    cylinder('rim-aerial',.22,.4,5.5,'steel',48.1,x,z,6);
  }

  // Exact transformed-vertex bounds keep the factory centered with its base at Y=0.
  const bounds=new THREE.Box3(),v=new THREE.Vector3();root.updateMatrixWorld(true);
  root.traverse(n=>{if(!n.isMesh)return;const p=n.geometry.attributes.position;
    for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(n.matrixWorld));});
  const center=bounds.getCenter(new THREE.Vector3());
  root.children.forEach(n=>{n.position.x-=center.x;n.position.y-=bounds.min.y;n.position.z-=center.z;});
  root.userData={category:'scenery',interactive:false,revision:'ring-station-study-r1',
    nominalDiameterMeters:185,ringHeightMeters:39,detailIntent:'silhouette, open spokes, broad armor breaks, tiered hub and mast'};
  return root;
}
