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

// public/assets/track/buttressed-wall-r1.js
function generate(THREE, { width = 18, startCap = true, endCap = true, signals = true } = {}) {
  const root = new THREE.Group();
  root.name = "w4-buttressed-wall-r2";
  const lights = signals ? obstacleLightKit(THREE, "wall") : null;
  const grain = surfaceMaps(THREE);
  const mats = {
    graphite: new THREE.MeshStandardMaterial({ color: 4870229, roughness: 0.45, metalness: 0.72, ...grain, normalScale: new THREE.Vector2(0.32, 0.32) }),
    ivory: new THREE.MeshStandardMaterial({ color: 13289399, roughness: 0.53, metalness: 0.28, ...grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    replacement: new THREE.MeshStandardMaterial({ color: 14341571, roughness: 0.59, metalness: 0.22, ...grain, normalScale: new THREE.Vector2(0.1, 0.1) }),
    dark: new THREE.MeshStandardMaterial({ color: 1054750, roughness: 0.82 }),
    steel: new THREE.MeshStandardMaterial({ color: 7899020, roughness: 0.38, metalness: 0.76 }),
    brass: new THREE.MeshStandardMaterial({ color: 11307858, roughness: 0.49, metalness: 0.68 }),
    light: new THREE.MeshStandardMaterial({ color: 16774622, emissive: 16773842, emissiveIntensity: 2.2, roughness: 0.3, toneMapped: false })
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = "wall-w4-r2-" + key;
    if (["steel", "graphite", "ivory", "replacement"].includes(key)) mat.userData.slabFinish = true;
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
  function outline(w, h, b = 0.1) {
    b = Math.min(b, w * 0.15, h * 0.15);
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + b, -h / 2);
    s.lineTo(w / 2 - b, -h / 2);
    s.lineTo(w / 2, -h / 2 + b);
    s.lineTo(w / 2, h / 2 - b);
    s.lineTo(w / 2 - b, h / 2);
    s.lineTo(-w / 2 + b, h / 2);
    s.lineTo(-w / 2, h / 2 - b);
    s.lineTo(-w / 2, -h / 2 + b);
    s.closePath();
    return s;
  }
  function aperture(s, x, y, w, h) {
    const p = new THREE.Path();
    p.moveTo(x - w / 2, y - h / 2);
    p.lineTo(x - w / 2, y + h / 2);
    p.lineTo(x + w / 2, y + h / 2);
    p.lineTo(x + w / 2, y - h / 2);
    p.closePath();
    s.holes.push(p);
  }
  const depth = 0.09, bevel = 0.025;
  function plate(name, x, y, z, w, h, key, holes = [], profile2 = null) {
    const shape = outline(w - 0.05, h - 0.05);
    for (const hole of holes) aperture(shape, ...hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 1, bevelSize: bevel, bevelThickness: bevel, steps: 1 });
    omitFaces(THREE, g, 2, -1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i) + x, py = p.getY(i) + y, pz = p.getZ(i) - depth - bevel + (profile2 ? profile2(py) : z);
      p.setXYZ(i, px, py, pz);
    }
    g.computeVertexNormals();
    return mesh(name, g, key);
  }
  function bolt(x, y, z) {
    const m = mesh("captive-fastener-and-washer", new THREE.CylinderGeometry(0.043, 0.043, 0.035, 6), "steel", x, y, z, true);
    m.rotation.x = Math.PI / 2;
    const washer = mesh("fastener-seating-washer", new THREE.TorusGeometry(0.052, 0.013, 4, 10), "dark", x, y, z - 0.013, true);
    return washer;
  }
  function quad(name, points, key) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    return mesh(name, g, key);
  }
  const profilePoints = [[0, -0.075], [0.95, -0.14], [2.15, -0.72], [6.1, -1.1]];
  function profile(y) {
    for (let i = 1; i < profilePoints.length; i++) {
      const [a, za] = profilePoints[i - 1], [b, zb] = profilePoints[i];
      if (y <= b) return za + (zb - za) * (y - a) / (b - a);
    }
    return -1.1;
  }
  function profilePatch(name, x, w, y0, y1, inset, key) {
    return quad(name, [[x - w / 2, y0, profile(y0) + inset], [x + w / 2, y0, profile(y0) + inset], [x + w / 2, y1, profile(y1) + inset], [x - w / 2, y1, profile(y1) + inset]], key);
  }
  const bays = Math.max(1, Math.round(width / 4.5)), cell = width / bays, ribWidth = 1.16;
  box("inset-opaque-wall-core", 0, 3.22, -3.05, width - 0.26, 5.76, 2.8, "dark");
  box("recessed-continuous-plinth", 0, 0.22, -2.67, width - 0.26, 0.44, 4.56, "graphite");
  box("rear-structural-skin", 0, 3.5, -4.86, width - 0.26, 7, 0.08, "dark");
  for (let i = 0; i < bays; i++) {
    const left = -width / 2 + i * cell, ribX = left + ribWidth / 2;
    const right = left + cell - (endCap && i === bays - 1 ? ribWidth : 0);
    const a = left + ribWidth + 0.055, b = right - 0.055, pw = b - a, x = (a + b) / 2;
    if (lights && pw > 0.7) lights.panel(root, x, 3.55, -1.15, Math.min(2.05, pw - 0.16), 2.45);
    plate("beveled-recessed-wall-armor", x, 3.45, -1.47, pw, 5.15, "graphite", [[0, 1.55, pw * 0.72, 0.7]]);
    box("cooling-well-back", x, 5, -1.64, pw * 0.75, 0.77, 0.035, "dark");
    for (let j = 0; j < 5; j++) {
      const louver = box("inset-angled-cooling-louver", x, 4.73 + j * 0.135, -1.565, pw * 0.66, 0.045, 0.12, "steel");
      louver.rotation.x = -0.25;
    }
    plate("lower-beveled-service-door", x + (i % 2 ? -0.18 : 0.18), 1.43, -1.3, pw * 0.72, 0.97, "graphite");
    for (const dx of [-pw * 0.28, pw * 0.28]) for (const y of [1.08, 1.77]) bolt(x + dx, y, -1.27);
    for (const dx of [-pw / 2 + 0.11, pw / 2 - 0.11]) for (const y of [1.04, 3.4, 5.78]) bolt(x + dx, y, -1.44);
    const hx = x + (i % 2 ? -1 : 1) * pw * 0.28;
    plate("offset-tall-access-hatch", hx, 2.68, -1.32, pw * 0.25, 0.93, "graphite");
    box("hatch-lock-recess", hx, 2.58, -1.294, 0.16, 0.28, 0.025, "dark");
    box("hatch-lock-metal-lever", hx, 2.58, -1.265, 0.065, 0.17, 0.045, "steel");
    for (const y of [2.4, 2.94]) box("hatch-side-hinge", hx - pw * 0.14, y, -1.27, 0.08, 0.15, 0.08, "steel");
    plate("bay-foot-service-cassette", x, 0.62, -0.94, pw, 0.47, "graphite");
    box("foot-cassette-grille-bed", x, 0.62, -0.915, pw * 0.52, 0.27, 0.025, "dark");
    for (let j = 0; j < 7; j++) box("foot-cassette-grille-bar", x - pw * 0.23 + j * pw * 0.46 / 6, 0.62, -0.882, 0.045, 0.22, 0.045, "steel");
    const crownCenter = left + cell / 2;
    box("crown-front-structural-rail", crownCenter, 6.58, -1.75, cell - 0.06, 0.84, 0.64, "dark");
    plate("crown-beveled-metal-fascia", x, 6.58, -1.265, pw, 0.72, "graphite");
    for (const dx of [-pw / 2 + 0.14, pw / 2 - 0.14]) for (const y of [6.36, 6.8]) bolt(x + dx, y, -1.23);
    plate("crown-service-id-plate", x, 6.57, -1.1, 0.58, 0.27, "steel");
    for (const dx of [-0.15, 0, 0.15]) box("crown-neutral-identification-notch", x + dx, 6.57, -1.079, 0.035, 0.13, 0.03, "dark");
    box("rear-crown-rail", crownCenter, 6.59, -4.22, cell - 0.06, 0.82, 1, "graphite");
    box("crown-pipe-tray-floor", crownCenter, 6.27, -2.92, cell - 0.06, 0.13, 1.85, "dark");
    const pipe = mesh("exposed-crown-feed-pipe", new THREE.CylinderGeometry(0.17, 0.17, cell - 0.065, 10), "steel", crownCenter, 6.68, -2.64);
    pipe.rotation.z = Math.PI / 2;
    for (const dx of [-cell / 2 + 0.29, cell / 2 - 0.29]) {
      const sleeve = mesh("stepped-crown-pipe-coupling", new THREE.CylinderGeometry(0.235, 0.235, 0.28, 10), "brass", crownCenter + dx, 6.68, -2.64, true);
      sleeve.rotation.z = Math.PI / 2;
      for (const da of [-0.17, 0.17]) {
        const ring = mesh("pipe-coupling-retainer", new THREE.CylinderGeometry(0.215, 0.215, 0.055, 8), "dark", crownCenter + dx + da, 6.68, -2.64, true);
        ring.rotation.z = Math.PI / 2;
      }
    }
    buttress(ribX, i);
    box("ivory-pipe-saddle", ribX, 6.67, -2.62, 0.65, 0.6, 0.7, "ivory");
    plate("rear-access-panel", crownCenter, 3.55, 0, cell - 0.3, 4.85, "graphite");
    const rear = root.children[root.children.length - 1];
    rear.geometry.scale(1, 1, -1);
    rear.geometry.translate(0, 0, -5);
    const ri = rear.geometry.index;
    if (ri) for (let j = 0; j < ri.count; j += 3) {
      const t = ri.getX(j + 1);
      ri.setX(j + 1, ri.getX(j + 2));
      ri.setX(j + 2, t);
    }
    else {
      const attrs = Object.values(rear.geometry.attributes);
      for (const attr of attrs) for (let j = 0; j < attr.count; j += 3) for (let c = 0; c < attr.itemSize; c++) {
        const t = attr.array[(j + 1) * attr.itemSize + c];
        attr.array[(j + 1) * attr.itemSize + c] = attr.array[(j + 2) * attr.itemSize + c];
        attr.array[(j + 2) * attr.itemSize + c] = t;
      }
    }
    rear.geometry.computeVertexNormals();
  }
  function buttress(x, index) {
    const shape = new THREE.Shape();
    profilePoints.forEach(([y, z], i) => i ? shape.lineTo(-z + 0.2, y) : shape.moveTo(-z + 0.2, y));
    shape.lineTo(1.64, 6.1);
    shape.lineTo(1.64, 0);
    shape.closePath();
    const rib = mesh("setback-buttress-backing", new THREE.ExtrudeGeometry(shape, { depth: ribWidth, bevelEnabled: false }), "dark", x - ribWidth / 2, 0, 0);
    rib.rotation.y = Math.PI / 2;
    const key = index % 4 === 2 ? "replacement" : "ivory";
    plate("beveled-ivory-toe-armor", x, 0.49, 0, ribWidth - 0.1, 0.8, key, [[0, 0, 0.53, 0.45]], profile);
    profilePatch("toe-recess-floor", x, 0.58, 0.23, 0.75, -0.16, "dark");
    for (let j = 0; j < 4; j++) {
      const y = 0.3 + j * 0.11;
      profilePatch("toe-inset-metal-louver", x, 0.43, y, y + 0.035, -0.09, "steel");
    }
    plate("beveled-ivory-sloped-boot", x, 1.55, 0, ribWidth - 0.1, 1.1, key, [[0, 0, 0.38, 0.66]], profile);
    profilePatch("boot-lock-pocket", x, 0.45, 1.18, 1.92, -0.16, "dark");
    profilePatch("boot-recessed-brass-lock", x, 0.11, 1.31, 1.73, -0.085, "brass");
    plate("lower-long-buttress-armor", x, 3.1, 0, ribWidth - 0.1, 1.74, key, [[0.2, -0.3, 0.22, 0.66]], profile);
    profilePatch("upright-vent-pocket", x + 0.2, 0.28, 2.43, 3.15, -0.16, "dark");
    for (let j = 0; j < 6; j++) {
      const y = 2.51 + j * 0.096;
      profilePatch("upright-pocket-louver", x + 0.2, 0.17, y, y + 0.031, -0.085, "steel");
    }
    plate("upper-long-buttress-armor", x, 5.04, 0, ribWidth - 0.1, 1.98, key, [[-0.22, 0.51, 0.16, 0.48]], profile);
    profilePatch("upper-inset-id-pocket", x - 0.22, 0.22, 5.28, 5.84, -0.16, "dark");
    profilePatch("upper-brass-serial-insert", x - 0.22, 0.075, 5.4, 5.68, -0.09, "brass");
    for (const y of [0.16, 0.84, 1.06, 2.02, 2.34, 3.87, 4.16, 5.94]) for (const dx of [-0.4, 0.4]) bolt(x + dx, y, profile(y) + 0.018);
    for (const y of [2.16, 4.02]) profilePatch("buttress-joint-bridge", x, 0.25, y - 0.032, y + 0.032, -0.04, "steel");
    box("crown-head-setback-core", x, 6.57, -1.75, ribWidth, 0.84, 0.55, "dark");
    plate("beveled-ivory-light-head", x, 6.57, -1.14, ribWidth - 0.08, 0.8, key, [[0, 0, 0.57, 0.48]]);
    box("head-optical-well-floor", x, 6.57, -1.345, 0.64, 0.54, 0.04, "dark");
    for (const dx of [-0.13, 0.13]) {
      box("head-segmented-optical-cover", x + dx, 6.57, -1.235, 0.095, 0.32, 0.035, "light");
      box("head-optical-metal-divider", x + dx + 0.073, 6.57, -1.2, 0.025, 0.37, 0.045, "steel");
    }
    for (const dx of [-0.4, 0.4]) for (const y of [6.32, 6.82]) bolt(x + dx, y, -1.105);
    const tube = mesh("buttress-side-power-conduit", new THREE.CylinderGeometry(0.07, 0.07, 1.5, 8), "steel", x + 0.48, 3.85, -1.26);
    for (const y of [3.18, 4.5]) box("side-conduit-retaining-clip", x + 0.48, y, -1.18, 0.19, 0.12, 0.12, "brass");
  }
  if (endCap) buttress(width / 2 - ribWidth / 2, bays);
  for (const side of [-1, 1]) if (side < 0 ? startCap : endCap) {
    box("sealed-terminal-cheek", side * (width / 2 - 0.1), 3.5, -3.33, 0.12, 7, 3.34, "graphite");
    for (const z of [-1.9, -4.67]) box("terminal-inset-ivory-binding", side * (width / 2 - 0.025), 3.5, z, 0.05, 6.65, 0.19, "ivory");
    box("terminal-service-panel", side * (width / 2 - 0.018), 3.42, -3.27, 0.035, 4.8, 2.05, "steel");
    for (const y of [1.16, 5.67]) box("terminal-panel-lock-rail", side * (width / 2 - 8e-3), y, -3.27, 0.016, 0.12, 1.8, "brass");
  }
  lights?.wallEdges(root, width);
  root.userData = { width, height: 7, depth: 5, bays, startCap, endCap, revision: "12-wall-r2", armorBackingRecess: 0.2 };
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
