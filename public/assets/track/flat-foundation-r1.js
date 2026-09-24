// 404 recipe route B: agent-authored geometry, based on docs/art/track/01-flat.png.
// Metres; 100 m module, +Z entrance, base y=0, driving skin y=0.6.
export default function generate(THREE) {
  const root = new THREE.Group(); root.name = 'flat-foundation-r1';
  const mats = {
    road: new THREE.MeshStandardMaterial({ color: 0x242c34, roughness: 0.86 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x29323b, roughness: 0.8 }),
    seam: new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.9 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xc6c9c3, roughness: 0.57, metalness: 0.25 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x53616a, roughness: 0.62, metalness: 0.45 }),
    recess: new THREE.MeshStandardMaterial({ color: 0x141c24, roughness: 0.95 }),
  };
  Object.entries(mats).forEach(([name, m]) => { m.name = name; });
  // Sample long faces every two metres so they deform with the existing road bends.
  function box(parent, name, x, y, z, w, h, length, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, length, 1, 1, Math.max(1, Math.ceil(length / 2))), mats[material]);
    mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function skin(parent, name, x, y, z, w, length, material) {
    const geometry = new THREE.PlaneGeometry(w, length, 1, Math.max(1, Math.ceil(length / 2)));
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, mats[material]); mesh.name = name;
    mesh.position.set(x, y, z); parent.add(mesh);
  }
  skin(root, 'continuous-road-no-underside', 0, 0.6, 0, 36, 100, 'road');
  // Alternate 10/20 m panel courses; broad shading and narrow dark joints, no bright fake lanes.
  for (let column = 0; column < 6; column++) {
    let at = -50, n = 0;
    while (at < 50) {
      const length = Math.min((column + n) % 3 === 0 ? 20 : 10, 50 - at);
      skin(root, 'flush-panel-course', -15 + column * 6, 0.606, at + length / 2, 5.94, length - 0.08,
        (column + n) % 3 === 0 ? 'panel' : 'road');
      skin(root, 'panel-joint', -15 + column * 6, 0.607, at + 0.025, 6, 0.05, 'seam');
      at += length; n++;
    }
  }
  skin(root, 'expansion-joint', 0, 0.61, -49.88, 36, 0.24, 'seam');
  for (const side of [-1, 1]) {
    box(root, 'edge-middle', side * 18.16, 0.34, 0, 0.32, 0.68, 100, 'ivory');
    for (const z of [-49.7, 49.7]) box(root, 'edge-end-splice', side * 18.16, 0.69, z, 0.32, 0.035, 0.6, 'steel');
    const bays = new THREE.Group(); bays.name = 'service-bays'; root.add(bays);
    // Common socket: 24 m pitch, 3.2 m width, recessed floor. Shared by future pipe/grille/cover inserts.
    for (let i = 0; i < 4; i++) {
      const z = -36 + i * 24;
      skin(bays, 'empty-bay-backing', side * 20, 0.15, z, 3.2, 24, 'recess');
      box(bays, 'outer-fascia', side * 21.7, 0.35, z, 0.2, 0.7, 24, 'ivory');
      box(bays, 'repeating-outer-trim', side * 21.55, 0.7, z, 0.5, 0.14, 24, 'ivory');
      for (const offset of [-8, 8]) {
        box(bays, 'visible-mount-socket', side * 18.65, 0.32, z + offset, 0.48, 0.34, 0.7, 'steel');
        box(bays, 'visible-outer-bracket', side * 21.18, 0.37, z + offset, 0.7, 0.24, 0.65, 'steel');
      }
    }
    for (let i = 0; i <= 4; i++) {
      const z = -48 + i * 24;
      box(bays, i === 0 ? 'bay-end-cap' : i === 4 ? 'bay-start-cap' : 'shared-bay-divider',
        side * 20, 0.38, z, 3.2, 0.46, i === 0 || i === 4 ? 0.5 : 0.32, 'ivory');
      box(bays, 'divider-top-inset', side * 20, 0.62, z, 2.25, 0.035, 0.18, 'steel');
    }
  }
  root.userData = { revision: '01-r1', length: 100, driveWidth: 36, driveHeight: 0.6,
    bayPitch: 24, bayWidth: 3.2, bayCentersX: [-20, 20], bayCentersZ: [-36, -12, 12, 36],
    insertFloor: 0.15, insertCeiling: 0.6, visibility: 'Top surface, shallow exposed bay recesses and outer edge only; no road underside or buried machinery.' };
  return root;
}
