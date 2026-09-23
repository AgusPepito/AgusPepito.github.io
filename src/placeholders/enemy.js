// Temporary mechanics placeholder. Replace via the 404 recipe before submission.
export default function (THREE) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 3.2), new THREE.MeshStandardMaterial({ color: 0xff6d77, roughness: 0.5, metalness: 0.1 }));
  body.position.y = 0.55;
  group.add(body);
  return group;
}
