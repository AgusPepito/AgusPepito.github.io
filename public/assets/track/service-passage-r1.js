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

// public/assets/track/service-passage-r1.js
var PASSAGE_JAMB_WIDTH = 4.5;
function generate(THREE, { opening = 10, clearance = 3.5 } = {}) {
  const root = new THREE.Group();
  root.name = "p3-service-passage-r1";
  const half = opening / 2, jamb = PASSAGE_JAMB_WIDTH;
  const grain = surfaceMaps(THREE), mats = {
    graphite: new THREE.MeshStandardMaterial({ color: 4870229, roughness: 0.45, metalness: 0.72, ...grain, normalScale: new THREE.Vector2(0.32, 0.32) }),
    ivory: new THREE.MeshStandardMaterial({ color: 13289399, roughness: 0.53, metalness: 0.28, ...grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    dark: new THREE.MeshStandardMaterial({ color: 1054750, roughness: 0.82 }),
    steel: new THREE.MeshStandardMaterial({ color: 7899020, roughness: 0.38, metalness: 0.76 }),
    brass: new THREE.MeshStandardMaterial({ color: 11307858, roughness: 0.49, metalness: 0.68 }),
    light: new THREE.MeshStandardMaterial({ color: 16774622, emissive: 16773842, emissiveIntensity: 2.2, toneMapped: false })
  };
  for (const [key, m] of Object.entries(mats)) {
    m.name = "passage-p3-r1-" + key;
    if (["graphite", "ivory", "steel"].includes(key)) m.userData.slabFinish = true;
  }
  function mesh(name, g, key, x = 0, y = 0, z = 0, rigid = false) {
    const m = new THREE.Mesh(g, mats[key]);
    m.name = name;
    m.position.set(x, y, z);
    m.userData.wallRigid = rigid;
    root.add(m);
    return m;
  }
  function box(name, x, y, z, w, h, d, key) {
    return mesh(name, y - h / 2 <= 1e-4 ? openBottomBox(THREE, w, h, d) : new THREE.BoxGeometry(w, h, d), key, x, y, z);
  }
  function plate(name, x, y, z, w, h, key, holes = []) {
    const b = 0.09, s = new THREE.Shape();
    s.moveTo(-w / 2 + b, -h / 2);
    s.lineTo(w / 2 - b, -h / 2);
    s.lineTo(w / 2, -h / 2 + b);
    s.lineTo(w / 2, h / 2 - b);
    s.lineTo(w / 2 - b, h / 2);
    s.lineTo(-w / 2 + b, h / 2);
    s.lineTo(-w / 2, h / 2 - b);
    s.lineTo(-w / 2, -h / 2 + b);
    s.closePath();
    for (const [hx, hy, hw, hh] of holes) {
      const p = new THREE.Path();
      p.moveTo(hx - hw / 2, hy - hh / 2);
      p.lineTo(hx - hw / 2, hy + hh / 2);
      p.lineTo(hx + hw / 2, hy + hh / 2);
      p.lineTo(hx + hw / 2, hy - hh / 2);
      p.closePath();
      s.holes.push(p);
    }
    return mesh(name, omitFaces(THREE, new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1, steps: 1 }), 2, -1), key, x, y, z - 0.115);
  }
  function bolt(x, y, z) {
    const m = mesh("gantry-captive-fastener", new THREE.CylinderGeometry(0.05, 0.05, 0.04, 6), "steel", x, y, z, true);
    m.rotation.x = Math.PI / 2;
  }
  function verticalPipe(x, low, high, z) {
    mesh("protected-jamb-conduit", new THREE.CylinderGeometry(0.13, 0.13, high - low, 10), "steel", x, (low + high) / 2, z);
    for (const y of [low + 0.22, high - 0.22]) mesh("jamb-conduit-coupling", new THREE.CylinderGeometry(0.2, 0.2, 0.24, 10), "brass", x, y, z, true);
    for (const y of [low + 0.42, high - 0.42]) mesh("coupling-seal-ring", new THREE.CylinderGeometry(0.17, 0.17, 0.055, 8), "dark", x, y, z, true);
  }
  for (const side of [-1, 1]) {
    const center = side * (half + jamb / 2), inner = side * (half + 0.53), outer = side * (half + jamb - 0.53), service = side * (half + 2.3);
    box("opaque-jamb-core", center, 3.5, -3.25, jamb, 7, 3.5, "dark");
    box("jamb-ground-plinth", center, 0.25, -2.5, jamb, 0.5, 5, "graphite");
    for (const x of [inner, outer]) {
      box("upright-recessed-backing", x, 3.5, -1.16, 0.98, 6.96, 0.48, "dark");
      plate("lower-ivory-jamb-armor", x, 1.7, -0.66, 0.9, 2.8, "ivory", [[0, -0.4, 0.28, 0.66]]);
      box("lower-jamb-vent-floor", x, 1.3, -0.84, 0.34, 0.76, 0.04, "dark");
      for (let n = 0; n < 6; n++) box("jamb-pocket-louver", x, 1.02 + n * 0.1, -0.755, 0.22, 0.04, 0.055, "steel");
      plate("upper-ivory-jamb-armor", x, 4.68, -0.66, 0.9, 2.9, "ivory", [[0, 0.8, 0.25, 0.57]]);
      box("upper-jamb-id-pocket", x, 5.48, -0.84, 0.31, 0.67, 0.04, "dark");
      box("upper-jamb-brass-id", x, 5.48, -0.77, 0.11, 0.32, 0.055, "brass");
      for (const y of [0.44, 2.86, 3.36, 6.15]) for (const dx of [-0.31, 0.31]) bolt(x + dx, y, -0.625);
      plate("ivory-crown-connector", x, 6.58, -0.69, 0.94, 0.76, "ivory");
    }
    const lx = side * (half + 0.52);
    plate("inner-jamb-optical-bezel", lx, 2.33, -0.47, 0.55, 1.14, "steel", [[0, 0, 0.25, 0.81]]);
    box("inner-jamb-optical-floor", lx, 2.33, -0.64, 0.31, 0.88, 0.03, "dark");
    for (let i = 0; i < 4; i++) box("segmented-jamb-receiving-light", lx, 2.02 + i * 0.205, -0.555, 0.19, 0.16, 0.035, "light");
    box("service-cassette-dark-floor", service, 3.8, -1.45, 2.1, 5.7, 0.12, "dark");
    for (const dx of [-0.62, 0.62]) verticalPipe(service + dx, 2.7, 5.91, -1.1);
    for (const y of [3.2, 5.43]) box("jamb-pipe-retaining-crossbar", service, y, -0.875, 1.88, 0.14, 0.14, "ivory");
    plate("jamb-service-cabinet", service, 1.67, -0.81, 1.91, 1.86, "graphite");
    for (const dx of [-0.69, 0.69]) for (const y of [0.98, 2.33]) bolt(service + dx, y, -0.775);
    plate("cabinet-service-door", service + 0.17, 1.65, -0.63, 1.1, 1.27, "graphite");
    box("cabinet-recessed-latch", service + 0.45, 1.65, -0.59, 0.13, 0.31, 0.06, "steel");
    for (const y of [1.23, 2.06]) box("cabinet-exposed-hinge", service - 0.47, y, -0.56, 0.13, 0.16, 0.12, "brass");
    plate("upper-cooling-cassette", service, 6.45, -0.89, 2.02, 0.76, "graphite", [[0, 0, 1.56, 0.38]]);
    for (let i = 0; i < 4; i++) box("upper-cooling-fin", service, 6.3 + i * 0.1, -1.005, 1.45, 0.04, 0.08, "steel");
  }
  box("lintel-load-bearing-core", 0, (clearance + 0.26 + 7) / 2, -3.2, opening, 7 - clearance - 0.26, 3.6, "dark");
  box("front-lintel-sill", 0, clearance + 0.13, -0.63, opening, 0.26, 0.38, "ivory");
  box("rear-lintel-sill", 0, clearance + 0.13, -4.78, opening, 0.26, 0.44, "steel");
  box("underside-optical-recess", 0, clearance + 0.24, -2.66, opening, 0.07, 3.78, "dark");
  const segments = Math.max(3, Math.round(opening / 0.9));
  for (let i = 0; i < segments; i++) {
    const x = -half + (i + 0.5) * opening / segments;
    box("underside-segmented-receiving-cover", x, clearance + 0.1, -0.99, opening / segments - 0.1, 0.06, 0.32, "light");
  }
  plate("lintel-ivory-lower-trim", 0, clearance + 0.48, -0.83, opening + 0.1, 0.42, "ivory");
  const count = Math.max(2, Math.round(opening / 2.5)), cell = opening / count;
  for (let i = 0; i < count; i++) {
    const x = -half + (i + 0.5) * cell;
    plate("lintel-beveled-graphite-fascia", x, 4.92, -1.03, cell - 0.07, 1.36, "graphite");
    for (const dx of [-cell / 2 + 0.17, cell / 2 - 0.17]) for (const y of [4.43, 5.41]) bolt(x + dx, y, -0.995);
    box("upper-truss-gallery-floor", x, 6.25, -1.35, cell - 0.04, 0.95, 0.12, "dark");
    for (const y of [5.78, 6.75]) box("gallery-horizontal-rail", x, y, -0.97, cell - 0.04, 0.13, 0.18, "steel");
    if (i === Math.floor(count / 2)) {
      for (let j = 0; j < 6; j++) box("lintel-cooling-gallery-fin", x, 5.96 + j * 0.12, -1.1, cell - 0.24, 0.052, 0.18, "steel");
    } else {
      for (const sign of [-1, 1]) {
        const a = new THREE.Vector3(x + sign * (cell / 2 - 0.14), 5.87, -1.1), b = new THREE.Vector3(x, 6.66, -1.1), delta = b.clone().sub(a);
        const brace = mesh("recessed-lintel-diagonal-brace", new THREE.BoxGeometry(0.13, delta.length(), 0.15), "steel");
        brace.position.copy(a).add(b).multiplyScalar(0.5);
        brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      }
    }
    box("ivory-upper-lintel-cap", x, 6.9, -1.32, cell - 0.07, 0.2, 0.72, "ivory");
  }
  root.userData = { opening, clearance, width: opening + 2 * jamb, height: 7, depth: 5, revision: "12-passage-r1" };
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
