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
var raisedPanelBacks = /* @__PURE__ */ new Set([
  "support-inset-channel",
  "support-bolt-seat",
  "support-service-mark",
  "sloped-ceramic-panel",
  "panel-captive-fastener",
  "panel-lower-service-slot",
  "hatch-inset-door",
  "hatch-handle-pocket",
  "hatch-recess-handle",
  "hatch-hinge",
  "hatch-lock",
  "vent-inset-well",
  "vent-frame-fastener",
  "lower-recess-pocket",
  "lower-service-tab",
  "interface-locking-tab"
]);

// public/assets/track/raised-cover-hatch-r3.js
function generate(THREE) {
  const family = "cover", kind = "hatch";
  const g = new THREE.Group();
  g.name = "raised-" + family + "-" + kind + "-r3";
  const lean = Math.tan(Math.PI / 6), face = (y) => 1.4 - y * lean;
  const palette = {
    armor: [12895156, 0.35, 0.6],
    inset: [2502969, 0.5, 0.65],
    pipe: [6318698, 0.7, 0.42],
    steel: [9147280, 0.65, 0.4],
    dark: [1120800, 0.25, 0.85],
    brass: [10191184, 0.6, 0.5]
  };
  const mats = {};
  for (const [key, [color, metalness, roughness]] of Object.entries(palette)) {
    mats[key] = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats[key].name = "r3-" + key;
  }
  function mesh(name, geometry, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, mats[mat]);
    m.name = name;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  function box(name, x, y, z, w, h, d, mat) {
    const buried = y - h / 2 <= 1e-4 || ["roof-panel", "roof-vent-well", "roof-vent-rib", "roof-fastener"].includes(name);
    return mesh(name, buried ? openBottomBox(THREE, w, h, d) : new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }
  function sloped(name, x, y, w, h, d, mat, offset = 0) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    if (raisedPanelBacks.has(name)) omitFaces(THREE, geometry, 2, -1);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - p.getY(i) * lean);
    geometry.computeVertexNormals();
    return mesh(name, geometry, mat, x, y, face(y) + offset);
  }
  function cheek(x) {
    const shape = new THREE.Shape();
    shape.moveTo(-1.65, 0);
    shape.lineTo(1.4, 0);
    shape.lineTo(face(3.2), 3.2);
    shape.lineTo(-1.65, 3.2);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: false, steps: 1 });
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(0.16, 0, 0);
    mesh("continuous-trapezoid-end-cheek", geometry, "armor", x);
    box("end-inset-plate", x + (x < 0 ? -0.166 : 0.166), 1.35, -0.72, 0.025, 0.95, 0.72, "inset");
    for (const y of [1.03, 1.68]) for (const z of [-0.95, -0.48]) {
      const bolt = mesh("end-plate-bolt", new THREE.CylinderGeometry(0.055, 0.055, 0.045, 6), "steel", x + (x < 0 ? -0.19 : 0.19), y, z);
      bolt.rotation.z = Math.PI / 2;
    }
  }
  cheek(-5.84);
  cheek(5.84);
  box("foot-rail", 0, 0.13, 1.12, 12, 0.26, 0.56, "inset");
  sloped("lower-ivory-lip", 0, 0.3, 11.35, 0.16, 0.24, "armor");
  sloped("upper-ivory-lintel", 0, 3.04, 11.35, 0.25, 0.25, "armor");
  for (const x of [-5.48, 0, 5.48]) {
    sloped("thirty-degree-support", x, 1.65, x === 0 ? 0.36 : 0.5, 2.72, 0.3, "armor");
    sloped("support-inset-channel", x, 1.7, 0.12, 1.6, 0.025, "inset", 0.162);
    for (const y of [0.6, 2.7]) sloped("support-bolt-seat", x, y, 0.18, 0.18, 0.035, "steel", 0.17);
    sloped("support-service-mark", x, 0.87, 0.19, 0.27, 0.025, "brass", 0.18);
  }
  sloped("shallow-cavity-backing", 0, 1.65, 11.25, 2.6, 0.055, "dark", -0.7);
  if (family === "pipe") {
    for (const y of [0.78, 1.59, 2.4]) {
      const z = face(y) - 0.36;
      if (kind === "offset") {
        const path = new THREE.CatmullRomCurve3([-5.475, -3, -1, 1, 3, 5.475].map((x) => new THREE.Vector3(x, y + (Math.abs(x) === 1 ? 0.15 : 0), z - (Math.abs(x) === 1 ? 0.16 : 0))));
        const body = mesh("offset-pipe-dogleg", new THREE.TubeGeometry(path, 24, 0.255, 10, false), "pipe");
        body.material.side = THREE.DoubleSide;
      } else {
        const pipe = mesh("main-pipe-barrel", new THREE.CylinderGeometry(0.255, 0.255, 10.95, 12, 1), "pipe", 0, y, z);
        pipe.rotation.z = Math.PI / 2;
      }
      for (const x of kind === "coupling" ? [-4.7, -2.65, 2.65, 4.7] : [-4.7, 4.7]) {
        const sleeve = mesh("wide-coupling-sleeve", new THREE.CylinderGeometry(0.305, 0.305, 0.55, 12), "inset", x, y, z);
        sleeve.rotation.z = Math.PI / 2;
        for (const offset of [-0.27, 0.27]) {
          const ring = mesh("coupling-retaining-band", new THREE.CylinderGeometry(0.325, 0.325, 0.085, 12), "steel", x + offset, y, z);
          ring.rotation.z = Math.PI / 2;
        }
        for (const a of [-0.9, 0, 0.9]) {
          const head = mesh("coupling-front-fastener", new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6), "brass", x, y + Math.sin(a) * 0.32, z + Math.cos(a) * 0.32);
          head.rotation.x = Math.PI / 2 - a;
        }
      }
      for (const x of [-1, 1]) {
        const cuff = mesh("central-seal-ring", new THREE.CylinderGeometry(0.29, 0.29, 0.12, 10), "brass", x, y, z);
        cuff.rotation.z = Math.PI / 2;
      }
      box("pipe-saddle", 0, y, z - 0.22, 0.45, 0.58, 0.5, "inset");
      if (kind === "valve" || kind === "coupling") {
        box("valve-access-block", 1.62, y, z + 0.12, 0.48, 0.43, 0.42, "inset");
        box("valve-front-handle", 1.62, y, z + 0.37, 0.56, 0.105, 0.12, "brass");
      }
    }
  }
  if (family === "grille") {
    for (const center of [-2.73, 2.73]) {
      for (const x of [center - 2.42, center + 2.42]) sloped("grille-cartridge-side", x, 1.63, 0.14, 2.45, 0.14, "steel", -0.1);
      for (const y of [0.44, 2.82]) sloped("grille-cartridge-rail", center, y, 4.95, 0.15, 0.15, "steel", -0.1);
      for (let x = center - 2.18; x < center + 2.3; x += 0.39) sloped("grille-vertical-web", x, 1.62, 0.065, 2.27, 0.085, "pipe", -0.13);
      for (let y = 0.6; y < 2.75; y += kind === "louver" ? 0.28 : 0.38) {
        sloped(kind === "louver" ? "deep-louver-blade" : "grille-cross-web", center, y, 4.6, kind === "louver" ? 0.18 : 0.065, kind === "louver" ? 0.23 : 0.09, "pipe", -0.08);
      }
      if (kind === "reinforced") {
        sloped("reinforced-center-stile", center, 1.62, 0.21, 2.28, 0.18, "steel", 0.025);
        for (const y of [0.95, 2.23]) sloped("reinforced-cross-brace", center, y, 4.65, 0.16, 0.19, "steel", 0.03);
      }
      for (const x of [center - 2.3, center + 2.3]) for (const y of [0.51, 2.7]) sloped("cartridge-captive-fastener", x, y, 0.11, 0.11, 0.045, "brass", 5e-3);
      for (const x of [center - 1.3, center + 1.3]) {
        sloped("visible-recess-cassette", x, 1.56, 0.64, 1.6, 0.16, "inset", -0.5);
        for (const y of [0.98, 1.3, 1.62, 1.94, 2.26]) sloped("recess-cooling-fin", x, y, 0.7, 0.08, 0.16, "steel", -0.39);
      }
      sloped("grille-release-latch", center, 2.75, 0.45, 0.15, 0.07, "brass", 0.055);
    }
  }
  if (family === "cover") {
    const count = kind === "segmented" ? 8 : 4, step = 10.6 / count;
    for (let i = 0; i < count; i++) {
      const x = -5.3 + step * (i + 0.5);
      sloped("armor-recess-gasket", x, 1.61, step - 0.02, 2.68, 0.055, "inset", -0.13);
      sloped("sloped-ceramic-panel", x, 1.61, step - 0.1, 2.58, 0.12, "armor", -0.055);
      for (const y of [0.48, 2.71]) sloped("panel-captive-fastener", x, y, 0.12, 0.12, 0.06, "steel", 0.035);
      sloped("panel-lower-service-slot", x, 0.7, Math.min(0.48, step * 0.5), 0.09, 0.025, "dark", 0.018);
    }
    if (kind === "hatch") for (const x of [-2.73, 2.73]) {
      sloped("hatch-dark-gasket", x, 1.65, 2.35, 1.66, 0.045, "inset", 0.025);
      sloped("hatch-inset-door", x, 1.65, 2.2, 1.51, 0.085, "armor", 0.07);
      sloped("hatch-handle-pocket", x, 1.6, 0.67, 0.22, 0.025, "dark", 0.122);
      sloped("hatch-recess-handle", x, 1.6, 0.49, 0.085, 0.045, "steel", 0.15);
      for (const y of [1.15, 2.17]) sloped("hatch-hinge", x - 0.96, y, 0.12, 0.27, 0.13, "steel", 0.15);
      for (const y of [1.16, 2.15]) sloped("hatch-lock", x + 0.94, y, 0.14, 0.2, 0.1, "brass", 0.15);
    }
    if (kind === "vented") for (const x of [-2.73, 2.73]) {
      sloped("vent-inset-well", x, 1.7, 2.3, 1.7, 0.025, "dark", 0.025);
      for (let y = 1; y <= 2.4; y += 0.2) sloped("vent-blade", x, y, 2.07, 0.09, 0.12, "steel", 0.085);
      for (const dx of [-1.12, 1.12]) sloped("vent-frame-stile", x + dx, 1.7, 0.1, 1.74, 0.12, "inset", 0.09);
      for (const dx of [-1, 1]) for (const y of [0.92, 2.47]) sloped("vent-frame-fastener", x + dx, y, 0.1, 0.1, 0.035, "brass", 0.16);
    }
  }
  for (const x of [-4.45, -1.48, 1.48, 4.45]) {
    box("roof-panel", x, 3.215, -1.03, 2.91, 0.13, 1.24, "armor");
    box("roof-vent-well", x, 3.289, -1.22, 1.28, 0.02, 0.43, "dark");
    for (let dx = -0.53; dx < 0.6; dx += 0.18) box("roof-vent-rib", x + dx, 3.31, -1.22, 0.065, 0.025, 0.38, "inset");
    for (const dx of [-1.22, 1.22]) box("roof-fastener", x + dx, 3.291, -0.62, 0.1, 0.025, 0.12, "steel");
  }
  for (const x of [-4, -2, 2, 4]) {
    sloped("lower-recess-pocket", x, 0.31, 0.58, 0.095, 0.03, "dark", 0.132);
    sloped("lower-service-tab", x + 0.36, 0.31, 0.12, 0.12, 0.05, "steel", 0.15);
  }
  if (kind === "start" || kind === "end") {
    const x = kind === "start" ? -5.48 : 5.48;
    sloped("full-height-interface-seal", x, 1.62, 0.13, 2.8, 0.04, "inset", 0.175);
    for (const y of [0.68, 1.6, 2.52]) sloped("interface-locking-tab", x, y, 0.27, 0.13, 0.08, "steel", 0.2);
  }
  if (kind === "ramp-start" || kind === "ramp-end") {
    g.updateMatrixWorld(true);
    g.traverse((n) => {
      if (!n.isMesh) return;
      n.geometry.applyMatrix4(n.matrixWorld);
      n.position.set(0, 0, 0);
      n.rotation.set(0, 0, 0);
      const p = n.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), oldY = p.getY(i);
        const t = THREE.MathUtils.clamp((kind === "ramp-start" ? x + 6 : 6 - x) / 8, 0, 1);
        const newY = oldY * (0.18 + 0.82 * t);
        p.setY(i, newY);
        p.setZ(i, p.getZ(i) + (oldY - newY) * lean);
      }
      n.geometry.computeVertexNormals();
    });
  }
  g.userData = {
    revision: "r3",
    family,
    kind,
    frontAngleDegrees: 30,
    angleMeasuredFrom: "vertical",
    length: 12,
    visibility: "Inward surfaces, roof and exposed ends only; no concealed equipment."
  };
  return g;
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
