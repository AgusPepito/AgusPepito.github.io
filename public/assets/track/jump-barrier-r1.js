// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/geometry-cleanup.js
function omitFaces(THREE, geometry, axis, sign) {
  const normal = geometry.attributes.normal;
  if (!normal) return geometry;
  const index = geometry.index, count = index?.count ?? normal.count;
  const ids = [], remap = new Int32Array(normal.count).fill(-1), vertices = [];
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.array[i] : i;
    const b = index ? index.array[i + 1] : i + 1;
    const c = index ? index.array[i + 2] : i + 2;
    if ([a, b, c].every((v) => normal.array[v * 3 + axis] * sign > 0.9999)) continue;
    for (const v of [a, b, c]) {
      if (remap[v] < 0) {
        remap[v] = vertices.length;
        vertices.push(v);
      }
      ids.push(remap[v]);
    }
  }
  if (ids.length === count) return geometry;
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const values = new attr.array.constructor(vertices.length * attr.itemSize);
    vertices.forEach((v, i) => {
      for (let c = 0; c < attr.itemSize; c++) values[i * attr.itemSize + c] = attr.array[v * attr.itemSize + c];
    });
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attr.itemSize, attr.normalized));
  }
  geometry.setIndex(index ? ids : null);
  geometry.clearGroups();
  geometry.boundingBox = geometry.boundingSphere = null;
  return geometry;
}
var openBottomBox = (THREE, w, h, d, ws = 1, hs = 1, ds = 1) => omitFaces(THREE, new THREE.BoxGeometry(w, h, d, ws, hs, ds), 1, -1);

// public/assets/track/slab-surface-r1.js
function surfaceMaps() {
  return { userData: { recipeSurface: true } };
}

// public/assets/track/obstacle-lights-r1.js
function obstacleLightKit(THREE, kind) {
  const sign = recipeEffectMaterial(THREE, { color: 15398383, transparent: true, depthWrite: false });
  sign.name = `action-${kind}-sign`;
  sign.userData.obstacleLight = { kind, role: "sign" };
  const rail = recipeEffectMaterial(THREE, { color: new THREE.Color(15398383).multiplyScalar(1.7) });
  rail.name = `action-${kind}-rail`;
  rail.userData.obstacleLight = { kind, role: "rail" };
  const danger = recipeEffectMaterial(THREE, { color: new THREE.Color(16726054).multiplyScalar(2.8) });
  danger.name = "action-obstruction-red";
  const housing = new THREE.MeshStandardMaterial({ color: 1121059, metalness: 0.45, roughness: 0.55 });
  housing.name = "action-sign-housing";
  function box(root, name, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }
  function panel(root, x, y, z, w, h) {
    box(root, `${kind}-action-sign-cassette`, x, y, z - 0.07, w + 0.16, h + 0.16, 0.12, housing);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, Math.max(1, Math.ceil(w / 0.3)), 1), sign);
    mesh.name = `${kind}-illuminated-action-chevrons`;
    mesh.position.set(x, y, z);
    root.add(mesh);
  }
  function jump(root, height) {
    panel(root, 0, height / 2, -0.065, 1.55, Math.min(1.64, height - 0.55));
    box(root, "jump-clearance-light-rail", 0, height - 0.1, -0.08, 4.28, 0.115, 0.08, rail);
    for (const side of [-1, 1]) box(root, "jump-obstruction-foot-light", side * 1.92, 0.23, -0.065, 0.18, 0.28, 0.06, danger);
  }
  function wallEdges(root, width, height = 7) {
    const inset = Math.min(0.15, width * 0.1), arm = Math.min(1.3, width * 0.3);
    for (const side of [-1, 1]) for (const top of [false, true]) {
      const y = top ? height - 0.22 : 0.3, z = top ? -1.045 : -0.045;
      box(root, "wall-red-corner-horizontal", side * (width / 2 - inset - arm / 2), y, z, arm, 0.15, 0.05, danger);
      box(root, "wall-red-corner-upright", side * (width / 2 - inset), top ? height - 0.67 : 0.75, z, 0.15, 1.04, 0.05, danger);
    }
  }
  return { jump, panel, wallEdges };
}
function recipeEffectMaterial(THREE, parameters) {
  const { vertexColors = false, ...settings } = parameters;
  const material = new THREE.MeshStandardMaterial({ ...settings, vertexColors: false });
  material.userData.recipeEffect = { unlit: true, vertexColors };
  return material;
}

