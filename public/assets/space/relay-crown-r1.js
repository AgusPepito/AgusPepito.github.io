// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// art-studies/off-track-dressing-r1/models.js
function kit(THREE, name) {
  const root = new THREE.Group();
  root.name = name;
  const materials = {
    frame: new THREE.MeshStandardMaterial({ color: 2503744, metalness: 0.72, roughness: 0.38 }),
    recess: new THREE.MeshStandardMaterial({ color: 791838, metalness: 0.38, roughness: 0.61 }),
    armor: new THREE.MeshStandardMaterial({ color: 13029329, metalness: 0.48, roughness: 0.34 }),
    steel: new THREE.MeshStandardMaterial({ color: 7440276, metalness: 0.86, roughness: 0.27 }),
    coupling: new THREE.MeshStandardMaterial({ color: 9204048, metalness: 0.75, roughness: 0.34 }),
    cyan: new THREE.MeshStandardMaterial({ color: 7725055, emissive: 1227519, emissiveIntensity: 3.4, roughness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: 16763510, emissive: 16750876, emissiveIntensity: 2.8, roughness: 0.35 })
  };
  for (const [key, material] of Object.entries(materials)) material.name = `dressing-r1-${key}`;
  function mesh(name2, geometry, material, x = 0, y = 0, z = 0, parent = root) {
    const result = new THREE.Mesh(geometry, materials[material]);
    result.name = name2;
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  }
  function box(name2, w, h, d, material, x = 0, y = 0, z = 0, parent = root) {
    return mesh(name2, new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  }
  function cylinder(name2, top, bottom, height, material, x, y, z, segments = 12, parent = root) {
    return mesh(name2, new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z, parent);
  }
  function beam(name2, a, b, width, depth, material, parent = root) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const center = start.clone().add(end).multiplyScalar(0.5);
    const result = box(name2, width, direction.length(), depth, material, ...center.toArray(), parent);
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return result;
  }
  function sector(name2, inner, outer, a, b, depth, material, z, cy = 0, parent = root) {
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
    shape.absarc(0, 0, outer, a, b, false);
    shape.lineTo(Math.cos(b) * inner, Math.sin(b) * inner);
    shape.absarc(0, 0, inner, b, a, true);
    shape.closePath();
    return mesh(name2, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 3 }), material, 0, cy, z, parent);
  }
  function vent(name2, w, h, parent) {
    box(`${name2}-recess`, w, h, 0.24, "recess", 0, 0, 0, parent);
    for (const x of [-w / 2, w / 2]) box(`${name2}-rim`, 0.2, h, 0.34, "steel", x, 0, 0.12, parent);
    for (let i = 0; i < 4; i++) box(`${name2}-louver`, w * 0.77, h * 0.105, 0.25, "frame", 0, (i - 1.5) * h * 0.19, 0.24, parent);
    for (const y of [-h * 0.43, h * 0.43]) box(`${name2}-catch`, w * 0.35, 0.22, 0.32, "coupling", 0, y, 0.27, parent);
  }
  function finish(metadata) {
    const bounds = new THREE.Box3(), point = new THREE.Vector3();
    root.updateMatrixWorld(true);
    root.traverse((part) => {
      if (!part.isMesh) return;
      const p = part.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) bounds.expandByPoint(point.fromBufferAttribute(p, i).applyMatrix4(part.matrixWorld));
    });
    const center = bounds.getCenter(new THREE.Vector3());
    for (const child of root.children) {
      child.position.x -= center.x;
      child.position.y -= bounds.min.y;
      child.position.z -= center.z;
    }
    root.userData = {
      role: "off-track-decoration",
      interactive: false,
      revision: 2,
      dimensions: bounds.getSize(new THREE.Vector3()).toArray(),
      originOffset: [-center.x, -bounds.min.y, -center.z],
      ...metadata
    };
    return root;
  }
  return { root, materials, mesh, box, cylinder, beam, sector, vent, finish };
}
function relayCrown(THREE) {
  const k = kit(THREE, "relay-crown-p3-study-r1");
  k.cylinder("lower-counterweight", 8, 4.5, 9, "frame", 0, 4.5, 0, 16);
  k.cylinder("base-machinery", 7.5, 8, 10, "recess", 0, 14, 0, 16);
  k.cylinder("main-dark-column", 5.7, 6.6, 72, "recess", 0, 54, 0, 16);
  k.cylinder("upper-neck", 4.8, 5.7, 14, "frame", 0, 94, 0, 16);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, x = Math.cos(a) * 6.9, z = Math.sin(a) * 6.9;
    k.cylinder("vertical-service-pipe", 0.75, 0.75, 73, "steel", x, 53, z, 8);
    for (const y of [33, 70]) {
      k.cylinder("pipe-coupling-sleeve", 1.1, 1.1, 2.1, "frame", x, y, z, 8);
      k.cylinder("pipe-coupling-band", 1.15, 1.15, 0.55, "coupling", x, y, z, 8);
    }
    for (const y of [16, 46, 79]) {
      const panel = k.box("spine-armor-segment", 2.9, 13, 1.2, "armor", Math.cos(a) * 8, y, Math.sin(a) * 8);
      panel.rotation.y = Math.PI / 2 - a;
      if (y === 46) {
        const face = new THREE.Group();
        face.position.set(Math.cos(a) * 8.75, y, Math.sin(a) * 8.75);
        face.rotation.y = Math.PI / 2 - a;
        k.root.add(face);
        k.vent("spine-service-vent", 2.25, 5.8, face);
        for (const offset of [-5, 5]) k.box("spine-panel-seam", 2.5, 0.22, 0.2, "recess", 0, offset, 0, face);
      }
    }
    k.beam("base-splayed-strut", [x * 0.52, 1, z * 0.52], [x * 1.4, 21, z * 1.4], 1.3, 1.6, "steel");
  }
  for (const [y, r] of [[23, 11.8], [59, 11], [91, 10.3]]) {
    k.cylinder("collar-black-band", r, r, 6.4, "recess", 0, y, 0, 24);
    k.cylinder("collar-lower-flange", r + 1, r + 1, 1.1, "steel", 0, y - 3.6, 0, 24);
    k.cylinder("collar-upper-flange", r + 0.7, r + 0.7, 1.2, "steel", 0, y + 3.6, 0, 24);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const node = new THREE.Group();
      node.position.set(Math.sin(a) * (r - 0.4), y, Math.cos(a) * (r - 0.4));
      node.rotation.y = a;
      k.root.add(node);
      k.box("collar-armor-tile", 6.7, 5.6, 1.5, "armor", 0, 0.3, 0, node);
      k.box("collar-light-recess", 5.2, 1.5, 0.5, "recess", 0, -1.05, 1, node);
      k.box("collar-cyan-dash", 4.6, 0.7, 0.35, "cyan", 0, -1.05, 1.4, node);
      for (const x of [-2.35, 2.35]) k.box("collar-fastener", 0.55, 0.55, 0.4, "steel", x, 1.7, 1, node);
      k.box("collar-access-seam", 2.6, 0.22, 0.25, "recess", 0, 1.8, 1, node);
      for (const x of [-2.8, 2.8]) k.box("collar-edge-latch", 0.5, 1.6, 0.45, "frame", x, -0.5, 1, node);
    }
  }
  k.cylinder("crown-bearing", 11.2, 9.5, 3.5, "coupling", 0, 101, 0, 24);
  k.cylinder("crown-core-cage", 4.7, 4.7, 17, "frame", 0, 112, 0, 12);
  k.cylinder("crown-core-cap", 5.6, 4.7, 2, "armor", 0, 121, 0, 12);
  for (const y of [105, 117]) k.cylinder("core-cage-retainer", 5.25, 5.25, 0.8, "steel", 0, y, 0, 12);
  k.cylinder("crown-tip-beacon", 0.7, 0.7, 2.4, "amber", 0, 123, 0, 8);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const node = new THREE.Group();
    node.position.set(Math.sin(a) * 4.55, 111.5, Math.cos(a) * 4.55);
    node.rotation.y = a;
    k.root.add(node);
    k.box("core-light-channel", 2, 12, 1, "recess", 0, 0, 0, node);
    k.box("core-cyan-cell", 1.1, 10.5, 0.5, "cyan", 0, 0, 0.7, node);
  }
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3, radial = (r, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
    k.beam("crown-lower-arm", radial(8, 97), radial(15, 111), 4.5, 4.8, "frame");
    k.beam("crown-upper-arm", radial(15, 111), radial(19, 128), 4.2, 4.6, "armor");
    k.beam("crown-arm-recess", radial(16.1, 113), radial(19.5, 126), 1.5, 5, "recess");
    k.cylinder("crown-knuckle", 3.1, 3.1, 3.2, "steel", ...radial(15, 111), 12);
    k.cylinder("knuckle-split-band", 3.25, 3.25, 0.75, "coupling", ...radial(15, 111), 12);
    const prong = new THREE.Group();
    prong.position.set(...radial(20.1, 121));
    prong.rotation.y = a;
    prong.rotation.x = Math.atan(4 / 17);
    k.root.add(prong);
    k.vent("prong-cooling-panel", 2.3, 5.2, prong);
    k.cylinder("prong-end-cap", 2.4, 2.8, 3, "frame", ...radial(19, 129), 8);
    k.cylinder("prong-amber-marker", 0.65, 0.65, 3, "amber", ...radial(19, 132), 8);
  }
  return k.finish({ concept: "P3 \u2014 Relay crown", detailIntent: "three prongs, exposed service spine, stepped cyan collars" });
}

