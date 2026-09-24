// Recipe route B: agent-authored, following docs/art/track/01-flat.png.
export default function generate(THREE) {
  const kind = 'reinforced', g = new THREE.Group(); g.name = 'grille-' + kind + '-r1';
  const materials = {
    frame: new THREE.MeshStandardMaterial({ color: 0x879591, metalness: 0.45, roughness: 0.55 }),
    slat: new THREE.MeshStandardMaterial({ color: 0x535f65, metalness: 0.55, roughness: 0.55 }),
    recess: new THREE.MeshStandardMaterial({ color: 0x111920, roughness: 0.95 }),
  };
  for (const [name, m] of Object.entries(materials)) m.name = 'grille-' + name;
  function box(name, x, y, z, w, h, length, material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, length, 1, 1, Math.max(1, Math.ceil(length / 2))), materials[material]);
    m.name = name; m.position.set(x, y, z); g.add(m); return m;
  }
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 23.4, 1, 12), materials.recess);
  backing.rotation.x = -Math.PI / 2; backing.name = 'shallow-dark-backing'; g.add(backing);
  for (const x of [-1.01, 1.01]) box('longitudinal-frame', x, 0.22, 0, 0.1, 0.36, 23.4, 'frame');
  for (const z of [-11.6, 11.6]) box('panel-end-trim', 0, 0.22, z, 2.12, 0.36, 0.2, 'frame');
  if (kind === 'start' || kind === 'end') {
    const z = kind === 'start' ? 10.9 : -10.9;
    box(kind + '-closing-frame', 0, 0.2, z, 2.12, 0.4, 1.3, 'frame');
  }
  const louver = kind === 'louver';
  for (let z = -10.8; z <= 10.8; z += louver ? 0.95 : 1.2) {
    const slat = box(louver ? 'angled-louver' : 'cross-grate', 0, 0.25, z, 1.92, 0.07, louver ? 0.56 : 0.15, 'slat');
    if (louver) slat.rotation.x = 0.32;
  }
  if (!louver) for (const x of [-0.48, 0, 0.48]) box('lattice-runner', x, 0.26, 0, 0.09, 0.09, 22.9, 'slat');
  if (kind === 'reinforced') for (const z of [-7.2, 0, 7.2]) {
    box('heavy-cross-brace', 0, 0.32, z, 1.94, 0.16, 0.55, 'frame');
    box('center-spine', 0, 0.33, z, 0.24, 0.14, 6.8, 'frame');
  }
  g.userData = { category: '03', revision: 'r1', kind, length: 24, mountY: 0.15, description: 'Open grille with shallow dark backing; no hidden machinery.' };
  return g;
}
