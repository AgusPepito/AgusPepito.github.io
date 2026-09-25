// Two reusable procedural rock assets; no textures or external mesh data.
// Unit-scale, centered at the origin; variants 0 = pitted, 1 = elongated/fractured.
export default function generate(THREE,{variant=0}={}) {
  const geometry=new THREE.IcosahedronGeometry(1,2),p=geometry.attributes.position;
  const direction=new THREE.Vector3(),seed=variant?2.7:.4;
  const craters=[new THREE.Vector3(.7,.5,.4).normalize(),new THREE.Vector3(-.5,.3,.8).normalize()];
  for(let i=0;i<p.count;i++){
    direction.fromBufferAttribute(p,i).normalize();
    const {x,y,z}=direction;
    let radius=1+.13*Math.sin(x*5+seed)*Math.cos(y*4-z*3)+.09*Math.sin(z*7+y*3+seed);
    for(const crater of craters){
      const distance=1-direction.dot(crater);
      radius-=.2*Math.exp(-distance*24);
      radius+=.04*Math.exp(-(((distance-.12)/.05)**2));
    }
    if(variant)radius*=1-.12*Math.max(0,x+y-.3);
    p.setXYZ(i,x*radius*(variant?1.35:1),y*radius*(variant?.7:.88),z*radius*(variant?.84:1.04));
  }
  const colors=new Float32Array(p.count*3),color=new THREE.Color();
  // One muted mineral color per face; repeated copies receive additional instance tint.
  for(let i=0;i<p.count;i+=3){
    const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3;
    const y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;
    const z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
    const grain=.5+.5*Math.sin(x*37+y*53+z*29+seed);
    color.setHex(variant?0x827568:0x727b85).multiplyScalar(.7+grain*.4);
    for(let j=0;j<3;j++)color.toArray(colors,(i+j)*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:.03,flatShading:true});
  material.name=variant?'asteroid-fractured-r1':'asteroid-pitted-r1';
  const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;
  return mesh;
}
