// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/slab-surface-r1.js
function surfaceMaps() {
  return { userData: { recipeSurface: true } };
}

// public/assets/track/tube-gap-termination-r1.js
function generate(THREE, { inside = false, kind = "takeoff", partial = false, radius = 18, openingWidth = 18 } = {}) {
  const root = new THREE.Group();
  root.name = inside ? "deep-illuminated-bore-collar" : "sealed-illuminated-tube-bulkhead";
  const maps = surfaceMaps(THREE), mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13092533, roughness: 0.57, metalness: 0.25 }),
    replacement: new THREE.MeshStandardMaterial({ color: 14210758, roughness: 0.58, metalness: 0.25 }),
    graphite: new THREE.MeshStandardMaterial({ color: 4278864, roughness: 0.48, metalness: 0.72, ...maps, normalScale: new THREE.Vector2(0.3, 0.3) }),
    steel: new THREE.MeshStandardMaterial({ color: 7438727, roughness: 0.4, metalness: 0.72 }),
    dark: new THREE.MeshStandardMaterial({ color: 1055007, roughness: 0.8, side: THREE.DoubleSide }),
    brass: new THREE.MeshStandardMaterial({ color: 11111254, roughness: 0.53, metalness: 0.65 }),
    light: new THREE.MeshStandardMaterial({ color: 16774622, emissive: 16773842, emissiveIntensity: 2.6, roughness: 0.3, toneMapped: false })
  };
  for (const [name, mat] of Object.entries(mats)) {
    mat.name = "tube-gap-terminal-r1-" + name;
    if (["graphite", "steel"].includes(name)) mat.userData.slabFinish = true;
  }
  const sign = inside ? -1 : 1, cy = inside ? radius : -radius;
  const sweep = partial ? openingWidth / radius : Math.PI * 2, start = -sweep / 2, end = sweep / 2;
  const inner = inside ? radius + 0.87 : radius - 4.5, outer = inside ? radius + 4 : radius - 0.85;
  const front = 0.34, bed = 1.12, back = 4;
  function point(r, a, z) {
    return [r * Math.sin(a), cy + sign * r * Math.cos(a), z];
  }
  function mesh(name, g, key) {
    const m = new THREE.Mesh(g, mats[key]);
    m.name = name;
    root.add(m);
    return m;
  }
  function geometry(p, uv, indices) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  function face(name, ri, ro, z, key, a = start, b = end, reverse = false) {
    const count = Math.max(1, Math.ceil((b - a) * ro / 0.3)), p = [], uv = [], ix = [];
    for (let i = 0; i <= count; i++) {
      const angle = a + (b - a) * i / count;
      for (const r of [ri, ro]) {
        const v = point(r, angle, z);
        p.push(...v);
        uv.push(v[0] / 3, (v[1] - cy) / 3);
      }
    }
    for (let i = 0; i < count; i++) {
      const n = i * 2;
      if (ri > 0) ix.push(n, n + 1, n + 2);
      ix.push(n + 1, n + 3, n + 2);
    }
    if (inside !== reverse) for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]];
    return mesh(name, geometry(p, uv, ix), key);
  }
  function wall(name, r, z0, z1, key, a = start, b = end) {
    const count = Math.max(1, Math.ceil((b - a) * r / 0.3)), p = [], uv = [], ix = [];
    for (let i = 0; i <= count; i++) {
      const angle = a + (b - a) * i / count;
      for (const z of [z0, z1]) {
        p.push(...point(r, angle, z));
        uv.push(r * angle / 3, z / 3);
      }
    }
    for (let i = 0; i < count; i++) {
      const n = 2 * i;
      ix.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
    const g = geometry(p, uv, ix), m = mesh(name, g, key);
    m.material.side = THREE.DoubleSide;
    return m;
  }
  function block(name, a, r, z, w, h, d, key) {
    const m = mesh(name, new THREE.BoxGeometry(w, h, d), key);
    m.position.set(...point(r, a, z));
    m.rotation.z = inside ? a + Math.PI : -a;
    return m;
  }
  function bolt(a, r, z) {
    const m = mesh("captive-terminal-fastener", new THREE.CylinderGeometry(0.065, 0.065, 0.055, 6), "steel");
    m.rotation.x = Math.PI / 2;
    m.position.set(...point(r, a, z));
  }
  face("recessed-annular-service-bed", inner, outer, bed, "dark");
  face("closed-rear-annulus", inner, outer, back, "dark", start, end, true);
  wall("outer-armored-return", outer, front, back, "graphite");
  wall("inner-machined-return", inner, front, back, "steel");
  face("outer-ivory-rim", outer - 0.26, outer, front, "ivory");
  face("inner-ivory-rim", inner, inner + 0.25, front, "ivory");
  face("rim-recess-shadow", outer - 0.65, outer - 0.29, 0.64, "dark");
  const columns = partial ? 4 : 32, cell = sweep / columns;
  for (let i = 0; i < columns; i++) {
    const a = start + i * cell, b = a + cell, c = (a + b) / 2, pad = 0.025;
    face("segmented-terminal-energy-cover", outer - 0.57, outer - 0.37, 0.46, "light", a + pad, b - pad);
    face("energy-channel-inner-bezel", outer - 0.7, outer - 0.63, front, "steel", a + 6e-3, b - 6e-3);
    face("energy-channel-outer-bezel", outer - 0.31, outer - 0.26, front, "steel", a + 6e-3, b - 6e-3);
    const low = inner + 0.42, high = outer - 0.92, mid = (low + high) / 2;
    const family = i % 4, plate = family === 3 ? "replacement" : "ivory";
    block("radial-ivory-cartridge-divider", a + 9e-3, (inner + outer) / 2, 0.57, 0.12, outer - inner - 0.12, 0.48, "ivory");
    for (const r of [inner + 0.15, outer - 0.13]) bolt(c, r, 0.285);
    if (family === 0) {
      for (const da of [-0.029, 0.029]) {
        const pipe = mesh("recessed-radial-conduit", new THREE.CylinderGeometry(0.12, 0.12, high - low, 8), "steel");
        pipe.position.set(...point(mid, c + da, 0.83));
        pipe.rotation.z = inside ? c + da + Math.PI : -(c + da);
        for (const r of [low + 0.22, high - 0.22]) {
          const sleeve = mesh("conduit-stepped-sleeve", new THREE.CylinderGeometry(0.17, 0.17, 0.22, 8), "brass");
          sleeve.position.set(...point(r, c + da, 0.83));
          sleeve.rotation.z = pipe.rotation.z;
        }
      }
      block("pipe-retaining-strap", c, mid, 0.61, mid * cell * 0.68, 0.12, 0.1, "ivory");
    } else if (family === 1) {
      for (let j = 0; j < 7; j++) block("recessed-cooling-fin", c, low + (j + 0.5) * (high - low) / 7, 0.78, mid * cell * 0.7, 0.075, 0.3, "steel");
      block("cooling-service-status-light", c, inner + 0.3, 0.47, 0.42, 0.1, 0.06, "light");
    } else {
      face("segmented-access-armor", low, high, 0.67, plate, a + 0.026, b - 0.026);
      face("access-inset-metal-plate", low + 0.19, high - 0.18, 0.63, "graphite", a + 0.048, b - 0.048);
      block("recessed-access-latch", c, mid, 0.54, 0.28, 0.4, 0.12, "steel");
      for (const r of [low + 0.12, high - 0.12]) bolt(c, r, 0.59);
      if (family === 2) block("access-energy-indicator", c, low + 0.3, 0.57, 0.5, 0.08, 0.05, "light");
    }
    if (i % 4 === 0) block("radial-receiving-light-key", c, inner + 0.32, 0.39, mid * cell * 0.55, 0.12, 0.06, "light");
  }
  if (!inside) {
    face("opaque-bulkhead-closure", 0, inner + 0.03, 1.5, "dark");
    face("opaque-bulkhead-back", 0, inner + 0.03, back, "dark", start, end, true);
    for (const [lo, hi] of [[0, 4.1], [4.18, 8.6], [8.68, inner - 0.08]]) {
      const n2 = partial ? 4 : 16;
      for (let i = 0; i < n2; i++) {
        const a = start + i * sweep / n2, b = start + (i + 1) * sweep / n2;
        face("radial-brushed-bulkhead-plate", lo, hi, 1.34, i % 5 === 1 ? "steel" : "graphite", a + 3e-3, b - 3e-3);
        if (lo > 0) for (const r of [lo + 0.2, hi - 0.2]) bolt((a + b) / 2, r, 1.27);
      }
    }
    face("bulkhead-hatch-ivory-ring", 3.72, 4.02, 1.16, "ivory");
    face("bulkhead-hatch-light-well", 3.41, 3.66, 1.28, "dark");
    const n = partial ? 3 : 16;
    for (let i = 0; i < n; i++) face("bulkhead-hatch-segmented-energy", 3.46, 3.6, 1.21, "light", start + (i + 0.12) * sweep / n, start + (i + 0.88) * sweep / n);
    if (!partial) {
      block("central-sealed-service-hatch", 0, 0, 1.24, 3.1, 3.1, 0.18, "steel");
      for (const x of [-0.9, 0.9]) {
        const handle = block("hatch-release-handle", 0, 0, 1.09, 0.17, 1.2, 0.12, "ivory");
        handle.position.x = x;
      }
    }
  }
  if (partial) {
    for (const a of [start, end]) block("closed-sector-return", a, (inner + outer) / 2, (front + back) / 2, 0.09, outer - inner, back - front, "ivory");
  }
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh) return;
    m.geometry.applyMatrix4(m.matrixWorld);
    if (kind === "landing") {
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, -p.getZ(i));
      const ix = m.geometry.index;
      for (let i = 0; i < ix.count; i += 3) {
        const b = ix.getX(i + 1);
        ix.setX(i + 1, ix.getX(i + 2));
        ix.setX(i + 2, b);
      }
      m.geometry.computeVertexNormals();
    }
    m.position.set(0, 0, 0);
    m.rotation.set(0, 0, 0);
    m.scale.set(1, 1, 1);
  });
  root.userData = { inside, kind, partial, radius, depth: back, revision: "11-tube-termination-r1" };
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
