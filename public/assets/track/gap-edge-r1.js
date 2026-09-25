import energySurface from './gap-surface-r2.js';
// Category-11 art study. The cut is at Z=0; road extends toward +Z.
// Landing mirrors this same construction. All depth remains below the road.
export const GAP_EDGE_DEPTH=12;
export default function generate(THREE,{kind='takeoff',width=36,finishedSides=true}={}){
  const root=new THREE.Group();root.name=`gap-${kind}-lip-r2`;
  const mats={
    ivory:new THREE.MeshStandardMaterial({color:0xc6c9c3,roughness:.57,metalness:.25}),
    graphite:new THREE.MeshStandardMaterial({color:0x303a42,roughness:.48,metalness:.65}),
    steel:new THREE.MeshStandardMaterial({color:0x66767d,roughness:.4,metalness:.72}),
    dark:new THREE.MeshStandardMaterial({color:0x11191f,roughness:.84}),
    brass:new THREE.MeshStandardMaterial({color:0xa98b56,roughness:.53,metalness:.65}),
  };
  for(const [key,mat]of Object.entries(mats)){mat.name='gap-edge-r1-'+key;if(key==='graphite'||key==='steel')mat.userData.slabFinish=true;}
  function mesh(name,geometry,mat,x,y,z){const m=new THREE.Mesh(geometry,mats[mat]);m.name=name;m.position.set(x,y,z);root.add(m);return m;}
  function box(name,x,y,z,w,h,l,mat){return mesh(name,new THREE.BoxGeometry(w,h,l),mat,x,y,z);}
  function top(name,x,z,w,l,y,mat){const g=new THREE.PlaneGeometry(w,l);g.rotateX(-Math.PI/2);return mesh(name,g,mat,x,y,z);}
  function face(name,x,y,z,w,h,mat){const g=new THREE.PlaneGeometry(w,h);g.rotateY(Math.PI);return mesh(name,g,mat,x,y,z);}
  function bolt(x,y,z){const m=mesh('exposed-flange-fastener',new THREE.CylinderGeometry(.055,.055,.035,6),'steel',x,y,z);m.rotation.x=Math.PI/2;}
  const modules=Math.max(1,Math.round(width/6)),cell=width/modules;
  // Only the visible termination is thickened: upper/lower flanges, inset web
  // faces and their short exposed returns. No full road underside or chassis.
  box('continuous-cut-upper-flange',0,-.1,.12,width,.18,.24,'steel');
  box('continuous-cut-lower-flange',0,-.85,.14,width,.13,.28,'steel');
  face('recessed-cut-web-backing',0,-.48,.3,width,.65,'dark');
  for(let i=0;i<modules;i++){
    const x=-width/2+(i+.5)*cell,w=cell-.065;
    top('ivory-cut-edge-cap',x,.1,w,.18,.002,'ivory');
    face('inset-web-replacement-plate',x,-.48,.275,w-.36,.48,i%3===1?'steel':'graphite');
    for(const dx of [-w/2+.2,w/2-.2]){
      box('bolted-ivory-flange-seat',x+dx,-.48,.125,.22,.62,.22,'ivory');
      for(const y of [-.3,-.65])bolt(x+dx,y,-.002+.045);
    }
    // Only the visible sealed ends are modelled, in the outer web cartridges.
    if(i===0||i===modules-1)for(const dx of [-.5,.5]){
      const pipe=mesh('sealed-pipe-end-coupling',new THREE.CylinderGeometry(.19,.19,.22,12),'steel',x+dx,-.48,.16);pipe.rotation.x=Math.PI/2;
      const cap=mesh('sealed-pipe-end-disc',new THREE.CircleGeometry(.145,12),'graphite',x+dx,-.48,.042);cap.rotation.y=Math.PI;
      mesh('pipe-cap-retaining-ring',new THREE.TorusGeometry(.157,.023,5,12),'brass',x+dx,-.48,.036);
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])bolt(x+dx+Math.cos(a)*.156,-.48+Math.sin(a)*.156,.012);
    }
  }
  // Flush shoulder trims finish with shallow visible side caps at the cut.
  for(const side of finishedSides?[-1,1]:[]){
    top('terminated-ivory-shoulder-trim',side*(width/2-.12),GAP_EDGE_DEPTH/2,.24,GAP_EDGE_DEPTH,.003,'ivory');
    box('short-exposed-side-fascia',side*(width/2-.045),-.46,GAP_EDGE_DEPTH/2,.09,.9,GAP_EDGE_DEPTH,'graphite');
    box('sealed-edge-beam-cap',side*(width/2-.14),-.47,.09,.28,.87,.18,'ivory');
  }
  root.add(energySurface(THREE,{kind,width,length:GAP_EDGE_DEPTH}));
  // Bake nested surface fixtures once, then reflect landing vertices and winding.
  root.updateMatrixWorld(true);
  root.traverse(child=>{
    if(!child.isMesh)return;
    child.geometry.applyMatrix4(child.matrixWorld);
    if(kind==='landing'){
      const p=child.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,-p.getZ(i));
      const idx=child.geometry.index;
      if(idx)for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b);}
    }
    child.position.set(0,0,0);child.rotation.set(0,0,0);child.scale.set(1,1,1);child.geometry.computeVertexNormals();
  });
  root.traverse(child=>{if(!child.isMesh){child.position.set(0,0,0);child.rotation.set(0,0,0);child.scale.set(1,1,1);}});
  root.userData={revision:'11-flat-edge-r2',kind,width,depth:GAP_EDGE_DEPTH,visibleThickness:.915};return root;
}
