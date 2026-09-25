// Recipe route B: recessed light cassettes for the approved R3 side housings.
// Source axes match the walls: 12 m along X, inward face +Z, base y=0.
export default function generate(THREE,{kind='plain',illuminated=true}={}) {
  const root=new THREE.Group();root.name='r3-recessed-wall-lights';
  const lean=Math.tan(Math.PI/6);
  const mats={
    pocket:new THREE.MeshStandardMaterial({color:0x10202a,roughness:.8,metalness:.2}),
    frame:new THREE.MeshStandardMaterial({color:0x73818a,roughness:.48,metalness:.65}),
    lens:new THREE.MeshStandardMaterial({color:0xe1f3ff,emissive:0xe1f3ff,emissiveIntensity:illuminated?2.25:0,roughness:.4,metalness:0}),
  };
  for(const [name,material] of Object.entries(mats))material.name=`roadside-wall-${name}`;
  const ramp=kind==='ramp-start'||kind==='ramp-end',direction=kind==='ramp-start'?1:-1;
  function box(name,x,y,w,h,d,offset,material){
    const geometry=new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/.6)),1,1);
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const px=x+p.getX(i),oldY=y+p.getY(i);
      const factor=ramp ? .18+.82*THREE.MathUtils.clamp((px+6*direction)*direction/8,0,1) : 1;
      const newY=oldY*factor;
      p.setXYZ(i,px,newY,1.4-newY*lean+offset+p.getZ(i));
    }
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,mats[material]);mesh.name=name;root.add(mesh);
  }
  // Each cassette stays within a single linear portion of the ramp profile:
  // neither spans the shoulder at source X=+2/-2. No chord through the wall.
  for(const x of [-3.3,3.3])for(const y of [.31,3.04]){
    const height=y>1 ? .16 : .1,width=2.1;
    box('wall-light-recess',x,y,width+.18,height+.10,.06,.145,'pocket');
    for(const sign of [-1,1]){
      box('wall-light-frame-rail',x,y+sign*(height/2+.035),width+.18,.035,.055,.192,'frame');
      box('wall-light-frame-cap',x+sign*(width/2+.06),y,.055,height+.10,.055,.192,'frame');
    }
    box('wall-light-diffuser',x,y,width,height,.018,.183,'lens');
  }
  root.userData={kind,illuminated,role:'neutral-wall-light'};
  return root;
}
