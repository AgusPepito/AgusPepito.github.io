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

// public/assets/track/checkpoint-r1.js
function generate(THREE, { width = 36, projection = true, rows = 5 } = {}) {
  const root = new THREE.Group();
  root.name = "checkered-timing-station-r1";
  const grain = surfaceMaps(THREE), mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 14012604, roughness: 0.48, metalness: 0.3, ...grain, normalScale: new THREE.Vector2(0.12, 0.12) }),
    graphite: new THREE.MeshStandardMaterial({ color: 3160899, roughness: 0.41, metalness: 0.72, ...grain, normalScale: new THREE.Vector2(0.27, 0.27) }),
    steel: new THREE.MeshStandardMaterial({ color: 8557979, roughness: 0.3, metalness: 0.85 }),
    brass: new THREE.MeshStandardMaterial({ color: 10388822, roughness: 0.43, metalness: 0.68 }),
    dark: new THREE.MeshStandardMaterial({ color: 791322, roughness: 0.72 }),
    glass: new THREE.MeshStandardMaterial({ color: 1319981, roughness: 0.12, metalness: 0.76 }),
    light: new THREE.MeshStandardMaterial({ color: 16775400, emissive: 16775400, emissiveIntensity: 2.1, toneMapped: false }),
    curtain: recipeEffectMaterial(THREE, { color: 16775920, transparent: true, opacity: 0.29, depthWrite: false, side: THREE.DoubleSide, vertexColors: true, blending: THREE.AdditiveBlending, toneMapped: false })
  };
  for (const [key, m] of Object.entries(mats)) {
    m.name = "checkpoint-r1-" + key;
    if (["ivory", "graphite", "steel", "brass", "glass"].includes(key)) m.userData.slabFinish = true;
  }
  function mesh(name, g, key, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, mats[key]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  const box = (name, x, y, z, w, h, d, key) => mesh(name, openBottomBox(THREE, w, h, d), key, x, y, z);
  function horizontal(name, s, key, x, y, z, depth = 0.1) {
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 1, steps: 1 });
    omitFaces(THREE, g, 2, -1);
    g.translate(0, 0, -depth - 0.018);
    g.rotateX(-Math.PI / 2);
    return mesh(name, g, key, x, y, z);
  }
  function plate(name, x, z, w, d, key, holes = [], circle = false, top = -0.045) {
    const b = 0.09, s = new THREE.Shape();
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
      const p = new THREE.Path(), hy = -hz;
      p.moveTo(hx - hw / 2, hy - hd / 2);
      p.lineTo(hx - hw / 2, hy + hd / 2);
      p.lineTo(hx + hw / 2, hy + hd / 2);
      p.lineTo(hx + hw / 2, hy - hd / 2);
      p.closePath();
      s.holes.push(p);
    }
    if (circle) {
      const p = new THREE.Path();
      p.absarc(0, 0, 1.52, 0, Math.PI * 2, true);
      s.holes.push(p);
    }
    return horizontal(name, s, key, x, top, z);
  }
  function ring(x, z, outer, inner, y, key) {
    const s = new THREE.Shape();
    s.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const p = new THREE.Path();
    p.absarc(0, 0, inner, 0, Math.PI * 2, true);
    s.holes.push(p);
    return horizontal("concentric-instrument-bezel", s, key, x, y, z, 0.12);
  }
  function bolt(x, z, y = -0.031) {
    mesh("instrument-captive-washer", topCylinder(THREE, 0.065, 0.022, 8), "dark", x, y - 0.02, z);
    mesh("instrument-hex-fastener", topCylinder(THREE, 0.041, 0.033, 6), "steel", x, y, z);
    box("fastener-drive-recess", x, y + 0.018, z, 0.035, 3e-3, 8e-3, "dark");
  }
  function lens(x, z, r, y) {
    mesh("recessed-optical-glass", topCylinder(THREE, r, 0.075, 24), "glass", x, y, z);
    ring(x, z, r + 0.09, r + 0.01, y + 0.042, "steel");
  }
  function cassette(x, z, w = 2.86) {
    plate("timing-cassette-machined-rim", x, z, w, 0.56, "steel", [[0, 0, w - 0.28, 0.3]], false, -0.08);
    box("timing-cassette-dark-well", x, -0.38, z, w - 0.08, 0.08, 0.5, "dark");
    for (let j = 0; j < 5; j++) {
      const lx = x + (j - 2) * (w - 0.55) / 5;
      mesh("lamp-reflector-cup", topCylinder(THREE, 0.13, 0.1, 8), "graphite", lx, -0.25, z);
      mesh("recessed-pearl-timing-lamp", topCylinder(THREE, 0.082, 0.045, 8), "light", lx, -0.18, z);
    }
    for (const dx of [-w / 2 + 0.075, w / 2 - 0.075]) bolt(x + dx, z, -0.06);
  }
  function instrument(x, z) {
    mesh("circular-well-opaque-floor", topCylinder(THREE, 1.51, 0.1, 32), "dark", x, -0.93, z);
    ring(x, z, 1.47, 1.2, -0.11, "ivory");
    ring(x, z, 1.19, 1.04, -0.23, "steel");
    ring(x, z, 1.02, 0.82, -0.39, "graphite");
    ring(x, z, 0.81, 0.69, -0.48, "brass");
    lens(x, z, 0.64, -0.63);
    ring(x, z, 0.34, 0.3, -0.566, "steel");
    mesh("optical-center-white-indicator", topCylinder(THREE, 0.06, 0.028, 8), "light", x, -0.58, z);
    for (let n = 0; n < 24; n++) {
      const a = n * Math.PI / 12, s = Math.sin(a), c = Math.cos(a);
      const tick = box("radial-calibration-mark", x + s * 1.34, -0.103, z + c * 1.34, 0.033, 6e-3, n % 3 === 0 ? 0.18 : 0.095, "graphite");
      tick.rotation.y = a;
      if (n % 3 === 0) {
        bolt(x + s * 1.43, z + c * 1.43, -0.086);
        const clamp = box("sensor-retaining-clamp", x + s * 0.95, -0.345, z + c * 0.95, 0.13, 0.055, 0.21, "steel");
        clamp.rotation.y = a;
      }
      if (n % 6 === 0) box("sensor-inner-status-pin", x + s * 0.89, -0.327, z + c * 0.89, 0.055, 0.012, 0.055, "light");
    }
  }
  const columns = width > 36 ? Math.max(2, 2 * Math.round(width / 12)) : Math.max(1, Math.round(width / 6)), pitch = width / columns;
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const first = root.children.length, z = (row - (rows - 1) / 2) * 6, dark = (col + row) % 2 === 1;
    const central = Math.abs(z) < 0.01;
    const circular = !central && dark && row % 2 === 1;
    box("sealed-checker-tile-undertray", 0, -1.08, z, 5.99, 0.14, 5.99, "dark");
    const holes = [[0, -2.28, 2.9, 0.6], [0, 2.28, 2.9, 0.6]];
    if (central) holes.push([0, 0, 5.2, 0.94]);
    plate("beveled-" + (dark ? "graphite" : "ivory") + "-checker-tile", 0, z, 5.94, 5.94, dark ? "graphite" : "ivory", holes, circular);
    if (circular) instrument(0, z);
    for (const dz of [-2.28, 2.28]) cassette(0, z + dz);
    for (const x of [-2.7, 2.7]) for (const dz of [-2.7, 0, 2.7]) bolt(x, z + dz);
    for (const x of [-2.16, 2.16]) {
      plate("checker-service-lock-cover", x, z, 0.48, 1.14, "graphite", [], false, -0.024);
      for (const dz of [-0.36, 0.36]) box("service-cover-brass-lock", x, -0.015, z + dz, 0.19, 0.016, 0.1, "brass");
    }
    if (central) {
      box("white-curtain-emitter-well", 0, -0.43, z, 5.2, 0.12, 0.94, "dark");
      for (let j = 0; j < 5; j++) {
        const x = (j - 2) * 1.02;
        plate("crossing-projector-bezel", x, z, 0.94, 0.79, "steel", [[0, 0, 0.69, 0.51]], false, -0.078);
        box("projector-reflector-floor", x, -0.32, z, 0.72, 0.065, 0.55, "graphite");
        for (const dz of [-0.145, 0, 0.145]) box("white-curtain-origin-lens", x, -0.205, z + dz, 0.61, 0.04, 0.065, "light");
        for (const dx of [-0.4, 0.4]) bolt(x + dx, z, -0.054);
      }
    }
    if (row === 0 || row === rows - 1) {
      const dz = row === 0 ? -2.83 : 2.83;
      box("thin-perimeter-timing-strip", 0, -0.023, z + dz, 5.22, 0.028, 0.065, "light");
    }
    const cx = -width / 2 + (col + 0.5) * pitch, scale = pitch / 6;
    for (const m of root.children.slice(first)) {
      m.position.x = cx + m.position.x * scale;
      m.scale.x *= scale;
    }
  }
  if (projection) {
    const g = new THREE.PlaneGeometry(width, 7, Math.ceil(width / 0.25), 24);
    g.translate(0, 3.505, 0);
    const p = g.attributes.position, colors = [];
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), v = Math.pow(Math.max(0, 1 - y / 7.01), 1.3) * (0.86 + 0.14 * Math.cos(y * 12));
      colors.push(v, v, v);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const curtain = mesh("checkpoint-white-curtain", g, "curtain");
    curtain.renderOrder = 2;
  }
  const used = new Set(root.children.map((m) => m.material));
  Object.values(mats).forEach((m) => {
    if (!used.has(m)) m.dispose();
  });
  root.userData = { width, length: rows * 6 };
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
