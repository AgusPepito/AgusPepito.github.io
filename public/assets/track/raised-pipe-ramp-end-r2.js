// 404 recipe route B. Raised roadside kit R2, based on the user's elevated-housing reference.
// Front +Z faces the road; X is the 24 m repeat axis; base y=0. No rear machinery or underside detail.
export default function generate(THREE) {
  const family = 'pipe', kind = 'ramp-end', root = new THREE.Group();
  root.name = `raised-${family}-${kind}-r2`;
  const materials = {
    ivory: new THREE.MeshStandardMaterial({color:0xc6c9bf, roughness:0.62, metalness:0.25}),
    dark: new THREE.MeshStandardMaterial({color:0x172128, roughness:0.88}),
    steel: new THREE.MeshStandardMaterial({color:0x69777b, roughness:0.48, metalness:0.6}),
    trim: new THREE.MeshStandardMaterial({color:0x39474f, roughness:0.6, metalness:0.4}),
    copper: new THREE.MeshStandardMaterial({color:0x97704d, roughness:0.6, metalness:0.4}),
  };
  Object.entries(materials).forEach(([k,m]) => m.name='raised-'+k);
  function box(name,x,y,z,w,h,d,mat) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/2)),1,1),materials[mat]);
    m.name=name; m.position.set(x,y,z);root.add(m);return m;
  }
  function plane(name,x,y,z,w,h,mat) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h,Math.max(1,Math.ceil(w/2)),1),materials[mat]);
    m.name=name;m.position.set(x,y,z);root.add(m);return m;
  }
  box('visible-foot-rail',0,0.13,0.9,24,0.26,0.5,'trim');
  box('ivory-roof-cap',0,3.18,0,24,0.24,2.6,'ivory');
  box('roof-front-inset',0,3.315,0.8,23.3,0.03,0.22,'trim');
  for(const x of [-11.65,11.65]) {
    const p=box('sloped-ivory-upright',x,1.61,0.88,0.7,3.05,0.45,'ivory');p.rotation.x=-0.14;
    for(const y of [0.65,2.5]) box('visible-front-fastener',x,y,1.09-y*0.14,0.19,0.17,0.06,'trim');
  }
  // Front-facing shallow cavity backing; no concealed rear wall or contents.
  plane('recess-backing',0,1.57,0.12,22.7,2.86,'dark');
  for(const x of [-6,0,6]) box('service-divider',x,1.6,0.33,0.16,2.85,0.25,'trim');
  if(family==='pipe') {
    for(const y of [0.7,1.55,2.4]) {
      const pts=[];
      for(const x of [-11.3,-5,-2,2,5,11.3]) pts.push(new THREE.Vector3(x,y+(kind==='offset' && Math.abs(x)===2?0.24:0),0.65));
      const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,0.23,12,false);
      const pipe=new THREE.Mesh(geo,materials.steel);pipe.name='exposed-horizontal-pipe';root.add(pipe);
      for(const x of [-10.8,-6,0,6,10.8]) {
        const collar=new THREE.Mesh(new THREE.CylinderGeometry(0.29,0.29,kind==='coupling'?0.42:0.18,12),materials.trim);
        collar.rotation.z=Math.PI/2;collar.position.set(x,y,0.65);collar.name='pipe-collar';root.add(collar);
      }
      if(kind==='valve') {
        box('valve-body',0,y,0.7,0.8,0.57,0.65,'trim');
        box('valve-handle',0,y,1.08,0.85,0.12,0.14,'copper');
      }
      for(const x of [-11.25,11.25]) box('sealed-socket-block',x,y,0.65,0.12,0.55,0.55,'trim');
    }
  }
  if(family==='grille') {
    for(let x=-10.8;x<=10.8;x+=0.6) box('vertical-grille-bar',x,1.55,0.94,0.1,2.5,0.12,'steel');
    for(let y=0.4;y<2.9;y+=kind==='louver'?0.32:0.55) {
      const m=box(kind==='louver'?'angled-louver':'cross-grille',0,y,0.98,22.2,kind==='louver'?0.22:0.09,0.12,'steel');
      if(kind==='louver') m.rotation.x=-0.4;
    }
    if(kind==='reinforced') for(const x of [-7.5,0,7.5]) box('heavy-grille-stile',x,1.55,1.06,0.32,2.8,0.18,'ivory');
  }
  if(family==='cover') {
    const step=kind==='segmented'?3:6;
    for(let x=-11.2;x<11;x+=step) {
      const width=Math.min(step,11.2-x)-0.1;
      const m=box('sloped-armor-face',x+width/2,1.6,0.9,width,2.9,0.14,'ivory');m.rotation.x=-0.14;
    }
    if(kind==='hatch') for(const x of [-6,6]) {
      box('hatch-gasket',x,1.4,1.04,2.7,1.65,0.09,'trim');
      box('hatch-cover',x,1.4,1.1,2.48,1.43,0.08,'ivory');
      box('hatch-handle',x,1.4,1.17,0.65,0.13,0.1,'trim');
    }
    if(kind==='vented') for(const x of [-6,0,6]) {
      box('vent-backing',x,1.45,1.06,2.5,1.5,0.08,'dark');
      for(let y=0.85;y<2.1;y+=0.25) box('vent-slat',x,y,1.13,2.3,0.1,0.12,'trim');
    }
  }
  // Closed visible module ends; slope the whole end unit for a clear start/end silhouette.
  for(const x of [-11.92,11.92]) box('shallow-end-cheek',x,1.55,0,0.16,3.1,2.6,'ivory');
    // Split faces at the ramp shoulder before bending. A face spanning that
    // corner otherwise becomes a straight chord through the sloping housing.
    const shoulder = kind==='ramp-start' ? -4 : 4;
    function splitAtShoulder(geometry) {
      const source = geometry.index ? geometry.toNonIndexed() : geometry;
      const p=source.attributes.position, uv=source.attributes.uv;
      const positions=[], texcoords=[];
      function clip(poly, side) {
        const out=[];
        for(let i=0;i<poly.length;i++) {
          const a=poly[i],b=poly[(i+1)%poly.length];
          const insideA=side*(a[0]-shoulder)>=0,insideB=side*(b[0]-shoulder)>=0;
          if(insideA) out.push(a);
          if(insideA!==insideB) {
            const t=(shoulder-a[0])/(b[0]-a[0]);
            out.push(a.map((v,k)=>v+(b[k]-v)*t));
          }
        }
        return out;
      }
      function emit(poly) {
        for(let i=1;i+1<poly.length;i++) for(const v of [poly[0],poly[i],poly[i+1]]) {
          positions.push(v[0],v[1],v[2]); if(uv) texcoords.push(v[3],v[4]);
        }
      }
      for(let i=0;i<p.count;i+=3) {
        const triangle=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j),uv?.getX(i+j)||0,uv?.getY(i+j)||0]);
        const xs=triangle.map(v=>v[0]);
        if(Math.min(...xs)<shoulder && Math.max(...xs)>shoulder) {
          emit(clip(triangle,-1));emit(clip(triangle,1));
        } else emit(triangle);
      }
      const result=new THREE.BufferGeometry();
      result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      if(uv) result.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));
      if(source!==geometry) source.dispose(); geometry.dispose();
      return result;
    }
  root.updateMatrixWorld(true);
  if(kind==='ramp-start'||kind==='ramp-end') root.traverse(n=>{
    if(!n.isMesh)return;
    n.geometry.applyMatrix4(n.matrixWorld);n.geometry=splitAtShoulder(n.geometry);n.position.set(0,0,0);n.rotation.set(0,0,0);
    const p=n.geometry.attributes.position;
    for(let i=0;i<p.count;i++) {
      const t=THREE.MathUtils.clamp((kind==='ramp-start'?p.getX(i)+12:12-p.getX(i))/8,0,1);
      p.setY(i,p.getY(i)*(0.18+0.82*t));
    }
    n.geometry.computeVertexNormals();
  });
  root.userData={revision:'r2',family,kind,pitch:24,height:3.33,front:'+Z',visibility:'Inward face, top and exposed ends only.'};
  return root;
}


