// Standalone 404 recipe asset. Procedural geometry, flat-colour materials, ground origin.
// public/assets/track/phase-lane-r1.js
function generate(THREE, { kind = "middle", phase = 0, color = [5104127, 16760405, 14453503][phase], length = 12.5, width = 6.48 } = {}) {
  const root = new THREE.Group();
  root.name = `phase-lane-${kind}-r1`;
  const tone = new THREE.Color(color);
  const mats = {
    bed: new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.19), roughness: 0.67, metalness: 0.35 }),
    light: new THREE.MeshStandardMaterial({ color: tone, emissive: tone, emissiveIntensity: 0.65, roughness: 0.45, metalness: 0.15 }),
    graphite: new THREE.MeshStandardMaterial({ color: 1186851, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 6911867, roughness: 0.6, metalness: 0.45 }),
    ivory: new THREE.MeshStandardMaterial({ color: 12041398, roughness: 0.65, metalness: 0.2 })
  };
  for (const [key, mat] of Object.entries(mats)) {
    mat.name = `lane-r1-${key}-${key === "bed" || key === "light" ? color : "neutral"}`;
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
  }
  function panel(name, x, z, w, l, y, material) {
    const geo = new THREE.PlaneGeometry(w, l, Math.max(1, Math.ceil(w / 0.4)), Math.max(1, Math.ceil(l / 2)));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mats[material]);
    mesh.name = name;
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }
  panel("active-phase-bed", 0, 0, width, length, 0.012, "bed");
  for (const side of [-1, 1]) {
    panel("recess-shadow-gutter", side * (width / 2 + 0.11), 0, 0.22, length, 0.013, "graphite");
    const bevel = panel("flush-beveled-edge", side * (width / 2 + 0.2), 0, 0.12, length, 0.015, "steel");
    const p = bevel.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, -side * p.getX(i) * 0.1);
    bevel.geometry.computeVertexNormals();
    panel("phase-boundary-light", side * (width / 2 - 0.075), 0, 0.15, length, 0.022, "light");
  }
  for (let z = -length / 2 + 2.5; z < length / 2 - 0.5; z += 2.5) {
    panel("inset-panel-seam", 0, z, width - 0.34, 0.045, 0.016, "graphite");
    panel("phase-flow-tick", 0, z + 0.45, 0.18, 0.75, 0.021, "light");
  }
  if (kind === "start" || kind === "end") {
    const sign = kind === "start" ? 1 : -1;
    panel("phase-active-end-line", 0, sign * (length / 2 - 0.07), width, 0.14, 0.023, "light");
    for (const side of [-1, 1]) {
      panel("endpoint-ivory-lock", side * (width / 2 + 0.11), sign * (length / 2 - 0.4), 0.19, 0.8, 0.026, "ivory");
      panel("endpoint-fastener", side * (width / 2 + 0.11), sign * (length / 2 - 0.4), 0.07, 0.12, 0.028, "graphite");
    }
    const shape = new THREE.Shape();
    if (phase === 1) {
      shape.moveTo(0, 0.52);
      shape.lineTo(-0.5, -0.36);
      shape.lineTo(0.5, -0.36);
    } else {
      shape.moveTo(0, 0.5);
      shape.lineTo(-0.43, 0);
      shape.lineTo(0, -0.5);
      shape.lineTo(0.43, 0);
    }
    shape.closePath();
    const geometry = phase === 0 ? new THREE.CircleGeometry(0.43, 20) : new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const badge = new THREE.Mesh(geometry, mats.light);
    badge.name = "phase-endpoint-symbol";
    badge.position.set(0, 0.025, sign * (length / 2 - 1.35));
    root.add(badge);
  }
  root.userData = {
    revision: "06-r1",
    kind,
    phase,
    length,
    activeWidth: width,
    visibility: "Flush top surfaces and millimetric bevels only; no collision or hidden machinery."
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
