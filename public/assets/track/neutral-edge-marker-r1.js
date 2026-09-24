// Recipe route B. One subdued road-edge locator; no phase colors or glow.
export default function generate(THREE) {
  const root = new THREE.Group(); root.name = 'neutral-edge-marker-r1';
  for (const [name,w,l,y,color] of [['gasket',.28,2,.012,0x121c23],['reflector',.12,1.65,.018,0xa5aaa4]]) {
    const geometry = new THREE.PlaneGeometry(w,l); geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.15,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}); material.name = 'neutral-marker-'+name;
    const mesh = new THREE.Mesh(geometry,material); mesh.name = 'edge-'+name; mesh.position.y=y; root.add(mesh);
  }
  root.userData = {revision:'06-r1',visibility:'Flush neutral top marker at exposed road edges; no underside or light source.'};
  return root;
}
