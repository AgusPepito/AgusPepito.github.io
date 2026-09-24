// Recipe route B: agent-authored, following docs/art/track/01-flat.png.
export default function generate(THREE) {
  const kind = 'hatch', g = new THREE.Group(); g.name = 'cover-' + kind + '-r1';
  const materials = {
    armor: new THREE.MeshStandardMaterial({ color: 0xb6bcb7, metalness: 0.3, roughness: 0.62 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x53616a, metalness: 0.5, roughness: 0.55 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x18212a, roughness: 0.9 }),
  };
  for (const [name, m] of Object.entries(materials)) m.name = 'cover-' + name;
  function box(name, x, y, z, w, h, length, material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, length, 1, 1, Math.max(1, Math.ceil(length / 2))), materials[material]);
    m.name = name; m.position.set(x, y, z); g.add(m); return m;
  }
  for (const x of [-1.01, 1.01]) box('armor-edge-rail', x, 0.15, 0, 0.1, 0.3, 23.4, 'trim');
  for (const z of [-11.6, 11.6]) box('armor-end-trim', 0, 0.15, z, 2.12, 0.3, 0.2, 'trim');
  const step = kind === 'segmented' ? 3.8 : 7.6;
  for (let z = -11.4; z < 11.3; z += step) {
    const length = Math.min(step, 11.4 - z);
    const panel = box('armor-panel', 0, 0.27, z + length / 2, 1.91, 0.12, length - 0.1, 'armor');
    if (kind === 'start' || kind === 'end') {
      // Lower the approach/departure edge smoothly without changing socket dimensions.
      const p = panel.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const worldZ = p.getZ(i) + panel.position.z;
        const t = THREE.MathUtils.clamp((kind === 'start' ? 11.4 - worldZ : worldZ + 11.4) / 6, 0, 1);
        p.setY(i, p.getY(i) - 0.17 * (1 - t));
      }
      panel.geometry.computeVertexNormals();
    }
  }
  if (kind === 'hatch') for (const z of [-6, 6]) {
    box('hatch-seal', 0, 0.336, z, 1.6, 0.025, 2.9, 'dark');
    box('service-hatch', 0, 0.36, z, 1.45, 0.035, 2.7, 'armor');
    box('recessed-handle', 0, 0.382, z, 0.42, 0.014, 0.15, 'trim');
    for (const x of [-0.63, 0.63]) box('visible-latch', x, 0.383, z, 0.13, 0.025, 0.3, 'trim');
  }
  if (kind === 'vented') for (const z of [-7, 0, 7]) {
    box('shallow-vent-recess', 0, 0.338, z, 1.55, 0.022, 2.5, 'dark');
    for (let dz = -1; dz <= 1; dz += 0.4) box('vent-slat', 0, 0.367, z + dz, 1.42, 0.055, 0.17, 'trim');
  }
  g.userData = { category: '04', revision: 'r1', kind, length: 24, mountY: 0.15, description: 'Quiet covered armor with visible top details only; no internal machinery.' };
  return g;
}
