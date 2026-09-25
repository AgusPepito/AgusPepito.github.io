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
var topCylinder = (THREE, radius, height, sides) => omitFaces(THREE, new THREE.CylinderGeometry(radius, radius, height, sides), 1, -1);

// public/assets/track/tube-service-belt-r2.js
var SERVICE_BELT_LENGTH = 12;
var patterns = {
  mixed: ["access", "armor", "pipe", "armor", "cooling", "armor"],
  pipe: ["pipe", "pipe", "armor", "access", "pipe", "armor"],
  cooling: ["cooling", "armor", "cooling", "cooling", "access", "armor"],
  access: ["access", "access", "armor", "access", "cooling", "armor"],
  armor: ["armor", "armor", "armor", "access", "armor", "armor"]
};
function generate(THREE, { radius = 18, length = SERVICE_BELT_LENGTH, variant = "mixed", offset = 0, columns = 24, articulated = false } = {}) {
  const root = new THREE.Group();
  root.name = `ivory-service-belt-r2-${variant}`;
  const pattern = patterns[variant] || patterns.mixed;
  const circumference = 2 * Math.PI * radius, cell = circumference / columns;
  const mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13092533, roughness: 0.57, metalness: 0.25 }),
    replacement: new THREE.MeshStandardMaterial({ color: 14210758, roughness: 0.64, metalness: 0.18 }),
    aged: new THREE.MeshStandardMaterial({ color: 11055014, roughness: 0.7, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: 1055522, roughness: 0.84 }),
    steel: new THREE.MeshStandardMaterial({ color: 6716031, roughness: 0.42, metalness: 0.72 }),
    edge: new THREE.MeshStandardMaterial({ color: 9741474, roughness: 0.43, metalness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 11111254, roughness: 0.53, metalness: 0.65 }),
    lamp: new THREE.MeshStandardMaterial({ color: 15195330, emissive: 15195330, emissiveIntensity: 0.55, roughness: 0.6 })
  };
  for (const [key, mat] of Object.entries(mats)) mat.name = "belt-r2-" + key;
  let family = "armor", column = 0;
  function mesh(name, geometry, material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, mats[material]);
    m.name = name;
    m.position.set(x, y, z);
    m.userData.serviceFamily = family;
    m.userData.serviceColumn = column;
    root.add(m);
    return m;
  }
  function skin(name, x, z, w, l, y, material) {
    const g = new THREE.PlaneGeometry(w, l, Math.max(1, Math.ceil(w / 0.2)), Math.max(1, Math.ceil(l / 0.5)));
    g.rotateX(-Math.PI / 2);
    return mesh(name, g, material, x, y, z);
  }
  function box(name, x, y, z, w, h, l, material) {
    const g = new THREE.BoxGeometry(w, h, l, Math.max(1, Math.ceil(w / 0.2)), 1, Math.max(1, Math.ceil(l / 0.5)));
    if (["bolted-identification-plaque", "broad-hatch-hinge", "quarter-turn-door-lock", "hatch-reinforcement-strap", "additional-quarter-turn-lock"].includes(name)) omitFaces(THREE, g, 1, -1);
    return mesh(name, g, material, x, y, z);
  }
  function quad(name, a, b, c, d, material) {
    const along = Math.max(1, Math.ceil(Math.hypot(...a.map((v, i) => d[i] - v)) / 0.2));
    const across = Math.max(1, Math.ceil(Math.hypot(...a.map((v, i) => b[i] - v)) / 0.3));
    const p = [], indices = [];
    for (let j = 0; j <= across; j++) for (let i = 0; i <= along; i++) {
      const u = i / along, v = j / across;
      for (let k = 0; k < 3; k++) p.push(a[k] * (1 - u) * (1 - v) + d[k] * u * (1 - v) + b[k] * (1 - u) * v + c[k] * u * v);
    }
    for (let j = 0; j < across; j++) for (let i = 0; i < along; i++) {
      const n = j * (along + 1) + i, t = n + along + 1;
      indices.push(n, t, n + 1, t, t + 1, n + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(p.length / 3 * 2), 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(name, g, material);
  }
  function ring(name, x, z, outerW, outerL, innerW, innerL, top, bottom, material) {
    const o = [[-outerW / 2, -outerL / 2], [-outerW / 2, outerL / 2], [outerW / 2, outerL / 2], [outerW / 2, -outerL / 2]];
    const n = [[-innerW / 2, -innerL / 2], [-innerW / 2, innerL / 2], [innerW / 2, innerL / 2], [innerW / 2, -innerL / 2]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quad(
        name,
        [x + o[i][0], top, z + o[i][1]],
        [x + o[j][0], top, z + o[j][1]],
        [x + n[j][0], bottom, z + n[j][1]],
        [x + n[i][0], bottom, z + n[i][1]],
        material
      );
    }
  }
  function bolt(x, z, y = 0.07) {
    mesh("captive-hex-bolt", topCylinder(THREE, 0.065, 0.055, 6), "edge", x, y, z);
  }
  const glyphs = { P: ["110", "101", "110", "100", "100"], C: ["111", "100", "100", "100", "111"], A: ["010", "101", "111", "101", "101"] };
  function stencil(x, z, letter) {
    box("bolted-identification-plaque", x + 0.085, -0.01, z + 0.17, 0.36, 0.14, 0.54, "aged");
    for (const [row, bits] of glyphs[letter].entries()) for (let col = 0; col < 3; col++) if (bits[col] === "1") skin("panel-function-stencil", x + col * 0.085, z + row * 0.085, 0.07, 0.07, 0.064, "dark");
  }
  for (let i = 0; i < columns; i++) {
    column = i;
    const x = -circumference / 2 + (i + 0.5) * cell, w = cell - 0.045;
    family = pattern[((i + offset) % pattern.length + pattern.length) % pattern.length];
    const ivory = i % 7 === 1 ? "replacement" : i % 7 === 4 ? "aged" : "ivory";
    skin("armor-panel-joint", x, 0, cell, 6, -0.025, "dark");
    if (family === "pipe" || family === "cooling") {
      const joint = root.children[root.children.length - 1];
      root.remove(joint);
      joint.geometry.dispose();
      ring("outer-joint-gasket", x, 0, cell, 6, w - 0.04, 5.91, -0.025, -0.025, "dark");
      ring("chamfered-ivory-tray-frame", x, 0, w, 5.94, w - 1.05, 4.45, 0.045, -0.12, ivory);
      ring("machined-tray-inner-bevel", x, 0, w - 1.05, 4.45, w - 1.23, 4.27, -0.12, -0.23, "edge");
      ring("deep-recess-walls", x, 0, w - 1.23, 4.27, w - 1.23, 4.27, -0.23, -0.7, "dark");
      skin("recess-floor", x, 0, w - 1.23, 4.27, -0.7, "dark");
      if (family === "pipe") {
        for (const dx of variant === "pipe" ? [-0.78, 0.78] : [-0.94, 0, 0.94]) {
          const pipeRadius = variant === "pipe" ? 0.23 : 0.17;
          const pipe = mesh("broad-service-conduit", new THREE.CylinderGeometry(pipeRadius, pipeRadius, articulated ? 3.6 : 3.96, 10, 4), "steel", x + dx, -0.43, 0);
          pipe.rotation.x = Math.PI / 2;
          for (const z of [-1.37, 1.37]) {
            const collar = mesh("stepped-conduit-coupling", new THREE.CylinderGeometry(0.235, 0.235, 0.44, 10), "edge", x + dx, -0.43, z);
            collar.rotation.x = Math.PI / 2;
            for (const dz of [-0.21, 0.21]) {
              const seal = mesh("coupling-retaining-ring", new THREE.CylinderGeometry(0.25, 0.25, 0.065, 10), "brass", x + dx, -0.43, z + dz);
              seal.rotation.x = Math.PI / 2;
            }
          }
        }
        for (const z of [-0.86, 0.86]) box("recessed-pipe-retaining-strap", x, -0.18, z, w - 1.25, 0.085, 0.16, "aged");
        if (variant !== "pipe") {
          box("offset-valve-block", x + 0.94, -0.23, 0.28, 0.46, 0.21, 0.49, "dark");
          box("valve-access-handle", x + 0.94, -0.085, 0.28, 0.35, 0.075, 0.13, "brass");
        }
        if (variant === "pipe") {
          box("twin-feed-manifold", x, -0.39, -1.82, w - 1.4, 0.38, 0.42, "edge");
          box("manifold-identification-inset", x, -0.192, -1.82, 0.68, 0.012, 0.23, "dark");
          for (const dx of [-0.78, 0.78]) {
            box("manifold-valve-housing", x + dx, -0.27, -0.3, 0.53, 0.28, 0.52, "aged");
            const wheel = mesh("recessed-valve-wheel", new THREE.TorusGeometry(0.19, 0.045, 6, 12), "brass", x + dx, -0.09, -0.3);
            wheel.rotation.x = Math.PI / 2;
            box("valve-wheel-crossbar", x + dx, -0.09, -0.3, 0.34, 0.06, 0.06, "brass");
          }
        }
        stencil(x - w / 2 + 0.18, -2.7, "P");
      } else {
        if (variant === "cooling") {
          for (const side of [-1, 1]) for (let z = -1.82; z < 1.95; z += 0.43) {
            const blade = box("split-bank-cooling-louver", x + side * 0.88, -0.3, z, 1.38, 0.1, 0.36, "steel");
            blade.rotation.x = side * 0.48;
          }
          box("cooling-bank-divider", x, -0.2, 0, 0.22, 0.28, 4.12, "edge");
          for (const z of [-1.72, 1.72]) box("cooling-bank-end-brace", x, -0.13, z, w - 1.35, 0.1, 0.14, "aged");
          for (let dx = -0.13; dx <= 0.14; dx += 0.13) box("central-heat-sink-fin", x + dx, -0.085, 0, 0.035, 0.09, 2.65, "brass");
        } else for (let z = -1.84; z < 2; z += 0.43) {
          const blade = box("deep-cooling-louver", x, -0.25, z, w - 1.3, 0.1, 0.38, "steel");
          blade.rotation.x = -0.42;
        }
        for (const dx of [-0.95, 0.95]) box("cooling-cartridge-spine", x + dx, -0.15, 0, 0.105, 0.15, 4.1, "aged");
        for (const dx of [-w / 2 + 0.73, w / 2 - 0.73]) box("cooling-release-catch", x + dx, -0.055, 1.79, 0.19, 0.1, 0.35, "brass");
        stencil(x - w / 2 + 0.18, -2.7, "C");
      }
    } else if (family === "access") {
      const joint = root.children[root.children.length - 1];
      root.remove(joint);
      joint.geometry.dispose();
      ring("outer-joint-gasket", x, 0, cell, 6, w - 0.04, 5.91, -0.025, -0.025, "dark");
      ring("access-armor-bevel", x, 0, w, 5.94, w - 0.42, 5.52, 0.02, 0.052, ivory);
      ring("access-door-seal", x, 0, w - 0.42, 5.52, w - 0.65, 5.28, 0.013, 0.013, "dark");
      const doorW = w - 0.65;
      skin("narrow-replacement-door", x + doorW * 0.34, 0, doorW * 0.29, 5.28, 0.036, "replacement");
      const left = x - doorW * 0.155, leftW = doorW * 0.68, pocketZ = 0.45, pocketL = 0.72, pocketW = 0.86;
      const front = 2.64, back = -2.64;
      skin("main-access-door-forward", left, (pocketZ + pocketL / 2 + front) / 2, leftW, front - pocketZ - pocketL / 2, 0.035, ivory);
      skin("main-access-door-aft", left, (back + pocketZ - pocketL / 2) / 2, leftW, pocketZ - pocketL / 2 - back, 0.035, ivory);
      for (const side of [-1, 1]) skin("main-access-door-pocket-side", left + side * (leftW + pocketW) / 4, pocketZ, (leftW - pocketW) / 2, pocketL, 0.035, ivory);
      ring("handle-pocket-bevel", left, pocketZ, pocketW, pocketL, pocketW - 0.16, pocketL - 0.16, 0.035, -0.16, "edge");
      skin("handle-pocket", left, pocketZ, pocketW - 0.16, pocketL - 0.16, -0.16, "dark");
      box("recessed-door-handle", left, -0.07, pocketZ, 0.5, 0.1, 0.12, "edge");
      for (const z of [-1.7, 1.7]) {
        box("broad-hatch-hinge", x - w / 2 + 0.42, 0.053, z, 0.25, 0.085, 0.57, "steel");
        box("quarter-turn-door-lock", x + w / 2 - 0.42, 0.053, z, 0.18, 0.065, 0.36, "brass");
      }
      if (variant === "access") {
        for (const z of [-1.23, 1.7]) {
          box("hatch-reinforcement-strap", left, 0.057, z, leftW - 0.18, 0.04, 0.17, "aged");
          for (const dx of [-leftW / 2 + 0.22, leftW / 2 - 0.22]) bolt(left + dx, z, 0.09);
        }
        for (const z of [-0.85, 0.85]) box("additional-quarter-turn-lock", x + w / 2 - 0.42, 0.053, z, 0.18, 0.065, 0.36, "brass");
        skin("replacement-door-label-seat", x + doorW * 0.34, -0.9, 0.63, 0.65, 0.048, "aged");
        for (let row = 0; row < 3; row++) skin("hatch-identification-bar", x + doorW * 0.34, -1.07 + row * 0.16, 0.4 - row * 0.08, 0.055, 0.051, "dark");
      }
      stencil(x - w / 2 + 0.24, -2.53, "A");
    } else {
      ring("quiet-armor-edge-bevel", x, 0, w, 5.94, w - 0.36, 5.58, 0.02, 0.055, ivory);
      skin("quiet-curved-ivory-plate", x, 0, w - 0.36, 5.58, 0.055, ivory);
      skin("offset-plate-seam", x + 0.67, 0, 0.06, 5.5, 0.058, "dark");
      if (variant === "armor") {
        if (i % 3 === 0) {
          skin("broad-replacement-armor-inlay", x - 0.62, 0.35, 2.08, 3.45, 0.064, "replacement");
          for (const dx of [-0.82, 0.82]) for (const z of [-1.18, 1.88]) bolt(x - 0.62 + dx, z, 0.09);
        }
        if (i % 4 === 0) {
          skin("inspection-marker-gasket", x - 0.62, -1.67, 1.04, 0.26, 0.064, "dark");
          skin("neutral-service-marker", x - 0.62, -1.67, 0.66, 0.1, 0.068, "lamp");
        }
      } else {
        skin("replacement-inspection-plate", x - 0.62, 0.7, 1.25, 1.6, 0.064, "aged");
        for (const dz of [-0.63, 0.63]) bolt(x - 0.62, 0.7 + dz, 0.095);
        skin("inspection-marker-gasket", x - 0.62, -1.67, 1.04, 0.26, 0.064, "dark");
        skin("neutral-service-marker", x - 0.62, -1.67, 0.66, 0.1, 0.068, "lamp");
      }
    }
    for (const dx of [-w / 2 + 0.2, w / 2 - 0.2]) for (const z of [-2.67, 2.67]) bolt(x + dx, z);
    for (const z of [-2.87, 2.87]) skin("edge-locking-seat", x + 0.6, z, 0.48, 0.14, 0.057, "steel");
  }
  root.scale.z = length / 6;
  for (const part of root.children) if (part.name === "captive-hex-bolt") part.scale.z = 6 / length;
  root.userData = {
    revision: "tube-service-r2",
    variant,
    offset,
    length,
    radius,
    depth: 0.7,
    visibility: "Ivory armor, open mechanical trays, louvers and access doors. No equipment behind closed armor; no hidden tube skeleton."
  };
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
