// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/slab-surface-r1.js
function surfaceMaps() {
  return { userData: { recipeSurface: true } };
}

// public/assets/track/gap-surface-r2.js
function generate(THREE, { kind = "takeoff", width = 36, length = 12 } = {}) {
  const root = new THREE.Group();
  root.name = `gap-${kind}-energy-surface-r2`;
  const maps = surfaceMaps(THREE), scale = width / 36;
  const mats = {
    plate: new THREE.MeshStandardMaterial({ color: 4541264, roughness: 0.48, metalness: 0.72, ...maps, normalScale: new THREE.Vector2(0.32, 0.32), envMapIntensity: 0.85 }),
    replacement: new THREE.MeshStandardMaterial({ color: 6449260, roughness: 0.43, metalness: 0.74, ...maps, normalScale: new THREE.Vector2(0.32, 0.32) }),
    ivory: new THREE.MeshStandardMaterial({ color: 13027779, roughness: 0.48, metalness: 0.32 }),
    steel: new THREE.MeshStandardMaterial({ color: 7635075, roughness: 0.36, metalness: 0.78 }),
    dark: new THREE.MeshStandardMaterial({ color: 1054491, roughness: 0.8 }),
    diffuser: new THREE.MeshStandardMaterial({ color: 12241872, emissive: 13030870, emissiveIntensity: 0.6, roughness: 0.4 }),
    light: new THREE.MeshStandardMaterial({ color: 16774622, emissive: 16773842, emissiveIntensity: 2.8, roughness: 0.25, toneMapped: false })
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = "gap-top-r2-" + key;
    if (["plate", "replacement", "steel"].includes(key)) mat.userData.slabFinish = true;
  }
  const fixtures = [];
  function stroke(points, w) {
    const edges = points.slice(1).map((p, i) => {
      const dx = p[0] - points[i][0], dz = p[1] - points[i][1], l = Math.hypot(dx, dz);
      return [-dz / l, dx / l];
    });
    const left = [], right = [];
    points.forEach(([x, z], i) => {
      const a = edges[Math.max(0, i - 1)], b = edges[Math.min(i, edges.length - 1)];
      let nx = a[0] + b[0], nz = a[1] + b[1], l = Math.hypot(nx, nz);
      nx /= l;
      nz /= l;
      const d = w / 2 / (nx * b[0] + nz * b[1]);
      left.push([x + nx * d, z + nz * d]);
      right.push([x - nx * d, z - nz * d]);
    });
    return [...left, ...right.reverse()];
  }
  function run(name, points, w) {
    points = points.map(([x, z]) => [x * scale, z]);
    w *= scale;
    fixtures.push({ name, points, w, outer: stroke(points, w + 0.36 * scale), inner: stroke(points, w) });
  }
  if (kind === "takeoff") {
    for (const [i, z] of [2.1, 5.6, 9.1].entries()) run(`takeoff-chevron-${i}`, [[-6.5, z + 1], [0, z - 1], [6.5, z + 1]], 0.65);
    for (const side of [-1, 1]) for (const [i, a] of [1.6, 6.5].entries()) run(`takeoff-channel-${side}-${i}`, [[side * 10.7, a], [side * 10.7, a + 3.7]], 0.42);
  } else {
    run("landing-end-strip", [[-16.3, 0.62], [16.3, 0.62]], 0.36);
    for (const [i, z] of [2.6, 6, 9.4].entries()) {
      for (const side of [-1, 1]) {
        run(`landing-bracket-${side}-${i}`, [[side * 6.5, z - 1], [side * 7.8, z - 0.65], [side * 7.8, z + 0.65], [side * 6.5, z + 1]], 0.36);
        run(`landing-service-tile-${side}-${i}`, [[side * 10.4, z - 0.28], [side * 10.4, z + 0.28]], 0.6);
      }
      run(`landing-crossbar-${i}`, [[-2.2, z], [2.2, z]], 0.24);
    }
    for (const side of [-1, 1]) run(`landing-channel-${side}`, [[side * 13.8, 2], [side * 13.8, 10.5]], 0.3);
  }
  function path(points) {
    return new THREE.Path(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  }
  function shapeMesh(name, points, y, mat, holes2 = []) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    shape.holes = holes2.map(path);
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2, p.getZ(i) / 4);
    const mesh = new THREE.Mesh(g, mats[mat]);
    mesh.name = name;
    mesh.position.y = y;
    root.add(mesh);
    return mesh;
  }
  const rectangle = (x, z, w, l) => [[x - w / 2, z - l / 2], [x - w / 2, z + l / 2], [x + w / 2, z + l / 2], [x + w / 2, z - l / 2]];
  const footprint = rectangle(0, length / 2, width, length), holes = fixtures.map((f) => f.outer);
  shapeMesh("apron-brushed-armor", footprint, -0.012, "plate", holes);
  function bevel(name, outer, inner) {
    const clockwise = outer.reduce((sum, a, i) => {
      const b = outer[(i + 1) % outer.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0) < 0;
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length, a = outer[i], b = outer[j], c = inner[j], d = inner[i];
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([a[0], -8e-3, a[1], b[0], -8e-3, b[1], c[0], -0.08, c[1], d[0], -0.08, d[1]], 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex(clockwise ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, mats.ivory);
      mesh.name = name;
      root.add(mesh);
    }
  }
  for (const f of fixtures) {
    let sample = function(d) {
      const i = Math.min(lengths.length - 1, cumulative.findIndex((v, j) => j > 0 && v >= d) - 1);
      const t = (d - cumulative[i]) / lengths[i];
      return f.points[i].map((v, k) => v + (f.points[i + 1][k] - v) * t);
    };
    const first = root.children.length;
    bevel(f.name + "-chamfer", f.outer, f.inner);
    shapeMesh(f.name + "-diffuser-bed", f.inner, -0.085, "diffuser");
    const lengths = f.points.slice(1).map((p, i) => Math.hypot(p[0] - f.points[i][0], p[1] - f.points[i][1]));
    const cumulative = [0];
    for (const l of lengths) cumulative.push(cumulative.at(-1) + l);
    const total = cumulative.at(-1), cells = Math.max(1, Math.ceil(total / 0.7));
    for (let i = 0; i < cells; i++) {
      const a = total * i / cells + 0.025 * scale, b = total * (i + 1) / cells - 0.025 * scale;
      const points = [sample(a), ...f.points.filter((_, j) => cumulative[j] > a && cumulative[j] < b), sample(b)];
      shapeMesh(f.name + "-emitter-cell", stroke(points, f.w * 0.72), -0.055, "light");
    }
    for (const part of root.children.slice(first)) part.userData.lightAssembly = f.name;
  }
  function clear(rect) {
    const [x, z, w, l] = rect;
    return !fixtures.some((f) => {
      const xs = f.outer.map((p) => p[0]), zs = f.outer.map((p) => p[1]);
      return x + w / 2 > Math.min(...xs) - 0.1 && x - w / 2 < Math.max(...xs) + 0.1 && z + l / 2 > Math.min(...zs) - 0.1 && z - l / 2 < Math.max(...zs) + 0.1;
    });
  }
  for (const x of [-12, -6, 0, 6, 12].map((x2) => x2 * scale)) for (let z = 0.2; z < length - 0.2; z += 0.2) {
    const rect = [x, z, 0.035, 0.2];
    if (clear(rect)) shapeMesh("longitudinal-plate-joint", rectangle(...rect), -0.01, "dark");
  }
  for (const z of [4, 8, 11.8]) for (let x = -width / 2 + 0.2; x < width / 2 - 0.2; x += 0.2) {
    const rect = [x, z, 0.2, 0.035];
    if (clear(rect)) shapeMesh("crosswise-plate-joint", rectangle(...rect), -9e-3, "dark");
  }
  for (const side of [-1, 1]) for (const z of [2.5, 6, 9.5]) {
    const x = side * 15.4 * scale, rect = [x, z, 1.3 * scale, 1.8];
    if (!clear(rect)) continue;
    shapeMesh("inset-maintenance-plate", rectangle(...rect), -8e-3, "replacement");
    for (const dx of [-0.48, 0.48]) for (const dz of [-0.72, 0.72]) {
      shapeMesh("maintenance-fastener-seat", rectangle(x + dx * scale, z + dz, 0.13 * scale, 0.18), -5e-3, "dark");
      shapeMesh("maintenance-fastener-head", rectangle(x + dx * scale, z + dz, 0.065 * scale, 0.1), -3e-3, "steel");
    }
  }
  root.userData = { revision: "gap-top-r2", kind, width, length, recess: 0.18 };
  return root;
}

// public/assets/track/gap-edge-r1.js
var GAP_EDGE_DEPTH = 12;
function generate2(THREE, { kind = "takeoff", width = 36, finishedSides = true } = {}) {
  const root = new THREE.Group();
  root.name = `gap-${kind}-lip-r2`;
  const mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13027779, roughness: 0.57, metalness: 0.25 }),
    graphite: new THREE.MeshStandardMaterial({ color: 3160642, roughness: 0.48, metalness: 0.65 }),
    steel: new THREE.MeshStandardMaterial({ color: 6715005, roughness: 0.4, metalness: 0.72 }),
    dark: new THREE.MeshStandardMaterial({ color: 1120543, roughness: 0.84 }),
    brass: new THREE.MeshStandardMaterial({ color: 11111254, roughness: 0.53, metalness: 0.65 })
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = "gap-edge-r1-" + key;
    if (key === "graphite" || key === "steel") mat.userData.slabFinish = true;
  }
  function mesh(name, geometry, mat, x, y, z) {
    const m = new THREE.Mesh(geometry, mats[mat]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  function box(name, x, y, z, w, h, l, mat) {
    return mesh(name, new THREE.BoxGeometry(w, h, l), mat, x, y, z);
  }
  function top(name, x, z, w, l, y, mat) {
    const g = new THREE.PlaneGeometry(w, l);
    g.rotateX(-Math.PI / 2);
    return mesh(name, g, mat, x, y, z);
  }
  function face(name, x, y, z, w, h, mat) {
    const g = new THREE.PlaneGeometry(w, h);
    g.rotateY(Math.PI);
    return mesh(name, g, mat, x, y, z);
  }
  function bolt(x, y, z) {
    const m = mesh("exposed-flange-fastener", new THREE.CylinderGeometry(0.055, 0.055, 0.035, 6), "steel", x, y, z);
    m.rotation.x = Math.PI / 2;
  }
  const modules = Math.max(1, Math.round(width / 6)), cell = width / modules;
  box("continuous-cut-upper-flange", 0, -0.1, 0.12, width, 0.18, 0.24, "steel");
  box("continuous-cut-lower-flange", 0, -0.85, 0.14, width, 0.13, 0.28, "steel");
  face("recessed-cut-web-backing", 0, -0.48, 0.3, width, 0.65, "dark");
  for (let i = 0; i < modules; i++) {
    const x = -width / 2 + (i + 0.5) * cell, w = cell - 0.065;
    top("ivory-cut-edge-cap", x, 0.1, w, 0.18, 2e-3, "ivory");
    face("inset-web-replacement-plate", x, -0.48, 0.275, w - 0.36, 0.48, i % 3 === 1 ? "steel" : "graphite");
    for (const dx of [-w / 2 + 0.2, w / 2 - 0.2]) {
      box("bolted-ivory-flange-seat", x + dx, -0.48, 0.125, 0.22, 0.62, 0.22, "ivory");
      for (const y of [-0.3, -0.65]) bolt(x + dx, y, -2e-3 + 0.045);
    }
    if (i === 0 || i === modules - 1) for (const dx of [-0.5, 0.5]) {
      const pipe = mesh("sealed-pipe-end-coupling", new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12), "steel", x + dx, -0.48, 0.16);
      pipe.rotation.x = Math.PI / 2;
      const cap = mesh("sealed-pipe-end-disc", new THREE.CircleGeometry(0.145, 12), "graphite", x + dx, -0.48, 0.042);
      cap.rotation.y = Math.PI;
      mesh("pipe-cap-retaining-ring", new THREE.TorusGeometry(0.157, 0.023, 5, 12), "brass", x + dx, -0.48, 0.036);
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) bolt(x + dx + Math.cos(a) * 0.156, -0.48 + Math.sin(a) * 0.156, 0.012);
    }
  }
  for (const side of finishedSides ? [-1, 1] : []) {
    top("terminated-ivory-shoulder-trim", side * (width / 2 - 0.12), GAP_EDGE_DEPTH / 2, 0.24, GAP_EDGE_DEPTH, 3e-3, "ivory");
    box("short-exposed-side-fascia", side * (width / 2 - 0.045), -0.46, GAP_EDGE_DEPTH / 2, 0.09, 0.9, GAP_EDGE_DEPTH, "graphite");
    box("sealed-edge-beam-cap", side * (width / 2 - 0.14), -0.47, 0.09, 0.28, 0.87, 0.18, "ivory");
  }
  root.add(generate(THREE, { kind, width, length: GAP_EDGE_DEPTH }));
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry.applyMatrix4(child.matrixWorld);
    if (kind === "landing") {
      const p = child.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, -p.getZ(i));
      const idx = child.geometry.index;
      if (idx) for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1);
        idx.setX(i + 1, idx.getX(i + 2));
        idx.setX(i + 2, b);
      }
    }
    child.position.set(0, 0, 0);
    child.rotation.set(0, 0, 0);
    child.scale.set(1, 1, 1);
    child.geometry.computeVertexNormals();
  });
  root.traverse((child) => {
    if (!child.isMesh) {
      child.position.set(0, 0, 0);
      child.rotation.set(0, 0, 0);
      child.scale.set(1, 1, 1);
    }
  });
  root.userData = { revision: "11-flat-edge-r2", kind, width, depth: GAP_EDGE_DEPTH, visibleThickness: 0.915 };
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
  return groundOrigin(THREE, generate2(THREE, options));
}