// public/assets/track/jump-barrier-r1.js
function builder(THREE, prefix) {
  const root = new THREE.Group(), grain = surfaceMaps(THREE), mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13552056, metalness: 0.3, roughness: 0.5, ...grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    graphite: new THREE.MeshStandardMaterial({ color: 4542036, metalness: 0.72, roughness: 0.43, ...grain, normalScale: new THREE.Vector2(0.28, 0.28) }),
    dark: new THREE.MeshStandardMaterial({ color: 1054750, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 8096915, metalness: 0.8, roughness: 0.34 }),
    brass: new THREE.MeshStandardMaterial({ color: 11110996, metalness: 0.7, roughness: 0.46 }),
    light: new THREE.MeshStandardMaterial({ color: 16774107, emissive: 16774107, emissiveIntensity: 2, toneMapped: false })
  };
  for (const [key, m] of Object.entries(mats)) {
    m.name = prefix + "-" + key;
    if (["ivory", "graphite", "steel", "brass"].includes(key)) m.userData.slabFinish = true;
  }
  function mesh(name, g, key, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, mats[key]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  function box(name, x, y, z, w, h, d, key) {
    return mesh(name, y - h / 2 <= 1e-4 ? openBottomBox(THREE, w, h, d) : new THREE.BoxGeometry(w, h, d), key, x, y, z);
  }
  function plateGeometry(w, h, holes = []) {
    const b = Math.min(0.09, w / 8, h / 8), s = new THREE.Shape();
    s.moveTo(-w / 2 + b, -h / 2);
    s.lineTo(w / 2 - b, -h / 2);
    s.lineTo(w / 2, -h / 2 + b);
    s.lineTo(w / 2, h / 2 - b);
    s.lineTo(w / 2 - b, h / 2);
    s.lineTo(-w / 2 + b, h / 2);
    s.lineTo(-w / 2, h / 2 - b);
    s.lineTo(-w / 2, -h / 2 + b);
    s.closePath();
    for (const [x, y, rw, rh] of holes) {
      const p = new THREE.Path();
      p.moveTo(x - rw / 2, y - rh / 2);
      p.lineTo(x - rw / 2, y + rh / 2);
      p.lineTo(x + rw / 2, y + rh / 2);
      p.lineTo(x + rw / 2, y - rh / 2);
      p.closePath();
      s.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 1, steps: 1 });
    omitFaces(THREE, g, 2, -1);
    g.translate(0, 0, -0.108);
    return g;
  }
  const plate = (name, x, y, z, w, h, key, holes = []) => mesh(name, plateGeometry(w, h, holes), key, x, y, z);
  function topPlate(name, x, y, z, w, d, key, holes = []) {
    const g = plateGeometry(w, d, holes);
    g.rotateX(-Math.PI / 2);
    return mesh(name, g, key, x, y, z);
  }
  function bolt(x, y, z) {
    const m = mesh("washer-mounted-fastener", new THREE.CylinderGeometry(0.052, 0.052, 0.04, 6), "steel", x, y, z);
    m.rotation.x = Math.PI / 2;
    box("fastener-drive-slot", x, y, z + 0.021, 0.038, 9e-3, 3e-3, "dark");
  }
  function pipe(x, low, high, z) {
    mesh("protected-cooling-conduit", new THREE.CylinderGeometry(0.105, 0.105, high - low, 8), "steel", x, (low + high) / 2, z);
    for (const y of [low + 0.15, high - 0.15]) {
      mesh("conduit-coupling", new THREE.CylinderGeometry(0.15, 0.15, 0.18, 8), "brass", x, y, z);
      for (const dy of [-0.12, 0.12]) mesh("conduit-seal", new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8), "dark", x, y + dy, z);
    }
  }
  function chevron(x, y, z) {
    for (const side of [-1, 1]) {
      const m = box("inset-white-jump-chevron", x + side * 0.13, y, z, 0.075, 0.38, 0.04, "light");
      m.rotation.z = side * Math.PI / 4;
    }
  }
  return { root, mesh, box, plate, topPlate, bolt, pipe, chevron, plateGeometry };
}
function generate(THREE, { width = 18, height = 2.4, startCap = true, endCap = true, firstModuleOnly = false } = {}) {
  const b = builder(THREE, "j3-louver-r1"), { root, box, plate, topPlate, bolt, pipe } = b;
  const signals = obstacleLightKit(THREE, "jump");
  root.name = "j3-repeatable-louver-barrier";
  const count = Math.max(1, Math.round(width / 4.5)), pitch = width / count;
  for (let i = 0; i < (firstModuleOnly ? 1 : count); i++) {
    const first = root.children.length;
    box("opaque-louver-bank-core", 0, (height - 0.55) / 2, -2.925, 4.14, height - 0.55, 3.45, "dark");
    box("continuous-ground-plinth", 0, 0.12, -2.5, 4.5, 0.24, 5, "graphite");
    box("front-recess-backing", 0, height / 2, -1.3, 4.3, height - 0.36, 0.15, "graphite");
    topPlate("ivory-top-service-deck", 0, height - 0.025, -2.5, 4.42, 4.9, "ivory", [[0, 0, 2.54, 2.66]]);
    box("top-cooling-tray-floor", 0, height - 0.48, -2.5, 2.6, 0.1, 2.72, "dark");
    for (let n = 0; n < 9; n++) box("top-cooling-louver", 0, height - 0.22, -3.62 + n * 0.28, 2.34, 0.12, 0.1, "steel");
    for (const x of [-1.78, 1.78]) {
      topPlate("top-access-cover", x, height - 0.01, -2.5, 0.53, 2.9, "graphite");
      for (const z of [-3.6, -1.4]) box("top-cover-captive-latch", x, height - 8e-3, z, 0.23, 0.012, 0.14, "brass");
    }
    plate("ivory-front-louver-frame", 0, height / 2, -0.18, 4.4, height - 0.12, "ivory", [
      [-1.12, 0, 1.43, height - 0.69],
      [1.12, 0, 1.43, height - 0.69],
      [0, 0, 0.52, height - 0.63]
    ]);
    const rows = Math.max(4, Math.floor((height - 0.78) / 0.25)), step = (height - 0.8) / rows;
    for (const side of [-1, 1]) {
      const x = side * 1.12;
      for (let n = 0; n < rows; n++) {
        const y = 0.44 + (n + 0.5) * step;
        const fin = box("angled-deep-front-louver", x, y, -0.53, 1.34, 0.085, 0.53, "graphite");
        fin.rotation.x = -0.24;
        box("louver-machined-leading-edge", x, y + 0.045, -0.29, 1.27, 0.025, 0.035, "steel");
      }
      pipe(side * 0.48, 0.43, height - 0.43, -0.69);
      for (const y of [0.24, height - 0.24]) for (const dx of [-0.65, 0.65]) bolt(x + dx, y, -0.15);
    }
    plate("jump-light-service-cassette", 0, height / 2, -0.29, 0.43, height - 0.76, "graphite");
    signals.jump(root, height);
    for (const y of [0.33, height - 0.33]) plate("cassette-lock-tab", 0, y, -0.14, 0.3, 0.15, "brass");
    const rear = plate("rear-service-panel", 0, height / 2, -4.95, 4.32, height - 0.23, "graphite", [[0, 0, 2.7, 0.4]]);
    rear.rotation.y = Math.PI;
    for (let n = 0; n < 4; n++) box("rear-vent-fin", 0, height / 2 - 0.13 + n * 0.087, -4.84, 2.58, 0.035, 0.06, "steel");
    const scale = pitch / 4.5, cx = -width / 2 + (i + 0.5) * pitch;
    for (const m of root.children.slice(first)) {
      m.position.x = cx + m.position.x * scale;
      m.scale.x *= scale;
    }
  }
  for (const [side, enabled] of [[-1, startCap], [1, endCap]]) if (enabled) {
    const cap = b.mesh("armored-exposed-end-cap", b.plateGeometry(4.7, height - 0.12, [[0, 0, 2.68, height - 0.75]]), "ivory", side * (width / 2 - 0.028), height / 2, -2.5);
    cap.rotation.y = side * Math.PI / 2;
    box("end-cap-recessed-service-cover", side * (width / 2 - 0.19), height / 2, -2.5, 0.1, height - 0.68, 2.76, "graphite");
    for (const z of [-3.5, -1.5]) box("end-cap-lock-housing", side * (width / 2 - 0.1), height / 2, z, 0.07, 0.28, 0.24, "brass");
    for (let n = 0; n < 5; n++) box("end-cap-cooling-slot", side * (width / 2 - 0.125), height / 2 - 0.36 + n * 0.18, -2.5, 0.06, 0.045, 1.35, "dark");
  }
  root.userData = { width, height, depth: 5, startCap, endCap };
  return root;
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
  return groundOrigin(THREE, generate(THREE, options));
}
