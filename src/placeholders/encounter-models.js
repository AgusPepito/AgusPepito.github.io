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
  function makeDart(role, color) {
    const g = new THREE.Group(), hull = material(color);
    if (role === 'direct') {
      box(g, 0.85, 0.6, 2.35, 0, 0.5, 0, hull);
      for (const side of [-1, 1]) box(g, 0.22, 0.25, 1.5, side * 0.6, 0.45, -0.15, dark);
    } else {
      const nose = new THREE.Mesh(new THREE.ConeGeometry(role === 'predict' ? 0.72 : 0.55, 2.35, 3), hull);
      nose.rotation.x = Math.PI / 2; nose.position.y = 0.55; g.add(nose);
      if (role === 'spread') for (const side of [-1, 1]) {
        const wing = box(g, 0.65, 0.23, 1.55, side * 0.48, 0.55, -0.15, hull);
        wing.rotation.y = side * 0.2;
      }
    }
    box(g, role === 'direct' ? 0.7 : 1.1, 0.12, 1.65, 0, 1.12, 0, dark);
    const glyphs = new THREE.Group(); glyphs.name = 'glyphs'; g.add(glyphs);
    if (role === 'direct') for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 12), orange);
      dot.position.set(0, 1.22, -0.5 + i * 0.5); glyphs.add(dot);
    }
    if (role === 'predict') {
      const diamond = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.48, 4), orange);
      diamond.rotation.x = -Math.PI / 2; diamond.position.y = 1.22; glyphs.add(diamond);
      box(glyphs, 0.12, 0.06, 1.35, 0, 1.23, 0, orange);
      box(glyphs, 0.8, 0.06, 0.12, 0, 1.23, 0, orange);
    }
    if (role === 'spread') for (const side of [-1, 0, 1]) {
      const ray = box(glyphs, 0.14, 0.06, 1.12, side * 0.23, 1.22, -0.05, orange);
      ray.rotation.y = -side * 0.45;
    }
    box(g, 0.5, 0.22, 0.4, 0, 0.55, -1, dark);
    box(g, 0.42, 0.24, 0.18, 0, 0.57, -1.22, orange, 'signal');
    const flash = box(g, 0.65, 0.12, 0.8, 0, 0.6, -1.65, new THREE.MeshBasicMaterial({ color: 0xfff5cf }), 'muzzle-flash');
    flash.visible = false;
    return g;
  }
  const dartDirect = makeDart('direct', 0xcb4a58), dartPredict = makeDart('predict', 0x42b9cf), dartSpread = makeDart('spread', 0xd5a443);
  const interceptor = vehicle(2.5, 4, red);
  box(interceptor, 1.25, 0.8, 0.15, 0, 0.65, -2.05, cyan, 'engine');
  box(interceptor, 0.6, 0.2, 0.6, 0, 1.9, 0, orange, 'signal');
  const minelayer = vehicle(3.2, 4.4, purple);
  box(minelayer, 1.8, 0.8, 0.12, 0, 0.55, -2.25, dark);
  box(minelayer, 0.8, 0.2, 0.8, 0, 1.9, 0, orange, 'signal');
  const hauler = vehicle(7.4, 13, purple);
  box(hauler, 6.5, 1.5, 10.5, 0, 2.05, -0.6, purple);
  box(hauler, 0.25, 0.6, 2, 3.8, 1, -4, orange, 'indicator-left');
  box(hauler, 0.25, 0.6, 2, -3.8, 1, -4, orange, 'indicator-right');
  for (let slot = 0; slot < 3; slot++) {
    box(hauler, 1.9, 1.8, 0.1, -(slot - 1) * 2.55, 1.1, -6.56, dark);
    box(hauler, 1.2, 0.7, 0.13, -(slot - 1) * 2.55, 1.05, -6.65, cyan, `open-${slot}`);
  }
  const lock = new THREE.Group();
  box(lock, 1.55, 1.35, 0.7, 0, 0.85, 0, orange);
  box(lock, 0.5, 0.65, 0.1, 0, 0.9, -0.4, dark);
  const turret = new THREE.Group();
  box(turret, 1.2, 0.6, 1.3, 0, 0.9, 0, dark);
  const aim = new THREE.Group(); aim.name = 'aim'; turret.add(aim);
  box(aim, 1.1, 0.8, 1.1, 0, 1.4, 0, purple);
  box(aim, 0.35, 0.35, 1.6, 0, 1.4, -0.8, dark);
  box(turret, 0.6, 0.15, 0.6, 0, 2, 0, orange, 'signal');
  box(turret, 1.2, 0.15, 0.35, 0, 1.85, 0, orange, 'role');
  return { dart: dartDirect, 'dart-direct': dartDirect, 'dart-predict': dartPredict, 'dart-spread': dartSpread, interceptor, minelayer, hauler, lock, turret };
}
