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
var COMPACT_JAMB_WIDTH = 2.25;
function compactPassage(THREE, { opening = 10, clearance = 3.5, height = 4.2 } = {}) {
  const { root, box, plate, topPlate, bolt, pipe } = builder(THREE, "p3-compact-r1");
  root.name = "p3-compact-jump-or-opening";
  const half = opening / 2, jamb = COMPACT_JAMB_WIDTH;
  for (const side of [-1, 1]) {
    const x = side * (half + jamb / 2);
    box("compact-jamb-opaque-core", x, (height - 0.17) / 2, -3, jamb, height - 0.17, 4, "dark");
    box("compact-jamb-base", x, 0.15, -2.5, jamb, 0.3, 5, "graphite");
    plate("compact-ivory-jamb-frame", x, height / 2, -0.25, jamb - 0.1, height - 0.14, "ivory", [[0, 0.13, 1.15, height - 1.22]]);
    for (const dx of [-0.29, 0.29]) pipe(x + dx, 0.8, height - 0.55, -0.67);
    plate("compact-bottom-service-door", x, 0.55, -0.17, 1.48, 0.46, "graphite");
    for (const dx of [-0.58, 0.58]) bolt(x + dx, 0.55, -0.14);
    for (const y of [0.4, height - 0.4]) for (const dx of [-0.89, 0.89]) bolt(x + dx, y, -0.22);
    for (const y of [1.1, 1.68, 2.26]) {
      box("compact-jamb-receiving-bezel", x - side * 0.84, y, -0.17, 0.2, 0.47, 0.1, "steel");
      box("compact-jamb-receiving-light", x - side * 0.84, y, -0.108, 0.11, 0.36, 0.025, "light");
    }
    topPlate("compact-jamb-top-cap", x, height - 0.025, -2.5, jamb - 0.1, 4.9, "ivory");
  }
  const lintel = height - clearance;
  box("compact-lintel-opaque-core", 0, clearance + (lintel - 0.14) / 2, -3.1, opening, lintel - 0.14, 3.8, "dark");
  box("compact-lintel-underside", 0, clearance + 0.055, -2.5, opening, 0.11, 5, "steel");
  const count = Math.max(2, Math.round(opening / 2)), pitch = opening / count;
  for (let i = 0; i < count; i++) {
    const x = -half + (i + 0.5) * pitch;
    plate("compact-lintel-ivory-cassette", x, clearance + lintel / 2, -0.2, pitch - 0.055, lintel - 0.09, "ivory", [[0, 0.09, pitch - 0.35, 0.18], [0, -0.16, pitch - 0.35, 0.095]]);
    for (const dy of [0.045, 0.115]) box("compact-lintel-recessed-fin", x, clearance + lintel / 2 + dy, -0.34, pitch - 0.43, 0.022, 0.06, "steel");
    box("compact-lintel-receiving-light", x, clearance + lintel / 2 - 0.16, -0.26, pitch - 0.43, 0.065, 0.03, "light");
    topPlate("compact-lintel-top-armor", x, height - 0.025, -2.5, pitch - 0.045, 4.9, "graphite");
    for (const z of [-3.9, -1.1]) topPlate("compact-lintel-top-service-tab", x, height - 0.012, z, 0.46, 0.32, "brass");
  }
  root.userData = { opening, clearance, height, depth: 5 };
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
  return groundOrigin(THREE, compactPassage(THREE, options));
}
