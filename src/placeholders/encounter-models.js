// Primitive encounter silhouettes. Replace through the 404 asset pipeline later.
export function encounterModels(THREE) {
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
  const purple = material(0x9870d4), dark = material(0x202a36), red = material(0xd86b55);
  const orange = new THREE.MeshBasicMaterial({ color: 0xffa638 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x62ffdf });
  function box(g, w, h, d, x, y, z, mat, name) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z); if (name) mesh.name = name; g.add(mesh); return mesh;
  }
  function vehicle(w, d, mat) {
    const g = new THREE.Group();
    box(g, w, 1.2, d, 0, 0.6, 0, mat);
    box(g, w * 0.7, 0.65, d * 0.35, 0, 1.5, d * 0.25, mat);
    for (const side of [-1, 1]) for (const end of [-1, 1]) box(g, 0.3, 0.7, 0.8, side * w / 2, 0.3, end * d * 0.28, dark);
    return g;
  }
  const dart = new THREE.Group();
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 3), purple);
  nose.rotation.x = Math.PI / 2; nose.position.y = 0.55; dart.add(nose);
  box(dart, 1.6, 0.2, 0.55, 0, 0.6, -0.4, purple);
  box(dart, 0.45, 0.2, 0.6, 0, 1, 0, orange, 'signal');
  const interceptor = vehicle(2.5, 4, red);
  box(interceptor, 1.25, 0.8, 0.15, 0, 0.65, -2.05, cyan, 'engine');
  box(interceptor, 0.6, 0.2, 0.6, 0, 1.9, 0, orange, 'signal');
  const minelayer = vehicle(3.2, 4.4, purple);
  box(minelayer, 1.8, 0.8, 0.12, 0, 0.55, -2.25, dark);
  const hauler = vehicle(7.4, 13, purple);
  box(hauler, 6.5, 1.5, 10.5, 0, 2.05, -0.6, purple);
  for (let slot = 0; slot < 3; slot++) {
    box(hauler, 1.9, 1.8, 0.1, -(slot - 1) * 2.55, 1.1, -6.56, dark);
    box(hauler, 1.2, 0.7, 0.13, -(slot - 1) * 2.55, 1.05, -6.65, cyan, `open-${slot}`);
  }
  const lock = new THREE.Group();
  box(lock, 1.55, 1.35, 0.7, 0, 0.85, 0, orange);
  box(lock, 0.5, 0.65, 0.1, 0, 0.9, -0.4, dark);
  return { dart, interceptor, minelayer, hauler, lock, escort: vehicle(2.1, 3.6, purple) };
}
