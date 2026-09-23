// Temporary mechanics placeholder. Replace via the 404 recipe before submission.
export default function (THREE) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 2.2), new THREE.MeshStandardMaterial({ color: 0xcaff64, roughness: 0.45, metalness: 0.15 }));
  body.position.y = 0.375;
  group.add(body);
  return group;
}