// recipe-entry.js
function groundOrigin(THREE, root) {
  const bounds = new THREE.Box3(), point = new THREE.Vector3(), matrix = new THREE.Matrix4(), instance = new THREE.Matrix4();
  root.updateMatrixWorld(true);
  root.traverse((part) => {
    // Open-ended primitives must remain visible from their interior as well.
    if(part.isMesh && (part.geometry.parameters?.openEnded || part.geometry.type==='LatheGeometry')){
      for(const material of Array.isArray(part.material)?part.material:[part.material])material.side=THREE.DoubleSide;
    }
    const positions = part.isMesh && part.geometry.attributes.position;
    if (!positions) return;
    const measure = (transform) => {
      for (let i = 0; i < positions.count; i++) bounds.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(transform));
    };
    if (part.isInstancedMesh) {
      for (let i = 0; i < part.count; i++) {
        part.getMatrixAt(i, instance);
        measure(matrix.multiplyMatrices(part.matrixWorld, instance));
      }
    } else measure(part.matrixWorld);
  });
  if (!bounds.isEmpty()) {
    const center = bounds.getCenter(new THREE.Vector3()), offset = [-center.x, -bounds.min.y, -center.z];
    for (const child of root.children) {
      child.position.x += offset[0];
      child.position.y += offset[1];
      child.position.z += offset[2];
    }
    root.userData.recipeOriginOffset = offset;
  }
  return root;
}
export default function generateAsset(THREE, options = {}) {
  return groundOrigin(THREE, relayCrown(THREE, options));
}
