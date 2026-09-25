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

// public/assets/track/gap-border-r1.js
function generate(THREE, { length = 12.5 } = {}) {
  const root = new THREE.Group();
  root.name = "partial-gap-illuminated-border";
  const mats = {
    ivory: new THREE.MeshStandardMaterial({ color: 13027779, roughness: 0.57, metalness: 0.25 }),
    steel: new THREE.MeshStandardMaterial({ color: 6715005, roughness: 0.4, metalness: 0.72 }),
    dark: new THREE.MeshStandardMaterial({ color: 1120543, roughness: 0.8 }),
    light: new THREE.MeshStandardMaterial({ color: 16774622, emissive: 16773842, emissiveIntensity: 2.3, toneMapped: false })
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = "gap-border-r1-" + key;
    if (key === "steel") mat.userData.slabFinish = true;
  }
  function box(name, x, y, z, w, h, l, key) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mats[key]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
  }
  box("cut-side-recessed-web", 0.1, -0.47, 0, 0.2, 0.77, length, "dark");
  box("cut-side-lower-flange", 0.12, -0.85, 0, 0.24, 0.13, length, "steel");
  box("border-recess-floor", 0.32, -0.18, 0, 0.64, 0.06, length, "dark");
  box("flush-border-ivory-rail", 0.12, -0.035, 0, 0.24, 0.07, length, "ivory");
  const count = Math.max(1, Math.ceil(length / 2.5)), cell = length / count;
  for (let i = 0; i < count; i++) {
    const z = -length / 2 + (i + 0.5) * cell, l = cell - 0.08;
    box("replaceable-side-web", 0.025, -0.46, z, 0.045, 0.57, l, "steel");
    box("side-web-fastener-seat", 0.06, -0.46, z - l / 2 + 0.08, 0.12, 0.72, 0.12, "ivory");
    box("border-optical-well", 0.43, -0.13, z, 0.38, 0.1, l, "dark");
    for (const x of [0.265, 0.595]) box("border-light-bezel", x, -0.055, z, 0.05, 0.11, l, "steel");
    for (const s of [-1, 1]) box("border-light-end-cap", 0.43, -0.055, z + s * (l / 2 - 0.07), 0.38, 0.11, 0.14, "ivory");
    const tiles = Math.max(1, Math.floor(l / 0.65)), usable = l - 0.34;
    for (let j = 0; j < tiles; j++) box("recessed-border-light-tile", 0.43, -0.042, z - usable / 2 + (j + 0.5) * usable / tiles, 0.25, 0.024, usable / tiles - 0.04, "light");
    for (const x of [0.12, 0.43]) for (const s of [-1, 1]) {
      const bolt = new THREE.Mesh(topCylinder(THREE, 0.032, 0.012, 6), mats.steel);
      bolt.name = "flush-border-fastener";
      bolt.position.set(x, -3e-3, z + s * (l / 2 - 0.08));
      root.add(bolt);
    }
  }
  root.userData = { width: 0.64, length, depth: 0.915, lightRecess: 0.03 };
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
