// Recipe route B. Flush lane insert based on docs/art/track/01-flat.png.
// +Z entrance, -Z exit. The colored bed is exactly the active width/length.
// Only top surfaces and shallow exposed bevels; no buried chassis or underside.
export default function generate(THREE, { kind = 'middle', phase = 0, color = [0x4de1ff,0xffbe55,0xdc8aff][phase], length = 12.5, width = 6.48 } = {}) {
  const root = new THREE.Group(); root.name = `phase-lane-${kind}-r1`;
  const tone = new THREE.Color(color);
  const mats = {
    bed: new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(.19), roughness: .67, metalness: .35 }),
    light: new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: .65, roughness: .45, metalness: .15 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x121c23, roughness: .8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x69777b, roughness: .6, metalness: .45 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xb7bcb6, roughness: .65, metalness: .2 }),
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = `lane-r1-${key}-${key === 'bed' || key === 'light' ? color : 'neutral'}`;
    // These are road decals: millimetric physical offsets alone lose depth
    // precision at the chase camera's shallow angle. Keep depth testing for
    // real occluders, but bias the surface toward the camera over the road.
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
  }
  function panel(name, x, z, w, l, y, material) {
    // Crosswise samples allow the same inset to follow a tube instead of
    // spanning it as a flat chord. Flat-road dimensions remain unchanged.
    const geo = new THREE.PlaneGeometry(w, l, Math.max(1, Math.ceil(w / .4)), Math.max(1, Math.ceil(l / 2)));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mats[material]); mesh.name = name;
    mesh.position.set(x, y, z); root.add(mesh); return mesh;
  }
  panel('active-phase-bed', 0, 0, width, length, .012, 'bed');
  for (const side of [-1, 1]) {
    // Recess illusion uses a narrow dark gutter and a 12 mm sloping rim.
    panel('recess-shadow-gutter', side * (width / 2 + .11), 0, .22, length, .013, 'graphite');
    const bevel = panel('flush-beveled-edge', side * (width / 2 + .20), 0, .12, length, .015, 'steel');
    const p = bevel.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, -side * p.getX(i) * .1);
    bevel.geometry.computeVertexNormals();
    panel('phase-boundary-light', side * (width / 2 - .075), 0, .15, length, .022, 'light');
  }
  // Quiet graphite panels between two bright boundaries; sparse center ticks.
  for (let z = -length / 2 + 2.5; z < length / 2 - .5; z += 2.5) {
    panel('inset-panel-seam', 0, z, width - .34, .045, .016, 'graphite');
    panel('phase-flow-tick', 0, z + .45, .18, .75, .021, 'light');
  }
  if (kind === 'start' || kind === 'end') {
    const sign = kind === 'start' ? 1 : -1;
    panel('phase-active-end-line', 0, sign * (length / 2 - .07), width, .14, .023, 'light');
    for (const side of [-1, 1]) {
      panel('endpoint-ivory-lock', side * (width / 2 + .11), sign * (length / 2 - .4), .19, .8, .026, 'ivory');
      panel('endpoint-fastener', side * (width / 2 + .11), sign * (length / 2 - .4), .07, .12, .028, 'graphite');
    }
    const shape = new THREE.Shape();
    if (phase === 1) { shape.moveTo(0,.52); shape.lineTo(-.5,-.36); shape.lineTo(.5,-.36); }
    else { shape.moveTo(0,.5); shape.lineTo(-.43,0); shape.lineTo(0,-.5); shape.lineTo(.43,0); }
    shape.closePath();
    const geometry = phase === 0 ? new THREE.CircleGeometry(.43, 20) : new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const badge = new THREE.Mesh(geometry, mats.light); badge.name = 'phase-endpoint-symbol';
    badge.position.set(0,.025,sign * (length / 2 - 1.35)); root.add(badge);
  }
  root.userData = { revision: '06-r1', kind, phase, length, activeWidth: width,
    visibility: 'Flush top surfaces and millimetric bevels only; no collision or hidden machinery.' };
  return root;
}
