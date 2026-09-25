import {surfaceMaps} from './slab-surface-r1.js';

// Native tube-space geometry, added AFTER the road's circumference wrap.
// Cut at Z=0; all structure extends into its own road, never across the gap.
export default function generate(THREE,{inside=false,kind='takeoff',partial=false,radius=18,openingWidth=18}={}){
  const root=new THREE.Group();root.name=inside?'deep-illuminated-bore-collar':'sealed-illuminated-tube-bulkhead';
  const maps=surfaceMaps(THREE),mats={
    ivory:new THREE.MeshStandardMaterial({color:0xc7c6b5,roughness:.57,metalness:.25}),
    replacement:new THREE.MeshStandardMaterial({color:0xd8d6c6,roughness:.58,metalness:.25}),
    graphite:new THREE.MeshStandardMaterial({color:0x414a50,roughness:.48,metalness:.72,...maps,normalScale:new THREE.Vector2(.3,.3)}),
    steel:new THREE.MeshStandardMaterial({color:0x718187,roughness:.4,metalness:.72}),
    dark:new THREE.MeshStandardMaterial({color:0x10191f,roughness:.8,side:THREE.DoubleSide}),
    brass:new THREE.MeshStandardMaterial({color:0xa98b56,roughness:.53,metalness:.65}),
    light:new THREE.MeshStandardMaterial({color:0xfff5de,emissive:0xfff2d2,emissiveIntensity:2.6,roughness:.3,toneMapped:false}),
  };
  for(const [name,mat]of Object.entries(mats)){mat.name='tube-gap-terminal-r1-'+name;if(['graphite','steel'].includes(name))mat.userData.slabFinish=true;}
  const sign=inside?-1:1,cy=inside?radius:-radius;
  const sweep=partial?openingWidth/radius:Math.PI*2,start=-sweep/2,end=sweep/2;
  const inner=inside?radius+.87:radius-4.5,outer=inside?radius+4:radius-.85;
  const front=.34,bed=1.12,back=4;
  function point(r,a,z){return [r*Math.sin(a),cy+sign*r*Math.cos(a),z];}
  function mesh(name,g,key){const m=new THREE.Mesh(g,mats[key]);m.name=name;root.add(m);return m;}
  function geometry(p,uv,indices){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
  function face(name,ri,ro,z,key,a=start,b=end,reverse=false){
    const count=Math.max(1,Math.ceil((b-a)*ro/.3)),p=[],uv=[],ix=[];
    for(let i=0;i<=count;i++){const angle=a+(b-a)*i/count;for(const r of [ri,ro]){const v=point(r,angle,z);p.push(...v);uv.push(v[0]/3,(v[1]-cy)/3);}}
    for(let i=0;i<count;i++){const n=i*2;if(ri>0)ix.push(n,n+1,n+2);ix.push(n+1,n+3,n+2);}
    // Polar order is clockwise on the outside face, anticlockwise inside.
    if(inside!==reverse)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
    return mesh(name,geometry(p,uv,ix),key);
  }
  function wall(name,r,z0,z1,key,a=start,b=end){
    const count=Math.max(1,Math.ceil((b-a)*r/.3)),p=[],uv=[],ix=[];
    for(let i=0;i<=count;i++){const angle=a+(b-a)*i/count;for(const z of [z0,z1]){p.push(...point(r,angle,z));uv.push(r*angle/3,z/3);}}
    for(let i=0;i<count;i++){const n=2*i;ix.push(n,n+1,n+2,n+1,n+3,n+2);}
    const g=geometry(p,uv,ix),m=mesh(name,g,key);m.material.side=THREE.DoubleSide;return m;
  }
  function block(name,a,r,z,w,h,d,key){const m=mesh(name,new THREE.BoxGeometry(w,h,d),key);m.position.set(...point(r,a,z));m.rotation.z=inside?a+Math.PI:-a;return m;}
  function bolt(a,r,z){const m=mesh('captive-terminal-fastener',new THREE.CylinderGeometry(.065,.065,.055,6),'steel');m.rotation.x=Math.PI/2;m.position.set(...point(r,a,z));}
  // A visible 4 m return gives the inner opening actual volume, entirely
  // outside R=18. Outside bulkhead stays wholly beneath its drivable skin.
  face('recessed-annular-service-bed',inner,outer,bed,'dark');
  face('closed-rear-annulus',inner,outer,back,'dark',start,end,true);
  wall('outer-armored-return',outer,front,back,'graphite');
  wall('inner-machined-return',inner,front,back,'steel');
  face('outer-ivory-rim',outer-.26,outer,front,'ivory');
  face('inner-ivory-rim',inner,inner+.25,front,'ivory');
  face('rim-recess-shadow',outer-.65,outer-.29,.64,'dark');
  const columns=partial?4:32,cell=sweep/columns;
  for(let i=0;i<columns;i++){
    const a=start+i*cell,b=a+cell,c=(a+b)/2,pad=.025;
    // Segmented optical covers sit in an annular well, behind both bezels.
    face('segmented-terminal-energy-cover',outer-.57,outer-.37,.46,'light',a+pad,b-pad);
    face('energy-channel-inner-bezel',outer-.7,outer-.63,front,'steel',a+.006,b-.006);
    face('energy-channel-outer-bezel',outer-.31,outer-.26,front,'steel',a+.006,b-.006);
    const low=inner+.42,high=outer-.92,mid=(low+high)/2;
    const family=i%4,plate=family===3?'replacement':'ivory';
    block('radial-ivory-cartridge-divider',a+.009,(inner+outer)/2,.57,.12,outer-inner-.12,.48,'ivory');
    for(const r of [inner+.15,outer-.13])bolt(c,r,.285);
    if(family===0){
      // Pipe cartridge: paired radial conduits with stepped sleeves and straps.
      for(const da of [-.029,.029]){
        const pipe=mesh('recessed-radial-conduit',new THREE.CylinderGeometry(.12,.12,high-low,12),'steel');
        pipe.position.set(...point(mid,c+da,.83));pipe.rotation.z=inside?c+da+Math.PI:-(c+da);
        for(const r of [low+.22,high-.22]){
          const sleeve=mesh('conduit-stepped-sleeve',new THREE.CylinderGeometry(.17,.17,.22,12),'brass');sleeve.position.set(...point(r,c+da,.83));sleeve.rotation.z=pipe.rotation.z;
        }
      }
      block('pipe-retaining-strap',c,mid,.61,mid*cell*.68,.12,.1,'ivory');
    }else if(family===1){
      for(let j=0;j<7;j++)block('recessed-cooling-fin',c,low+(j+.5)*(high-low)/7,.78,mid*cell*.7,.075,.3,'steel');
      block('cooling-service-status-light',c,inner+.3,.47,.42,.1,.06,'light');
    }else{
      face('segmented-access-armor',low,high,.67,plate,a+.026,b-.026);
      face('access-inset-metal-plate',low+.19,high-.18,.63,'graphite',a+.048,b-.048);
      block('recessed-access-latch',c,mid,.54,.28,.4,.12,'steel');
      for(const r of [low+.12,high-.12])bolt(c,r,.59);
      if(family===2)block('access-energy-indicator',c,low+.3,.57,.5,.08,.05,'light');
    }
    // Sparse transverse light keys echo the landing's bright receiving bars.
    if(i%4===0)block('radial-receiving-light-key',c,inner+.32,.39,mid*cell*.55,.12,.06,'light');
  }
  if(!inside){
    // Continuous opaque recessed closure, with concentric plate seams and a
    // central service hatch. It closes the shell rather than faking a dark void.
    face('opaque-bulkhead-closure',0,inner+.03,1.5,'dark');
    face('opaque-bulkhead-back',0,inner+.03,back,'dark',start,end,true);
    for(const [lo,hi]of [[0,4.1],[4.18,8.6],[8.68,inner-.08]]){
      const n=partial?4:16;
      for(let i=0;i<n;i++){
        const a=start+i*sweep/n,b=start+(i+1)*sweep/n;
        face('radial-brushed-bulkhead-plate',lo,hi,1.34,i%5===1?'steel':'graphite',a+.003,b-.003);
        if(lo>0)for(const r of [lo+.2,hi-.2])bolt((a+b)/2,r,1.27);
      }
    }
    face('bulkhead-hatch-ivory-ring',3.72,4.02,1.16,'ivory');
    face('bulkhead-hatch-light-well',3.41,3.66,1.28,'dark');
    const n=partial?3:16;
    for(let i=0;i<n;i++)face('bulkhead-hatch-segmented-energy',3.46,3.6,1.21,'light',start+(i+.12)*sweep/n,start+(i+.88)*sweep/n);
    if(!partial){
      block('central-sealed-service-hatch',0,0,1.24,3.1,3.1,.18,'steel');
      for(const x of [-.9,.9]){const handle=block('hatch-release-handle',0,0,1.09,.17,1.2,.12,'ivory');handle.position.x=x;}
    }
  }
  if(partial){
    // Seal the ends of each collar sector; no full ring across intact bypasses.
    for(const a of [start,end])block('closed-sector-return',a,(inner+outer)/2,(front+back)/2,.09,outer-inner,back-front,'ivory');
  }
  // Bake once so landing reflection and the shared material merger agree.
  root.updateMatrixWorld(true);
  root.traverse(m=>{
    if(!m.isMesh)return;m.geometry.applyMatrix4(m.matrixWorld);
    if(kind==='landing'){
      const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,-p.getZ(i));
      const ix=m.geometry.index;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}
      m.geometry.computeVertexNormals();
    }
    m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);
  });
  root.userData={inside,kind,partial,radius,depth:back,revision:'11-tube-termination-r1'};return root;
}
