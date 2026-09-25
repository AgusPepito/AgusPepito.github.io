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
function brokenArc(THREE) {
  const k = kit(THREE, "broken-arc-r2-study-r1");
  const start = THREE.MathUtils.degToRad(45), sweep = THREE.MathUtils.degToRad(280);
  const count = 28, step = sweep / count, cy = 128;
  const position = (r, a, z) => [Math.cos(a) * r, cy + Math.sin(a) * r, z];
  for (let i = 0; i < count; i++) {
    const a = start + i * step, b = a + step, mid = (a + b) / 2;
    for (const z of [-6, 4.7]) for (const r of [108, 124.6])
      k.sector("continuous-ring-chord", r, r + 1.4, a, b, 1.3, "steel", z, cy);
    k.sector("outer-backbone", 121.8, 124.6, a, b, 8.8, "frame", -4.4, cy);
    for (const z of [-5, 5]) {
      k.beam("radial-web", position(109, a, z), position(125, a, z), 1.65, 1.8, "frame");
      k.beam("diagonal-web", position(110, a, z), position(123, b, z), 0.9, 1.05, "steel");
    }
    k.beam("cross-depth-tie", position(110, a, -6), position(110, a, 6), 1.4, 1.4, "steel");
    if (i % 4 !== 2) {
      for (const z of [-7.1, 6.1]) k.sector("segmented-face-armor", 119, 124.2, a + 0.012, b - 0.012, 1, "armor", z, cy);
      k.sector("outer-shell-panel", 125.9, 126.8, a + 0.016, b - 0.016, 7.8, "armor", -3.9, cy);
      if (i % 2 === 0) for (const side of [-1, 1]) {
        const panel = new THREE.Group();
        panel.name = "ring-armor-service-panel";
        panel.position.set(...position(121.5, mid, side * 7.28));
        panel.rotation.z = mid;
        if (side < 0) panel.rotation.y = Math.PI;
        k.root.add(panel);
        k.vent("ring-armor-vent", 3.1, 6.2, panel);
        for (const y of [-7, 7]) {
          k.box("ring-panel-seam", 4.2, 0.28, 0.18, "recess", 0, y, 0, panel);
          k.box("ring-panel-lock", 1.05, 0.8, 0.45, "steel", 0, y + 1.3, 0.18, panel);
        }
      }
    }
    if (i % 2 === 1) {
      for (const r of [117, 119]) {
        k.beam("ring-service-conduit", position(r, a + 0.023, 0), position(r, b - 0.023, 0), 0.65, 0.65, "steel");
        for (const angle of [a + 0.037, b - 0.037])
          k.beam("ring-conduit-clamp", position(r - 0.7, angle, 0), position(r + 0.7, angle, 0), 0.8, 1.25, "coupling");
      }
    }
    if (i % 3 === 0) {
      for (const side of [-1, 1]) {
        const z = side > 0 ? 6.2 : -7.2;
        k.sector("light-recess", 111.2, 117.3, a + 0.033, b - 0.033, 1, "recess", z, cy);
        k.sector("cyan-ring-light", 112.5, 114.2, a + 0.044, b - 0.044, 0.45, "cyan", side > 0 ? 7.25 : -7.7, cy);
        k.sector("light-steel-divider", 115, 115.55, a + 0.044, b - 0.044, 0.4, "steel", side > 0 ? 7.25 : -7.65, cy);
      }
    }
    if (i % 7 === 4) {
      const joint = new THREE.Group();
      joint.position.set(...position(118, mid, 0));
      joint.rotation.z = mid;
      k.root.add(joint);
      k.box("ring-service-housing", 17, 5.5, 16, "frame", 0, 0, 0, joint);
      k.box("service-armor", 13, 4.1, 1, "armor", 0, 0, 8.5, joint);
      k.box("amber-service-marker", 4.4, 0.75, 0.45, "amber", 0, 0, 9.2, joint);
    }
  }
  for (const angle of [start, start + sweep]) {
    const terminal = new THREE.Group();
    terminal.name = "open-arc-terminal";
    terminal.position.set(...position(118, angle, 0));
    terminal.rotation.z = angle;
    k.root.add(terminal);
    k.box("terminal-core", 24, 9, 19, "frame", 0, 0, 0, terminal);
    for (const z of [-10, 10]) {
      k.box("terminal-inset", 19, 6.8, 1.6, "recess", 0, 0, z, terminal);
      for (const x of [-10.6, 10.6]) k.box("terminal-armor-cheek", 2.4, 10.2, 2.4, "armor", x, 0, z, terminal);
      for (const y of [-4.5, 4.5]) k.box("terminal-armor-cap", 19, 1.4, 2, "armor", 0, y, z, terminal);
      for (const x of [-6.3, 6.3]) k.box("terminal-amber-bar", 1.1, 5.2, 0.7, "amber", x, 0, z + Math.sign(z) * 1.2, terminal);
      k.box("terminal-center-grille", 6.5, 5.5, 0.6, "steel", 0, 0, z + Math.sign(z) * 1.05, terminal);
      for (const y of [-1.8, 0, 1.8]) k.box("terminal-grille-slot", 5, 0.65, 0.3, "recess", 0, y, z + Math.sign(z) * 1.45, terminal);
      for (const x of [-10.6, 10.6]) for (const y of [-3.5, 3.5]) {
        k.box("terminal-lock-socket", 1.2, 1.2, 0.35, "recess", x, y, z + Math.sign(z) * 1.3, terminal);
        k.box("terminal-large-fastener", 0.65, 0.65, 0.4, "steel", x, y, z + Math.sign(z) * 1.6, terminal);
      }
    }
    k.box("terminal-back-band", 25.5, 2.4, 20, "coupling", 0, 0, 0, terminal);
  }
  return k.finish({
    concept: "R2 \u2014 Broken arc",
    innerDiameterMeters: 216,
    nominalDiameterMeters: 254,
    apertureCenter: [0, cy, 0],
    openingDegrees: 80,
    detailIntent: "open double rails, modular armor, visible ribs and recessed lights"
  });
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
  return groundOrigin(THREE, brokenArc(THREE, options));
}
