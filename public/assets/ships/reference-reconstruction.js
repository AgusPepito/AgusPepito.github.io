// Image-led reconstruction of docs/art/ship/orbital-reference.png.
// Agent-written recipe route B, not output from the hosted 404 model.
export default function generate(THREE) {
  const g = new THREE.Group();
  const material = (color, roughness, metalness) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const ivory=material(0xe6e1d2,.43,.18), dark=material(0x232832,.48,.5);
  const alloy=material(0x56616b,.34,.72), glass=material(0x101b24,.16,.62), orange=material(0xf87922,.45,.15);
  const energy=material(0x00cfff,.25,.1); energy.name='phase-energy'; energy.emissive.set(0x00cfff); energy.emissiveIntensity=18;
  const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  const box=(w,h,d,mat,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const ring=(r,t,mat,x,y,z)=>add(new THREE.TorusGeometry(r,t,8,32),mat,x,y,z);
  const disk=(r,h,mat,x,y,z)=>add(new THREE.CylinderGeometry(r,r,h,32),mat,x,y,z);
  const strut=(a,b,r,mat)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const m=add(new THREE.CylinderGeometry(r,r,delta.length(),6),mat);
    m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  };
  // Octagonal cross-section lofts: broad roof, chamfered shoulders, deep dark belly.
  // Coordinates are generated from section dimensions, never a stored mesh blob.
  const section=[[-.68,1],[.68,1],[1,.5],[1,-.5],[.68,-1],[-.68,-1],[-1,-.5],[-1,.5]];
  function loft(stations,x,roof=ivory,belly=dark,openRear=false) {
    const vertices=[];
    const p=(s,i)=>[x+section[i][0]*s[1],(s[2]+s[3])/2+section[i][1]*(s[3]-s[2])/2,s[0]];
    const tri=(a,b,c)=>vertices.push(...a,...b,...c);
    const geo=new THREE.BufferGeometry();let offset=0;
    for(let j=0;j<stations.length-1;j++) for(let i=0;i<8;i++) {
      const n=(i+1)%8,a=p(stations[j],i),b=p(stations[j],n),c=p(stations[j+1],n),d=p(stations[j+1],i);
      tri(a,b,d);tri(b,c,d);geo.addGroup(offset,6,i===0||i===1||i===7?0:1);offset+=6;
    }
    for(const end of [0,stations.length-1]) {
      if(end===0&&openRear) continue;
      const s=stations[end],center=[x,(s[2]+s[3])/2,s[0]];
      for(let i=0;i<8;i++){const a=p(s,i),b=p(s,(i+1)%8);end===0?tri(center,b,a):tri(center,a,b);}
      geo.addGroup(offset,24,1);offset+=24;
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    // Two-sided shoulders also show the real thickness at the open engine mouths.
    roof.side=THREE.DoubleSide;belly.side=THREE.DoubleSide;
    return add(geo,[roof,belly]);
  }
  const plan=(points,depth,mat,y)=>{
    const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);return add(geo,mat,0,y,0);
  };
  const fin=(side)=>{
    const shape=new THREE.Shape();shape.moveTo(1.49,.46);shape.lineTo(1.39,1.01);shape.lineTo(.77,.76);shape.lineTo(.39,.5);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:1});geo.rotateY(Math.PI/2);
    const m=add(geo,ivory,side*1.28-.037,0,0);m.rotation.z=-side*.12;
    box(.085,.2,.055,orange,side*1.36,.81,-1.34).rotation.z=-side*.12;
  };
  const vent=(x,y,z,w,d)=>{
    box(w+.05,.035,d+.04,alloy,x,y,z);box(w,.025,d,dark,x,y+.025,z);
    const count=Math.max(3,Math.floor(d/.065));
    for(let i=0;i<count;i++)box(w*.87,.024,.019,alloy,x,y+.042,z-d*.42+i*d*.84/(count-1)).rotation.x=.3;
  };
  // Long center nose and low octagonal monocoque, widened around the rear reactor.
  loft([[-1.48,.31,.12,.47],[-1.16,.49,.07,.6],[-.52,.48,.05,.67],[.24,.36,.09,.61],[1.45,.22,.2,.47],[2.05,.035,.3,.35]],0);
  // Nose cap and overlapping armor panels leave visible dark seams.
  plan([[-.19,1.48],[0,2.06],[.19,1.48],[.26,.96],[-.26,.96]],.055,ivory,.46);
  for(const side of [-1,1]) {
    plan([[side*.26,.91],[side*.39,.21],[side*.47,-.35],[side*.25,-.34],[side*.18,.19]],.06,ivory,.62);
    plan([[side*.49,-.53],[side*.49,-1.1],[side*.32,-1.47],[side*.19,-1.17],[side*.28,-.55]],.06,ivory,.62);
    box(.07,.014,.11,orange,side*.26,.69,-.29).rotation.y=side*.18;
  }
  // Faceted canopy inset in a charcoal frame, with actual perimeter rails.
  loft([[.03,.2,.61,.66],[.3,.255,.61,.82],[.92,.17,.53,.75],[1.23,.07,.49,.53]],0,glass,glass);
  for(const side of [-1,1]) {
    strut([side*.2,.67,.03],[side*.255,.83,.3],.025,alloy);
    strut([side*.255,.83,.3],[side*.17,.76,.92],.025,alloy);
    strut([side*.17,.76,.92],[side*.07,.55,1.23],.023,alloy);
  }
  strut([-.255,.83,.3],[.255,.83,.3],.024,alloy);
  // Rear deck reactor: black well, cyan concentric rings, six chunky radial retainers.
  disk(.375,.055,dark,0,.705,-.83);disk(.3,.045,energy,0,.748,-.83);
  ring(.342,.022,energy,0,.765,-.83).rotation.x=-Math.PI/2;
  ring(.275,.024,alloy,0,.778,-.83).rotation.x=-Math.PI/2;
  disk(.219,.016,energy,0,.781,-.83);
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;const m=box(.075,.05,.13,alloy,Math.sin(a)*.34,.79,-.83+Math.cos(a)*.34);m.rotation.y=a;
  }
  vent(0,.62,-1.28,.34,.22);vent(0,.69,-.37,.3,.17);
  // Two deep open-ended, octagonal engine nacelles with pointed shoulders.
  for(const side of [-1,1]) {
    const x=side*1.08;
    box(.65,.13,.25,dark,side*.7,.26,-.79);
    box(.65,.1,.19,alloy,side*.7,.32,-.07).rotation.y=side*.25;
    loft([[-1.66,.39,.07,.67],[-1.31,.4,.04,.73],[-.55,.34,.06,.7],[.46,.22,.19,.58],[.99,.018,.37,.41]],x,ivory,dark,true);
    // Separate shoulder armor plates and radiator slots match the image's broken surfaces.
    plan([[x-side*.22,-1.25],[x+side*.24,-1.25],[x+side*.21,-.56],[x-side*.18,-.34]],.045,ivory,.72);
    vent(x,.72,-.82,.25,.3);vent(x,.64,.07,.15,.3);
    for(const z of [-1.23,-.5]) {
      box(.48,.012,.018,alloy,x,.777,z);
      box(.06,.09,.11,orange,x+side*.28,.64,z);
    }
    // Recessed throat behind armor; no luminous disk covering the nozzle structure.
    const sleeve=add(new THREE.CylinderGeometry(.255,.275,.19,16,1,true),alloy,x,.365,-1.51);sleeve.rotation.x=Math.PI/2;alloy.side=THREE.DoubleSide;
    ring(.263,.033,dark,x,.365,-1.675);ring(.225,.025,energy,x,.365,-1.625);
    disk(.158,.027,energy,x,.365,-1.63).rotation.x=Math.PI/2;
    ring(.17,.015,alloy,x,.365,-1.65);
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6;
      const blade=box(.036,.082,.085,alloy,x+Math.sin(a)*.243,.365+Math.cos(a)*.243,-1.64);blade.rotation.z=-a+.18;
    }
    // Low-profile edge fins, lower heat sinks and discrete hull service fasteners.
    fin(side);
    for(let i=0;i<5;i++)box(.3,.04,.026,alloy,x,.05,-.97+i*.12);
    for(const z of [-1.11,-.57])disk(.018,.015,alloy,x-side*.19,.79,z);
    box(.065,.07,.11,orange,side*.115,.52,1.55);
  }
  // Recipe placement contract: exact transformed vertices; centered X/Z, base Y=0.
  g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();
  g.traverse(n=>{if(!n.isMesh)return;const p=n.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(n.matrixWorld));});
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  for(const child of g.children){child.position.x-=center.x;child.position.y-=bounds.min.y;child.position.z-=center.z;}
  g.scale.set(3.1/size.x,.95/size.y,3.9/size.z);
  // Engine exits in the normalized model coordinates, for gameplay thrust effects.
  g.userData.exhausts=[-1,1].map(side=>new THREE.Vector3(side*1.08,.365,-1.675)
    .sub(new THREE.Vector3(center.x,bounds.min.y,center.z)).multiply(g.scale).toArray());
  g.userData.reactorGlow=new THREE.Vector3(0,.82,-.83)
    .sub(new THREE.Vector3(center.x,bounds.min.y,center.z)).multiply(g.scale).toArray();
  return g;
}
