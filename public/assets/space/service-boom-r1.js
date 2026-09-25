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
function serviceBoom(THREE) {
  const k = kit(THREE, "service-boom-s3-study-r1");
  k.cylinder("mast-foot", 6.5, 4.5, 7, "frame", 0, 3.5, 0, 12);
  k.cylinder("mast-dark-spine", 4.6, 5, 31, "recess", 0, 22, 0, 12);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    k.cylinder("mast-steel-rail", 0.65, 0.65, 29, "steel", Math.sin(a) * 5.1, 22, Math.cos(a) * 5.1, 8);
    const node = new THREE.Group();
    node.position.set(Math.sin(a) * 5.7, 20, Math.cos(a) * 5.7);
    node.rotation.y = a;
    k.root.add(node);
    k.box("mast-armored-face", 4, 17, 1.1, "armor", 0, 0, 0, node);
    k.box("mast-light-slot", 1.3, 12, 0.55, "recess", 0, 0, 0.75, node);
    k.box("mast-cyan-dash", 0.65, 10.5, 0.35, "cyan", 0, 0, 1.15, node);
    for (const y of [-6.8, 6.8]) {
      k.box("mast-face-seam", 3.5, 0.23, 0.2, "recess", 0, y, 0.7, node);
      for (const x of [-1.4, 1.4]) k.box("mast-face-catch", 0.55, 0.65, 0.4, "steel", x, y, 1, node);
    }
  }
  for (const y of [7, 33]) {
    k.cylinder("mast-bearing", 7.2, 7.2, 2.6, "steel", 0, y, 0, 16);
    k.cylinder("mast-bearing-band", 7.4, 7.4, 1, "coupling", 0, y, 0, 16);
  }
  const first = -10, last = 128, lower = 36, upper = 48;
  for (const z of [-5, 5]) for (const y of [lower, upper])
    k.beam("boom-longitudinal-chord", [first, y, z], [last, y, z], 1.65, 1.65, "frame");
  for (let i = 0; i < 9; i++) {
    const a = first + i * (last - first) / 9, b = first + (i + 1) * (last - first) / 9, mid = (a + b) / 2;
    for (const z of [-5, 5]) {
      k.beam("boom-diagonal-web", [a, i % 2 ? upper : lower, z], [b, i % 2 ? lower : upper, z], 1.1, 1.15, "steel");
      k.beam("boom-vertical-rib", [a, lower, z], [a, upper, z], 1.6, 1.6, "frame");
    }
    k.beam("boom-cross-tie", [a, upper, -5], [a, upper, 5], 1.2, 1.2, "steel");
    k.box("boom-roof-armor", 12.8, 0.95, 12.3, "armor", mid, 49.1, 0);
    if (i % 2 === 1) {
      const roof = new THREE.Group();
      roof.position.set(mid, 49.75, 0);
      roof.rotation.x = -Math.PI / 2;
      k.root.add(roof);
      k.vent("boom-roof-vent", 7.5, 6.6, roof);
      for (const x of [-5.25, 5.25]) {
        k.box("roof-panel-seam", 0.23, 10.6, 0.18, "recess", x, 0, 0, roof);
        for (const y of [-4.6, 4.6]) k.box("roof-lock", 0.8, 0.85, 0.4, "steel", x, y, 0.15, roof);
      }
    }
    for (const z of [-6, 6]) {
      k.box("boom-lower-light-recess", 11, 2.2, 1, "recess", mid, 36, z);
      k.box("boom-cyan-rail", 9.2, 0.85, 0.55, "cyan", mid, 36, z + Math.sign(z) * 0.8);
      for (const offset of [-4.8, 4.8]) k.box("boom-light-end-bezel", 0.45, 1.4, 0.75, "steel", mid + offset, 36, z + Math.sign(z) * 0.65);
      if (i % 2 === 1) for (const y of [37.8, 46.2]) {
        k.box("truss-junction-plate", 3.4, 3.3, 0.75, "frame", a, y, z - 0.4 * Math.sign(z));
        k.box("truss-junction-lock", 0.85, 0.85, 0.45, "steel", a, y, z + 0.15 * Math.sign(z));
      }
    }
    if (i % 3 === 0) {
      for (const z of [-6, 6]) {
        k.box("boom-joint-armor", 5, 15, 1.7, "armor", a, 42, z);
        k.box("boom-joint-dark-inset", 2.5, 7, 0.5, "recess", a, 42, z + Math.sign(z) * 1.1);
        k.box("boom-amber-joint", 2.3, 0.9, 0.4, "amber", a, 46.5, z + Math.sign(z) * 1.25);
        for (const y of [40, 42, 44]) k.box("boom-joint-vent-slat", 1.9, 0.48, 0.35, "steel", a, y, z + Math.sign(z) * 1.45);
        for (const x of [-1.7, 1.7]) k.box("boom-joint-latch", 0.5, 1.4, 0.4, "frame", a + x, 38, z + Math.sign(z) * 1.1);
      }
    }
  }
  for (const z of [-2.1, 2.1]) k.beam("internal-long-service-conduit", [first, 43, z], [last, 43, z], 1.1, 1.1, "steel");
  k.box("mast-crosshead", 17, 15, 14, "frame", 0, 42, 0);
  k.box("crosshead-top-shell", 17.7, 1.2, 14.8, "armor", 0, 50, 0);
  for (const z of [-7.25, 7.25]) {
    const face = new THREE.Group();
    face.position.set(0, 43, z);
    if (z < 0) face.rotation.y = Math.PI;
    k.root.add(face);
    k.vent("crosshead-service-vent", 7.2, 5.8, face);
  }
  for (const x of [first, last]) {
    k.box("boom-terminal-housing", 7, 15.5, 14, "frame", x, 42, 0);
    k.box("boom-terminal-top", 7.8, 1.2, 15, "armor", x, 50.2, 0);
    for (const z of [-7.5, 7.5]) {
      k.box("boom-terminal-plate", 5.7, 11.5, 1.2, "armor", x, 42, z);
      k.box("boom-terminal-vent", 3.8, 7, 0.5, "recess", x, 42, z + Math.sign(z) * 0.9);
      for (const y of [40, 42, 44]) k.box("terminal-louver", 3.2, 0.55, 0.6, "steel", x, y, z + Math.sign(z) * 1.3);
      k.box("boom-terminal-marker", 3.3, 0.8, 0.4, "amber", x, 37.7, z + Math.sign(z) * 1.3);
    }
  }
  return k.finish({ concept: "S3 \u2014 Service boom / no hanging pods", detailIntent: "open cantilever truss, armored roof, cyan rails; clear underside" });
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
  return groundOrigin(THREE, serviceBoom(THREE, options));
}
