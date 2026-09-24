// 404 route B, agent-authored from docs/art/track/01-flat.png. No textures or external models.
export default function generate(THREE) {
  const kind = 'offset', g = new THREE.Group(); g.name = `pipe-${kind}-r1`;
  const materials = {
    pipe: new THREE.MeshStandardMaterial({ color: 0x68757b, metalness: 0.65, roughness: 0.44, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x28333a, metalness: 0.45, roughness: 0.7 }),
    collar: new THREE.MeshStandardMaterial({ color: 0xa5ada9, metalness: 0.55, roughness: 0.45 }),
    handle: new THREE.MeshStandardMaterial({ color: 0x9a6d4c, metalness: 0.35, roughness: 0.65 }),
  };
  for (const [name, m] of Object.entries(materials)) m.name = `pipe-${name}`;
  function add(name, geo, material, x, y, z) {
    const mesh = new THREE.Mesh(geo, materials[material]); mesh.name = name;
    mesh.position.set(x, y, z); g.add(mesh); return mesh;
  }
  function box(name, x, y, z, w, h, d, material) {
    return add(name, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  }
  function sleeve(x, z, radius = 0.16, length = 0.26) {
    const m = add('connector-collar', new THREE.CylinderGeometry(radius, radius, length, 12), 'collar', x, 0.22, z);
    m.rotation.x = Math.PI / 2;
  }
  for (const x of [-0.68, 0, 0.68]) {
    // Small, parallel doglegs return to identical sockets at both ends.
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.22, -12), new THREE.Vector3(x, 0.22, -5),
      new THREE.Vector3(x + (kind === 'offset' ? 0.18 : 0), 0.22, -2),
      new THREE.Vector3(x + (kind === 'offset' ? 0.18 : 0), 0.22, 2),
      new THREE.Vector3(x, 0.22, 5), new THREE.Vector3(x, 0.22, 12),
    ]);
    add('exposed-pipe', new THREE.TubeGeometry(path, 32, 0.12, 10, false), 'pipe', 0, 0, 0);
    for (const z of [-11.55, 11.55]) sleeve(x, z);
    if (kind === 'coupling') {
      for (const z of [-0.48, 0.48]) sleeve(x, z, 0.18, 0.24);
      const m = add('coupling-body', new THREE.CylinderGeometry(0.16, 0.16, 0.74, 8), 'dark', x, 0.22, 0);
      m.rotation.x = Math.PI / 2;
    }
  }
  for (const z of [-8, 8]) {
    box('visible-support-saddle', 0, 0.045, z, 2.12, 0.09, 0.46, 'dark');
    for (const x of [-0.68, 0, 0.68]) sleeve(x, z, 0.145, 0.16);
  }
  if (kind === 'start' || kind === 'end') {
    const z = kind === 'start' ? 11.72 : -11.72;
    box(kind === 'start' ? 'socket-bulkhead' : 'sealed-end-bulkhead', 0, 0.21, z, 2.12, 0.42, 0.5, 'dark');
    for (const x of [-0.68, 0, 0.68]) {
      sleeve(x, z + (kind === 'start' ? -0.32 : 0.32), 0.185, 0.16);
      const cap = add('sealed-pipe-cap', new THREE.CylinderGeometry(0.125, 0.125, 0.04, 12), 'dark', x, 0.22, kind === 'start' ? 11.98 : -11.98);
      cap.rotation.x = Math.PI / 2;
    }
  }
  if (kind === 'valve') {
    for (const x of [-0.68, 0.68]) {
      box('valve-housing', x, 0.24, 0, 0.38, 0.27, 0.72, 'dark');
      add('valve-stem', new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), 'collar', x, 0.37, 0);
      box('valve-handle', x, 0.42, 0, 0.48, 0.035, 0.1, 'handle');
      for (const z of [-0.55, 0.55]) sleeve(x, z);
    }
  }
  g.userData = { category: '02', revision: 'r1', kind, length: 24, mountY: 0.15,
    description: 'Shallow exposed three-pipe service insert; identical end sockets; no concealed machinery.' };
  return g;
}

