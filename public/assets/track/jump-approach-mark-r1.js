// Standalone recipe asset: one raised white approach chevron, front +Z.
export default function generate(THREE){
  const root=new THREE.Group();root.name='jump-approach-mark';
  const material=new THREE.MeshStandardMaterial({color:0xe5ddc8,emissive:0xfff3db,emissiveIntensity:.65,roughness:.5});
  material.name='j3-approach-white';
  for(const side of [-1,1]){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,1),material);
    mesh.name='white-jump-approach-chevron';
    mesh.position.set(side*.32,.0125,0);mesh.rotation.y=side*Math.PI/4;root.add(mesh);
  }
  return root;
}
