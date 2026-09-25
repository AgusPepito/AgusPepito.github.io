// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/edge-light-r1.js
function generate(THREE, { length = 12.5, illuminated = true } = {}) {
  const root = new THREE.Group();
  root.name = "roadside-dashed-light-r1";
  const mats = {
    housing: new THREE.MeshStandardMaterial({ color: 1582125, roughness: 0.72, metalness: 0.3 }),
    trim: new THREE.MeshStandardMaterial({ color: 7045259, roughness: 0.5, metalness: 0.65 }),
    lens: new THREE.MeshStandardMaterial({ color: illuminated ? 14086143 : 4411738, emissive: 14086143, emissiveIntensity: illuminated ? 2.5 : 0, roughness: 0.38, metalness: 0 }),
    spill: recipeEffectMaterial(THREE, {
      color: 11395071,
      vertexColors: true,
      transparent: true,
      opacity: illuminated ? 0.12 : 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  };
  for (const [name, material] of Object.entries(mats)) material.name = `roadside-edge-${name}`;
  const box = (name, x, y, z, w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 1, 1, Math.max(1, Math.ceil(d / 2))), mats[material]);
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  box("edge-light-support", 0, 0.045, 0, 1, 0.09, length, "housing");
  for (const x of [-0.455, 0.455]) box("edge-light-outer-trim", x, 0.125, 0, 0.09, 0.11, length, "trim");
  for (const x of [-0.29, 0.29]) box("edge-light-channel-cheek", x, 0.12, 0, 0.09, 0.1, length, "housing");
  for (const z of [-length / 2 + 0.055, length / 2 - 0.055]) box("edge-light-module-joint", 0, 0.135, z, 0.82, 0.07, 0.11, "trim");
  for (const z of [-length / 4, length / 4]) {
    const dashLength = Math.min(3, length * 0.24);
    box("edge-light-recess", 0, 0.104, z, 0.49, 0.028, dashLength + 0.16, "housing");
    box("edge-light-dash", 0, 0.132, z, 0.4, 0.022, dashLength, "lens");
    for (const offset of [-dashLength / 2 - 0.045, dashLength / 2 + 0.045]) box("edge-light-lens-cap", 0, 0.136, z + offset, 0.49, 0.06, 0.09, "trim");
    const geometry = new THREE.PlaneGeometry(2, dashLength + 1.3, 6, 6);
    geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position, colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = Math.abs(p.getX(i)), along = Math.abs(p.getZ(i)) / (dashLength / 2 + 0.65);
      const fade = Math.max(0, 1 - x) ** 2 * Math.max(0, 1 - along * along);
      colors.set([fade, fade, fade], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const glow = new THREE.Mesh(geometry, mats.spill);
    glow.name = "edge-light-soft-spill";
    glow.position.set(0, 0.184, z);
    root.add(glow);
  }
  root.userData = { length, width: 1, height: 0.18, illuminated, role: "neutral-roadside-light" };
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
