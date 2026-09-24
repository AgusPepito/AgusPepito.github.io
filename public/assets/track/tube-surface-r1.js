// Recipe route B: shared convex/concave skin from the saved tube concepts.
// Author in unwrapped metres: X circumference, Y depth from the drivable skin,
// Z repeat axis (+Z entrance). No concealed skeleton or duplicate back shell.
export function wrapTubeSurface(THREE, root, inside = false, radius = 18) {
  const k = (inside ? 1 : -1) / radius;
  root.updateMatrixWorld(true);
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    const p = mesh.geometry.attributes.position;
    for (let i=0;i<p.count;i++) {
      const theta=p.getX(i)*k, h=p.getY(i), sn=Math.sin(theta), cs=Math.cos(theta);
      p.setXYZ(i,sn/k-h*sn,(1-cs)/k+h*cs,p.getZ(i));
    }
    mesh.position.set(0,0,0); mesh.rotation.set(0,0,0); mesh.scale.set(1,1,1);
    mesh.geometry.computeVertexNormals();
  });
  // World transforms were baked above, including any nested service section.
  root.traverse(node=>{if(!node.isMesh){node.position.set(0,0,0);node.rotation.set(0,0,0);node.scale.set(1,1,1);}});
  return root;
}

export default function generate(THREE, { inside=false, radius=18, length=100, sectionIndex=0, startCap=true, endCap=true, services=true, wrap=true, cutRanges=[] } = {}) {
  const root=new THREE.Group(); root.name=`${inside?'inside':'outside'}-tube-r1`;
  const circumference=2*Math.PI*radius, half=circumference/2, columns=24, cell=circumference/columns;
  function exposedIntervals(a,b){
    let intervals=[[a,b]];
    for(const [lo,hi]of cutRanges)intervals=intervals.flatMap(([s,e])=>{
      if(hi<=s||lo>=e)return [[s,e]];
      return [...(s<lo?[[s,lo]]:[]),...(hi<e?[[hi,e]]:[])];
    });
    return intervals;
  }
  const mats={
    road:new THREE.MeshStandardMaterial({color:0x242c34,roughness:.86}),
    panel:new THREE.MeshStandardMaterial({color:0x2b343d,roughness:.8}),
    dark:new THREE.MeshStandardMaterial({color:0x10191f,roughness:.85}),
    ivory:new THREE.MeshStandardMaterial({color:0xbec3b9,roughness:.6,metalness:.25}),
    steel:new THREE.MeshStandardMaterial({color:0x69797b,roughness:.55,metalness:.55}),
    brass:new THREE.MeshStandardMaterial({color:0x97855e,roughness:.6,metalness:.4}),
    lamp:new THREE.MeshStandardMaterial({color:0xdad9ca,emissive:0xdad9ca,emissiveIntensity:.7,roughness:.6}),
  };
  for(const [name,material] of Object.entries(mats)) material.name='tube-r1-'+name;
  // Road markings have the same depth protection as the reviewed lane kit.
  for(const key of ['ivory','steel','lamp','brass']) {
    mats[key].polygonOffset=true; mats[key].polygonOffsetFactor=-1; mats[key].polygonOffsetUnits=-1;
  }
  function mesh(name,geometry,material,x=0,y=0,z=0) {
    const m=new THREE.Mesh(geometry,mats[material]);m.name=name;m.position.set(x,y,z);root.add(m);return m;
  }
  function skin(name,x,z,w,l,y,material) {
    const geometry=new THREE.PlaneGeometry(w,l,Math.max(1,Math.ceil(w/.4)),Math.max(1,Math.ceil(l/2)));
    geometry.rotateX(-Math.PI/2); return mesh(name,geometry,material,x,y,z);
  }
  function rimWall(name,x,z,w,l,axis) {
    const geometry=new THREE.PlaneGeometry(axis==='x'?l:w,.18,Math.max(1,Math.ceil((axis==='x'?l:w)/.4)),1);
    if(axis==='x') geometry.rotateY(Math.PI/2);
    const m=mesh(name,geometry,'steel',x,-.09,z); m.material=mats.steel;
    // Both sides of a shallow cut can be seen through its protective grate.
    if(!mats.wall) {mats.wall=mats.steel.clone();mats.wall.name='tube-r1-recess-wall';mats.wall.side=THREE.DoubleSide;}
    m.material=mats.wall;
  }
  function service(x,z,w,l,family) {
    const firstPart=root.children.length;
    const iw=w-.32, il=l-.32;
    skin('service-shallow-backing',x,z,iw,il,-.18,'dark');
    for(const sign of [-1,1]) {
      skin('service-flush-side-frame',x+sign*(w/2-.08),z,.16,l,.008,'ivory');
      skin('service-flush-end-frame',x,z+sign*(l/2-.08),iw,.16,.008,'ivory');
      rimWall('service-cut-side',x+sign*iw/2,z,iw,il,'x');
      rimWall('service-cut-end',x,z+sign*il/2,iw,il,'z');
    }
    if(family==='cover') {
      skin('sealed-service-cover',x,z,iw-.05,il-.05,.002,'panel');
      for(const sign of [-1,1]) {
        skin('cover-lock',x+sign*(iw/2-.24),z,.11,.42,.012,'steel');
        skin('cover-seam',x,z+sign*il*.27,iw-.12,.05,.009,'dark');
      }
    } else {
      if(family==='pipe') for(const dx of [-1,0,1]) {
        const pipe=mesh('recessed-pipe',new THREE.CylinderGeometry(.065,.065,il-.1,10,Math.ceil(il/2)), 'steel',x+dx*.65,-.095,z);
        pipe.rotation.x=Math.PI/2;
        for(const dz of [-il*.3,il*.3]) {
          const collar=mesh('visible-pipe-collar',new THREE.CylinderGeometry(.078,.078,.14,10),'brass',x+dx*.65,-.095,z+dz);collar.rotation.x=Math.PI/2;
        }
      }
      // These flush bars bridge the recess, keeping the nominal skin drivable.
      for(let dx=-iw/2+.15;dx<iw/2;dx+=.38) skin('protective-longitudinal-web',x+dx,z,.065,il,.008,'steel');
      for(let dz=-il/2+.25;dz<il/2;dz+=.65) skin(family==='pipe'?'pipe-protective-cross-web':'grille-cross-web',x,z+dz,iw,.07,.01,'steel');
    }
    for(const dx of [-w/2+.08,w/2-.08]) for(const dz of [-l/2+.35,l/2-.35]) skin('service-frame-fastener',x+dx,z+dz,.075,.12,.014,'brass');
    for(const part of root.children.slice(firstPart))part.userData.serviceFamily=family;
  }
  // 15-degree panel columns and 12.5 m courses; quiet tiles dominate.
  for(let column=0;column<columns;column++) {
    const x=-half+(column+.5)*cell;
    for(let at=0,row=0;at<length;at+=12.5,row++) {
      for(const [a,b] of exposedIntervals(at,Math.min(at+12.5,length))){
      const l=b-a, z=length/2-(a+b)/2;
      const familyIndex=[3,11,19].indexOf(column);
      if(services && familyIndex>=0 && row===2+(sectionIndex%3) && l>=12) {
        service(x,z,cell,l,['pipe','grille','cover'][(familyIndex+sectionIndex)%3]);
      } else {
        skin('continuous-panel-cell',x,z,cell,l,0,'dark');
        skin('curved-road-panel',x,z,cell-.045,l-.07,.006,(column+row+sectionIndex)%4===0?'panel':'road');
      }
      }
    }
  }
  for(let at=0;at<length;at+=50) if(!cutRanges.some(([a,b])=>at+.32>a&&at+.04<b))skin('flush-circumferential-band',0,length/2-at-.18,circumference,.28,.012,'ivory');
  // Two half-strips meet exactly at the periodic closure; no duplicate ridge.
  for(const sign of [-1,1])for(const [a,b]of exposedIntervals(0,length))skin('flush-tube-closure-seam',sign*(half-.035),length/2-(a+b)/2,.07,b-a,.013,'steel');
  if(inside) for(let at=12.5;at<length;at+=25) for(const u of [-.75,-.25,.25,.75]) {
    const x=u*half,z=length/2-at;
    skin('neutral-light-gasket',x,z,.32,2.4,.014,'dark');
    skin('neutral-recessed-light',x,z,.13,2,.019,'lamp');
  }
  for(const [enabled,z,sign] of [[startCap,length/2,1],[endCap,-length/2,-1]]) if(enabled) {
    const geometry=new THREE.PlaneGeometry(circumference,.28,Math.ceil(circumference/.4),1);
    if(sign<0) { const p=geometry.attributes.position; for(let i=0;i<p.count;i++) p.setX(i,-p.getX(i)); }
    mesh('exposed-mouth-cross-section',geometry,'ivory',0,-.14,z);
    skin('mouth-flush-seal',0,z-sign*.13,circumference,.26,.014,'ivory');
  }
  root.userData={revision:inside?'08-r1':'07-r1',radius,length,inside,
    visibility:'Drivable skin, flush bands and protected shallow recesses; only exposed mouth thickness, no hidden shell or skeleton.'};
  return wrap?wrapTubeSurface(THREE,root,inside,radius):root;
}
