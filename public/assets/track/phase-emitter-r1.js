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
var topCylinder = (THREE, radius, height, sides) => omitFaces(THREE, new THREE.CylinderGeometry(radius, radius, height, sides), 1, -1);

// public/assets/track/slab-surface-r1.js
function surfaceMaps() {
  return { userData: { recipeSurface: true } };
}

// public/assets/track/phase-field-r1.js
var phaseFieldHeight = (curl) => 11 - 2 * Math.max(0, Math.min(1, curl));

// public/assets/track/phase-emitter-r1.js
function generate(THREE, { width = 36, color = 5104127, projection = true, reuseModules = false, firstModuleOnly = false, curl = 0, closed = false } = {}) {
  const root = new THREE.Group();
  root.name = "recessed-phase-emitter-f1-f2-r1";
  const grain = surfaceMaps(THREE), mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13552056, metalness: 0.32, roughness: 0.49, ...grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    graphite: new THREE.MeshStandardMaterial({ color: 4475986, metalness: 0.74, roughness: 0.42, ...grain, normalScale: new THREE.Vector2(0.28, 0.28) }),
    steel: new THREE.MeshStandardMaterial({ color: 8557209, metalness: 0.83, roughness: 0.32 }),
    brass: new THREE.MeshStandardMaterial({ color: 11372882, metalness: 0.7, roughness: 0.42 }),
    dark: new THREE.MeshStandardMaterial({ color: 1054750, roughness: 0.78 }),
    cable: new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.24, metalness: 0.28, roughness: 0.4 }),
    energy: new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5, metalness: 0.15, roughness: 0.22, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.65, metalness: 0.55, roughness: 0.18 }),
    curtain: recipeEffectMaterial(THREE, { color, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, blending: THREE.AdditiveBlending })
  };
  for (const [key, m] of Object.entries(mats)) {
    m.name = "phase-emitter-r1-" + key;
    if (["ivory", "graphite", "steel", "brass", "cable", "glass"].includes(key)) m.userData.slabFinish = true;
    if (["cable", "energy", "glass", "curtain"].includes(key)) m.userData.phaseTint = true;
  }
  function mesh(name, g, key, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, mats[key]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  function box(name, x, y, z, w, h, d, key) {
    return mesh(name, openBottomBox(THREE, w, h, d), key, x, y, z);
  }
  function plate(name, x, z, w, d, key = "ivory", holes = [], top = -0.045) {
    const b = Math.min(0.1, w / 8, d / 8), s = new THREE.Shape();
    s.moveTo(-w / 2 + b, -d / 2);
    s.lineTo(w / 2 - b, -d / 2);
    s.lineTo(w / 2, -d / 2 + b);
    s.lineTo(w / 2, d / 2 - b);
    s.lineTo(w / 2 - b, d / 2);
    s.lineTo(-w / 2 + b, d / 2);
    s.lineTo(-w / 2, d / 2 - b);
    s.lineTo(-w / 2, -d / 2 + b);
    s.closePath();
    for (const [hx, hz, hw, hd] of holes) {
      const p2 = new THREE.Path();
      p2.moveTo(hx - hw / 2, hz - hd / 2);
      p2.lineTo(hx - hw / 2, hz + hd / 2);
      p2.lineTo(hx + hw / 2, hz + hd / 2);
      p2.lineTo(hx + hw / 2, hz - hd / 2);
      p2.closePath();
      s.holes.push(p2);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 1, steps: 1 });
    g.rotateX(-Math.PI / 2);
    g.scale(1, 1, -1);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i += 3) for (const a of [p, n, uv]) for (let k = 0; k < a.itemSize; k++) {
      const j = (i + 1) * a.itemSize + k, l = (i + 2) * a.itemSize + k, t = a.array[j];
      a.array[j] = a.array[l];
      a.array[l] = t;
    }
    g.computeVertexNormals();
    omitFaces(THREE, g, 1, -1);
    return mesh(name, g, key, x, top - 0.118, z);
  }
  function bolt(x, z, y = -0.032) {
    mesh("captive-washer", topCylinder(THREE, 0.07, 0.025, 8), "dark", x, y - 0.025, z);
    mesh("hex-fastener", topCylinder(THREE, 0.045, 0.04, 6), "steel", x, y, z);
    box("fastener-slot", x, y + 0.021, z, 0.038, 4e-3, 9e-3, "dark");
  }
  function cylinder(name, x, y, z, r, length, key) {
    const m = mesh(name, new THREE.CylinderGeometry(r, r, length, r >= 0.3 ? 12 : 8, 1, name === "capacitor-ceramic-body"), key, x, y, z);
    m.rotation.x = Math.PI / 2;
    return m;
  }
  function cable(points, r, key = "cable") {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return mesh("routed-charging-cable", new THREE.TubeGeometry(curve, Math.max(12, (points.length - 1) * 5), r, 6, false), key);
  }
  function well(x, z, w, d) {
    box("deep-machined-well-floor", x, -1.22, z, w, 0.14, d, "dark");
    for (const side of [-1, 1]) {
      const longWall = box("well-long-wall", x + side * (w / 2 - 0.05), -0.65, z, 0.1, 1.08, d, "graphite");
      const endWall = box("well-end-wall", x, -0.65, z + side * (d / 2 - 0.05), w, 1.08, 0.1, "graphite");
      omitFaces(THREE, longWall.geometry, 0, side);
      omitFaces(THREE, endWall.geometry, 2, side);
    }
  }
  function capacitor(x, z, length) {
    cylinder("capacitor-ceramic-body", x, -0.68, z, 0.4, length, "graphite");
    for (const sign of [-1, 1]) {
      const end = z + sign * length / 2;
      cylinder("capacitor-stepped-end", x, -0.68, end, 0.43, 0.15, "steel");
      cylinder("terminal-brass-collar", x, -0.68, end + sign * 0.1, 0.27, 0.13, "brass");
      cylinder("terminal-insulating-boot", x, -0.68, end + sign * 0.2, 0.19, 0.12, "dark");
      cylinder("capacitor-phase-band", x, -0.68, z + sign * length * 0.3, 0.414, 0.14, "energy");
      cylinder("capacitor-band-seal", x, -0.68, z + sign * (length * 0.3 + 0.1), 0.423, 0.055, "dark");
      box("cell-mount-saddle", x, -1.05, z + sign * length * 0.33, 0.99, 0.2, 0.26, "steel");
      for (const dx of [-0.46, 0.46]) bolt(x + dx, z + sign * length * 0.33, -0.9);
    }
    for (const dx of [-0.31, 0.31]) box("capacitor-longitudinal-rib", x + dx, -0.5, z, 0.055, 0.06, length * 0.76, "steel");
    plate("capacitor-identification-tab", x, z, 0.22, 0.48, "brass", [], -0.22);
    for (const dz of [-0.12, 0, 0.12]) box("capacitor-tab-engraving", x, -0.218, z + dz, 0.13, 3e-3, 0.022, "dark");
  }
  const count = Math.max(1, Math.round(width / 6)), pitch = width / count, scale = pitch / 6;
  let moduleParts;
  for (let i = 0; i < (firstModuleOnly ? 1 : count); i++) {
    const first = root.children.length, cx = -width / 2 + (i + 0.5) * pitch;
    if (reuseModules && moduleParts) {
      for (const part of moduleParts) {
        const m = part.clone();
        m.geometry = part.geometry.clone();
        root.add(m);
      }
    } else {
      box("sealed-station-undertray", 0, -1.39, 3, 5.98, 0.18, 11.98, "graphite");
      plate("perforated-ivory-station-frame", 0, 3, 5.94, 11.94, "ivory", [
        [-0.77, 1.65, 3.32, 6.6],
        [1.94, 1.65, 1.24, 6.6],
        [-0.77, -4.68, 3.32, 1.78],
        [1.94, -4.68, 1.24, 1.78],
        [0, -3, 5.18, 0.86],
        ...[-0.6, 0.6].map((z) => [0, z - 3, 5.04, 0.085]),
        ...[8.46, 1, -2.77].map((z) => [-0.75, z - 3, 3.26, z === 8.46 ? 0.59 : z < 0 ? 0.26 : 0.33]),
        ...[-2.74, 1.1, 2.75].flatMap((x) => [2.15, 6.65].map((z) => [x, z - 3, 0.18, 0.78]))
      ]);
      well(-0.77, 4.65, 3.32, 6.6);
      well(1.94, 4.65, 1.24, 6.6);
      well(-0.77, -1.68, 3.32, 1.78);
      well(1.94, -1.68, 1.24, 1.78);
      well(0, 0, 5.18, 0.86);
      for (const x of [-1.58, 0.04]) {
        capacitor(x, 4.8, 3.35);
        capacitor(x, -1.68, 0.72);
        cable([[x, -0.68, 2.78], [x, -0.64, 2.3], [x + 0.22, -0.48, 1.89], [x + 0.22, -0.4, 0.72]], 0.095);
        box("terminal-socket-block", x + 0.22, -0.43, 0.78, 0.36, 0.35, 0.32, "brass");
        for (const z of [7.05, 7.27, 7.49]) box("submerged-power-busbar", x, -0.81, z, 0.89, 0.1, 0.09, "steel");
      }
      for (let j = 0; j < 3; j++) {
        const x = 1.57 + j * 0.35;
        cable([[x, -0.49, 7.76], [x, -0.46, 6.8], [x, -0.46, 3.2], [x, -0.48, 1.45], [x - 0.16, -0.39, 0.71]], 0.105);
        for (const z of [2.2, 6.8, 7.55]) {
          cylinder("charging-cable-brass-coupling", x, -0.46, z, 0.146, 0.22, "brass");
          for (const dz of [-0.19, -0.13, 0.13, 0.19]) cylinder("charging-cable-ribbed-sleeve", x, -0.46, z + dz, 0.132, 0.042, "dark");
        }
        for (const z of [3.5, 5.4]) box("recessed-cable-comb-tooth", x, -0.31, z, 0.29, 0.075, 0.19, "ivory");
        cylinder("feed-termination-socket", x, -0.49, 7.94, 0.16, 0.2, "steel");
        cylinder("rear-return-cable", x, -0.5, -1.65, 0.11, 1.16, "cable");
      }
      for (const z of [3.5, 5.4]) for (const x of [1.4, 2.49]) bolt(x, z, -0.28);
      for (let j = 0; j < 5; j++) {
        const x = -2.06 + j * 1.03;
        plate("projector-machined-bezel", x, 0, 0.93, 0.72, "steel", [[0, 0, 0.67, 0.47]], -0.09);
        box("projector-reflector-bed", x, -0.43, 0, 0.78, 0.12, 0.57, "steel");
        box("recessed-optical-glass", x, -0.245, 0, 0.65, 0.07, 0.45, "glass");
        for (const dz of [-0.13, 0.13]) box("projector-energy-filament", x, -0.193, dz, 0.56, 0.025, 0.045, "energy");
        box("lens-center-divider", x, -0.181, 0, 0.028, 0.025, 0.45, "dark");
        for (const dx of [-0.4, 0.4]) bolt(x + dx, 0, -0.067);
      }
      for (const z of [-0.6, 0.6]) box("crossing-line-recessed-phase-strip", 0, -0.075, z, 5.02, 0.025, 0.055, "energy");
      for (const z of [8.46, 1, -2.77]) {
        plate("removable-service-hatch", -0.75, z, 3.22, z === 8.46 ? 0.55 : z < 0 ? 0.22 : 0.29, "graphite", [], -0.078);
        for (const x of [-2.2, 0.7]) bolt(x, z, -0.055);
        box("recessed-hatch-latch", -0.75, -0.083, z, 0.27, 0.024, 0.095, "brass");
      }
      for (const x of [-2.74, 1.1, 2.75]) {
        for (const z of [-2.66, 0.8, 3.1, 5.8, 8.65]) bolt(x, z);
        for (const z of [2.15, 6.65]) {
          plate("narrow-service-vent-bezel", x, z, 0.28, 0.92, "steel", [[0, 0, 0.13, 0.68]], -0.026);
          for (let n = 0; n < 6; n++) box("inset-service-vent-louver", x, -0.21, z - 0.27 + n * 0.108, 0.12, 0.045, 0.045, "dark");
        }
      }
      for (const z of [-2.94, 8.94]) box("flush-station-end-seal", 0, -0.17, z, 5.94, 0.23, 0.09, "dark");
      for (const z of [-6, 12]) {
        box("extension-sealed-undertray", 0, -1.39, z, 5.98, 0.18, 5.98, "graphite");
        plate("extension-ivory-service-frame", 0, z, 5.94, 5.94, "ivory", [
          [-0.77, 0, 3.32, 4.65],
          [1.94, 0, 1.24, 4.65],
          ...[-2.64, 2.64].map((dz) => [-0.75, dz, 3.26, 0.3]),
          ...[-2.74, 1.1, 2.75].map((x) => [x, 0, 0.18, 0.78])
        ]);
        well(-0.77, z, 3.32, 4.65);
        well(1.94, z, 1.24, 4.65);
        for (const x of [-1.58, 0.04]) {
          capacitor(x, z, 2.8);
          for (const side of [-1, 1]) {
            cable([[x, -0.68, z + side * 1.66], [x, -0.64, z + side * 1.96], [x + 0.3, -0.49, z + side * 2.13]], 0.095);
            box("extension-cell-busbar", x, -0.98, z + side * 1.96, 0.94, 0.1, 0.09, "brass");
          }
        }
        for (let j = 0; j < 3; j++) {
          const x = 1.57 + j * 0.35;
          cable([[x, -0.49, z - 2.14], [x, -0.46, z - 1], [x, -0.46, z + 1], [x, -0.49, z + 2.14]], 0.105);
          for (const dz of [-1.86, 1.86]) {
            cylinder("extension-feed-coupling", x, -0.49, z + dz, 0.146, 0.22, "brass");
            for (const rib of [-0.19, -0.13, 0.13, 0.19]) cylinder("extension-ribbed-boot", x, -0.49, z + dz + rib, 0.132, 0.042, "dark");
          }
          for (const dz of [-0.85, 0.85]) box("extension-cable-comb", x, -0.31, z + dz, 0.29, 0.075, 0.19, "ivory");
        }
        for (const dz of [-2.64, 2.64]) {
          plate("extension-maintenance-hatch", -0.75, z + dz, 3.22, 0.26, "graphite", [], -0.078);
          box("extension-hatch-lock", -0.75, -0.067, z + dz, 0.27, 0.025, 0.09, "brass");
          for (const x of [-2.2, 0.7]) bolt(x, z + dz, -0.055);
        }
        for (const x of [-2.74, 1.1, 2.75]) {
          plate("extension-cooling-bezel", x, z, 0.28, 0.92, "steel", [[0, 0, 0.13, 0.68]], -0.026);
          for (let n = 0; n < 6; n++) box("extension-cooling-louver", x, -0.21, z - 0.27 + n * 0.108, 0.12, 0.045, 0.045, "dark");
          for (const dz of [-2.65, -1.3, 1.3, 2.65]) bolt(x, z + dz);
        }
        for (const dz of [-2.94, 2.94]) box("extension-end-seal", 0, -0.17, z + dz, 5.94, 0.23, 0.09, "dark");
      }
      if (reuseModules) moduleParts = root.children.slice(first).map((m) => m.clone());
    }
    for (const m of root.children.slice(first)) {
      m.position.x = cx + m.position.x * scale;
      m.scale.x *= scale;
    }
  }
  if (projection) {
    const height = phaseFieldHeight(curl);
    const g = new THREE.PlaneGeometry(width, height, Math.ceil(width / 0.25), 24);
    g.translate(0, height / 2 + 0.01, 0);
    mats.curtain.userData.phaseField = { width, height, curl, closed };
    const m = mesh("phase-projection-curtain", g, "curtain");
    m.renderOrder = 2;
  }
  const used = new Set(root.children.map((m) => m.material));
  Object.values(mats).forEach((m) => {
    if (!used.has(m)) m.dispose();
  });
  root.userData.phaseColor = color;
  return root;
}
function recipeEffectMaterial(THREE, parameters) {
  const { vertexColors = false, ...settings } = parameters;
  const material = new THREE.MeshStandardMaterial({ ...settings, vertexColors: false });
  material.userData.recipeEffect = { unlit: true, vertexColors };
  return material;
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
