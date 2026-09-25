// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/geometry-cleanup.js
function exposedBacking(width, length, covers, emit) {
  const left = -width / 2, right = width / 2, near = -length / 2, far = length / 2;
  const cuts = [.../* @__PURE__ */ new Set([near, far, ...covers.flatMap((r) => [Math.max(near, r[2]), Math.min(far, r[3])])])].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], middle = (a + b) / 2;
    if (b <= a) continue;
    const occupied = covers.filter((r) => r[2] < middle && r[3] > middle).sort((a2, b2) => a2[0] - b2[0]);
    let x = left;
    for (const r of occupied) {
      const end = Math.min(right, r[0]);
      if (end > x) emit((x + end) / 2, middle, end - x, b - a);
      x = Math.max(x, Math.min(right, r[1]));
    }
    if (x < right) emit((x + right) / 2, middle, right - x, b - a);
  }
}

// public/assets/track/slab-surface-r1.js
function surfaceMaps() {
  return { userData: { recipeSurface: true } };
}
function generate(THREE, { width = 36, length = 100, columns = 6, index = 0 } = {}) {
  const root = new THREE.Group();
  root.name = "brushed-slab-candidate-r1";
  const textures = surfaceMaps(THREE);
  const mats = {};
  for (const [name, color, roughness, metalness] of [
    ["graphite", 4541264, 0.48, 0.72],
    ["worn", 5330522, 0.56, 0.66],
    ["replacement", 6449260, 0.39, 0.78],
    ["edge", 7633789, 0.35, 0.8]
  ]) {
    mats[name] = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...textures, normalScale: new THREE.Vector2(0.32, 0.32), envMapIntensity: 0.85 });
    mats[name].userData.slabFinish = true;
  }
  mats.joint = new THREE.MeshStandardMaterial({ color: 1120542, roughness: 0.86 });
  mats.fastener = new THREE.MeshStandardMaterial({ color: 6779254, roughness: 0.4, metalness: 0.75 });
  mats.fastener.userData.slabFinish = true;
  mats.ivory = new THREE.MeshStandardMaterial({ color: 13027779, roughness: 0.57, metalness: 0.25 });
  for (const [name, mat] of Object.entries(mats)) mat.name = "slab-r1-" + name;
  function patch(name, a, b, c, d, material) {
    const across = Math.max(1, Math.ceil(Math.hypot(...a.map((v, i) => d[i] - v)) / 0.3));
    const along = Math.max(1, Math.ceil(Math.hypot(...a.map((v, i) => b[i] - v)) / 1));
    const p = [], uv = [], idx = [];
    for (let j = 0; j <= along; j++) for (let i = 0; i <= across; i++) {
      const u = i / across, v = j / along, q = a.map((_, k) => a[k] * (1 - u) * (1 - v) + d[k] * u * (1 - v) + b[k] * (1 - u) * v + c[k] * u * v);
      p.push(...q);
      uv.push(q[0] / 2, q[2] / 4);
    }
    for (let j = 0; j < along; j++) for (let i = 0; i < across; i++) {
      const n = j * (across + 1) + i, t = n + across + 1;
      idx.push(n, t, n + 1, t, t + 1, n + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mats[material]);
    mesh.name = name;
    root.add(mesh);
  }
  function face(name, x, z, w, l, y, mat) {
    patch(name, [x - w / 2, y, z - l / 2], [x - w / 2, y, z + l / 2], [x + w / 2, y, z + l / 2], [x + w / 2, y, z - l / 2], mat);
  }
  const covered = [];
  function plate(x, z, w, l, top, mat, bolts = false) {
    const bevel = 0.065, base = -0.085;
    const inset = bevel + 0.02;
    covered.push([x - w / 2 + inset, x + w / 2 - inset, z - l / 2 + inset, z + l / 2 - inset]);
    face("brushed-metal-plate", x, z, w - bevel * 2, l - bevel * 2, top, mat);
    const outer = [[-w / 2, -l / 2], [-w / 2, l / 2], [w / 2, l / 2], [w / 2, -l / 2]];
    const inner = outer.map(([a, b]) => [a - Math.sign(a) * bevel, b - Math.sign(b) * bevel]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      patch(
        "machined-slab-bevel",
        [x + outer[i][0], base, z + outer[i][1]],
        [x + outer[j][0], base, z + outer[j][1]],
        [x + inner[j][0], top, z + inner[j][1]],
        [x + inner[i][0], top, z + inner[i][1]],
        "edge"
      );
    }
    if (bolts) for (const dx of [-w / 2 + 0.25, w / 2 - 0.25]) for (const dz of [-l / 2 + 0.3, l / 2 - 0.3]) {
      face("fastener-dark-seat", x + dx, z + dz, 0.2, 0.25, top + 1e-3, "joint");
      face("flush-captive-fastener", x + dx, z + dz, 0.11, 0.15, top + 3e-3, "fastener");
      face("fastener-driver-slot", x + dx, z + dz, 0.065, 0.023, top + 4e-3, "joint");
    }
  }
  const cell = width / columns;
  for (let col = 0; col < columns; col++) for (let row = 0, at = 0; at < length; row++) {
    const remaining = length - at, span = remaining > 12.5 && remaining < 14.5 ? remaining : Math.min(12.5, remaining);
    const x = -width / 2 + (col + 0.5) * cell, z = length / 2 - at - span / 2;
    const kind = (col * 3 + row + index * 2) % 5, w = cell - 0.055, l = span - 0.065;
    if (kind === 0) {
      const narrow = w * 0.24, gap = 0.055, main = w - narrow - gap;
      plate(x - (narrow + gap) / 2, z, main, l, -0.012, "graphite", true);
      plate(x + (main + gap) / 2, z, narrow, l, -0.03, "replacement", false);
    } else if (kind === 3) {
      const short = l * 0.3, gap = 0.055, long = l - short - gap;
      plate(x, z - (short + gap) / 2, w, long, -0.018, "worn", false);
      plate(x, z + (long + gap) / 2, w, short, -6e-3, "replacement", true);
    } else plate(x, z, w, l, kind === 1 ? -0.028 : -0.012, kind === 2 ? "worn" : "graphite", kind === 4);
    at += span;
  }
  exposedBacking(width, length, covered, (x, z, w, l) => face("slab-recess-floor", x, z, w, l, -0.09, "joint"));
  if (columns === 6) for (const side of [-1, 1]) face("flush-ivory-edge-trim", side * (width / 2 - 0.12), 0, 0.24, length, 2e-3, "ivory");
  root.userData = { length, width, revision: "slab-candidate-r1", depth: 0.09 };
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
