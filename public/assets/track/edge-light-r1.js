// Recipe route B: procedural shoulder light, based on the user's orbital-racer
// references. Metres; base y=0, top y=.18, travel -Z, 12.5 m repeat.
// This neutral fixture is decorative and never grants a phase/boost benefit.
export default function generate(THREE,{length=12.5,illuminated=true}={}) {
  const root=new THREE.Group();root.name='roadside-dashed-light-r1';
  const mats={
    housing:new THREE.MeshStandardMaterial({color:0x18242d,roughness:.72,metalness:.3}),
    trim:new THREE.MeshStandardMaterial({color:0x6b808b,roughness:.5,metalness:.65}),
    lens:new THREE.MeshStandardMaterial({color:illuminated?0xd6efff:0x43515a,emissive:0xd6efff,emissiveIntensity:illuminated?2.5:0,roughness:.38,metalness:0}),
    spill:new THREE.MeshBasicMaterial({color:0xaddfff,vertexColors:true,transparent:true,opacity:illuminated ? .12 : 0,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),
  };
  for(const [name,material] of Object.entries(mats))material.name=`roadside-edge-${name}`;
  const box=(name,x,y,z,w,h,d,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,1,1,Math.max(1,Math.ceil(d/2))),mats[material]);
    mesh.name=name;mesh.position.set(x,y,z);root.add(mesh);return mesh;
  };
  box('edge-light-support',0,.045,0,1,.09,length,'housing');
  // Rails surround an open dark channel; the diffuser sits below their top.
  for(const x of [-.455,.455])box('edge-light-outer-trim',x,.125,0,.09,.11,length,'trim');
  for(const x of [-.29,.29])box('edge-light-channel-cheek',x,.12,0,.09,.10,length,'housing');
  for(const z of [-length/2+.055,length/2-.055])box('edge-light-module-joint',0,.135,z,.82,.07,.11,'trim');
  for(const z of [-length/4,length/4]){
    const dashLength=Math.min(3,length*.24);
    box('edge-light-recess',0,.104,z,.49,.028,dashLength+.16,'housing');
    box('edge-light-dash',0,.132,z,.4,.022,dashLength,'lens');
    for(const offset of [-dashLength/2-.045,dashLength/2+.045])box('edge-light-lens-cap',0,.136,z+offset,.49,.06,.09,'trim');
    // Very faint authored spill, not a row of runtime point lights. The RGB
    // gradient goes to black at every edge for additive blending without maps.
    const geometry=new THREE.PlaneGeometry(2,dashLength+1.3,6,6);
    geometry.rotateX(-Math.PI/2);
    const p=geometry.attributes.position,colors=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){
      const x=Math.abs(p.getX(i)),along=Math.abs(p.getZ(i))/(dashLength/2+.65);
      const fade=Math.max(0,1-x)**2*Math.max(0,1-along*along);
      colors.set([fade,fade,fade],i*3);
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const glow=new THREE.Mesh(geometry,mats.spill);glow.name='edge-light-soft-spill';
    glow.position.set(0,.184,z);root.add(glow);
  }
  root.userData={length,width:1,height:.18,illuminated,role:'neutral-roadside-light'};
  return root;
}
