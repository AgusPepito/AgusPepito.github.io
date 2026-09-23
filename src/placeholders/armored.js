// Temporary primitive shield carrier; collision width comes from the simulation.
export default function (THREE) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 3), new THREE.MeshStandardMaterial({ color: 0xa985ed, roughness: 0.6 }));
  body.position.y = 0.65;
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1, 0.65, 1.1), new THREE.MeshStandardMaterial({ color: 0x7954b8, roughness: 0.4 }));
  shield.name = 'shield'; shield.position.set(0, 0.55, -0.8);
  const health = new THREE.Mesh(new THREE.BoxGeometry(1, 0.035, 0.22), new THREE.MeshBasicMaterial({ color: 0xe4d3ff }));
  health.name = 'health'; health.position.set(0, 1.32, -0.6);
  const charge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xf6d4ff }));
  charge.name = 'charge'; charge.position.set(0, 1.45, -1.2); charge.visible = false;
  group.add(body, shield, health, charge);
  return group;
}
