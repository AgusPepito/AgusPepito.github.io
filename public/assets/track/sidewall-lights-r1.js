// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/sidewall-lights-r1.js
function generate(THREE, { kind = "plain", illuminated = true } = {}) {
  const root = new THREE.Group();
  root.name = "r3-recessed-wall-lights";
  const lean = Math.tan(Math.PI / 6);
  const mats = {
    pocket: new THREE.MeshStandardMaterial({ color: 1056810, roughness: 0.8, metalness: 0.2 }),
    frame: new THREE.MeshStandardMaterial({ color: 7569802, roughness: 0.48, metalness: 0.65 }),
    lens: new THREE.MeshStandardMaterial({ color: 14808063, emissive: 14808063, emissiveIntensity: illuminated ? 2.25 : 0, roughness: 0.4, metalness: 0 })
  };
  for (const [name, material] of Object.entries(mats)) material.name = `roadside-wall-${name}`;
  const ramp = kind === "ramp-start" || kind === "ramp-end", direction = kind === "ramp-start" ? 1 : -1;
  function box(name, x, y, w, h, d, offset, material) {
    const geometry = new THREE.BoxGeometry(w, h, d, Math.max(1, Math.ceil(w / 0.6)), 1, 1);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const px = x + p.getX(i), oldY = y + p.getY(i);
      const factor = ramp ? 0.18 + 0.82 * THREE.MathUtils.clamp((px + 6 * direction) * direction / 8, 0, 1) : 1;
      const newY = oldY * factor;
      p.setXYZ(i, px, newY, 1.4 - newY * lean + offset + p.getZ(i));
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mats[material]);
    mesh.name = name;
    root.add(mesh);
  }
  for (const x of [-3.3, 3.3]) for (const y of [0.31, 3.04]) {
    const height = y > 1 ? 0.16 : 0.1, width = 2.1;
    box("wall-light-recess", x, y, width + 0.18, height + 0.1, 0.06, 0.145, "pocket");
    for (const sign of [-1, 1]) {
      box("wall-light-frame-rail", x, y + sign * (height / 2 + 0.035), width + 0.18, 0.035, 0.055, 0.192, "frame");
      box("wall-light-frame-cap", x + sign * (width / 2 + 0.06), y, 0.055, height + 0.1, 0.055, 0.192, "frame");
    }
    box("wall-light-diffuser", x, y, width, height, 0.018, 0.183, "lens");
  }
  root.userData = { kind, illuminated, role: "neutral-wall-light" };
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
