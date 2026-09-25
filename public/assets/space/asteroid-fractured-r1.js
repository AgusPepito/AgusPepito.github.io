// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/space/asteroids-r1.js
function generate(THREE, { variant = 0 } = {}) {
  const geometry = new THREE.IcosahedronGeometry(1, 2), p = geometry.attributes.position;
  const direction = new THREE.Vector3(), seed = variant ? 2.7 : 0.4;
  const craters = [new THREE.Vector3(0.7, 0.5, 0.4).normalize(), new THREE.Vector3(-0.5, 0.3, 0.8).normalize()];
  for (let i = 0; i < p.count; i++) {
    direction.fromBufferAttribute(p, i).normalize();
    const { x, y, z } = direction;
    let radius = 1 + 0.13 * Math.sin(x * 5 + seed) * Math.cos(y * 4 - z * 3) + 0.09 * Math.sin(z * 7 + y * 3 + seed);
    for (const crater of craters) {
      const distance = 1 - direction.dot(crater);
      radius -= 0.2 * Math.exp(-distance * 24);
      radius += 0.04 * Math.exp(-(((distance - 0.12) / 0.05) ** 2));
    }
    if (variant) radius *= 1 - 0.12 * Math.max(0, x + y - 0.3);
    p.setXYZ(i, x * radius * (variant ? 1.35 : 1), y * radius * (variant ? 0.7 : 0.88), z * radius * (variant ? 0.84 : 1.04));
  }
  const colors = new Float32Array(p.count * 3), color = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const grain = 0.5 + 0.5 * Math.sin(x * 37 + y * 53 + z * 29 + seed);
    color.setHex(variant ? 8549736 : 7502725).multiplyScalar(0.7 + grain * 0.4);
    for (let j = 0; j < 3; j++) color.toArray(colors, (i + j) * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({ color: 16777215, vertexColors: false, roughness: 1, metalness: 0.03, flatShading: true });
  material.userData.recipeVertexColors = true;
  material.name = variant ? "asteroid-fractured-r1" : "asteroid-pitted-r1";
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = material.name;
  const root = new THREE.Group();
  root.name = mesh.name;
  root.add(mesh);
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
  return groundOrigin(THREE, generate(THREE, { variant: 1 }));
}
