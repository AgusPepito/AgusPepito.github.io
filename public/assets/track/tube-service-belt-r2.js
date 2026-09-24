// Recipe route B: one detailed ivory service-belt candidate, authored unwrapped.
// Twelve metres along the tube; all depth is relative to the nominal road skin.
// The caller removes the underlying skin before mapping this into either tube.
export const SERVICE_BELT_LENGTH=12;
export const SERVICE_BELT_VARIANTS=['pipe','cooling','access','armor'];
const patterns={
  mixed:['access','armor','pipe','armor','cooling','armor'],
  pipe:['pipe','pipe','armor','access','pipe','armor'],
  cooling:['cooling','armor','cooling','cooling','access','armor'],
  access:['access','access','armor','access','cooling','armor'],
  armor:['armor','armor','armor','access','armor','armor'],
};
export default function generate(THREE,{radius=18,length=SERVICE_BELT_LENGTH,variant='mixed',offset=0}={}) {
  const root=new THREE.Group();root.name=`ivory-service-belt-r2-${variant}`;
  const pattern=patterns[variant]||patterns.mixed;
  const circumference=2*Math.PI*radius,cell=circumference/24;
  const mats={
    ivory:new THREE.MeshStandardMaterial({color:0xc7c6b5,roughness:.57,metalness:.25}),
    replacement:new THREE.MeshStandardMaterial({color:0xd8d6c6,roughness:.64,metalness:.18}),
    aged:new THREE.MeshStandardMaterial({color:0xa8afa6,roughness:.7,metalness:.3}),
    dark:new THREE.MeshStandardMaterial({color:0x101b22,roughness:.84}),
    steel:new THREE.MeshStandardMaterial({color:0x667a7f,roughness:.42,metalness:.72}),
    edge:new THREE.MeshStandardMaterial({color:0x94a4a2,roughness:.43,metalness:.6}),
    brass:new THREE.MeshStandardMaterial({color:0xa98b56,roughness:.53,metalness:.65}),
    lamp:new THREE.MeshStandardMaterial({color:0xe7dcc2,emissive:0xe7dcc2,emissiveIntensity:.55,roughness:.6}),
  };
  for(const [key,mat]of Object.entries(mats))mat.name='belt-r2-'+key;
  let family='armor';
  function mesh(name,geometry,material,x=0,y=0,z=0){
    const m=new THREE.Mesh(geometry,mats[material]);m.name=name;m.position.set(x,y,z);m.userData.serviceFamily=family;root.add(m);return m;
  }
  function skin(name,x,z,w,l,y,material){
    const g=new THREE.PlaneGeometry(w,l,Math.max(1,Math.ceil(w/.2)),Math.max(1,Math.ceil(l/.5)));g.rotateX(-Math.PI/2);return mesh(name,g,material,x,y,z);
  }
  function box(name,x,y,z,w,h,l,material){return mesh(name,new THREE.BoxGeometry(w,h,l,Math.max(1,Math.ceil(w/.2)),1,Math.max(1,Math.ceil(l/.5))),material,x,y,z);}
  function quad(name,a,b,c,d,material){
    const along=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>d[i]-v))/.2));
    const across=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/.3));
    const p=[],indices=[];
    for(let j=0;j<=across;j++)for(let i=0;i<=along;i++){
      const u=i/along,v=j/across;
      for(let k=0;k<3;k++)p.push(a[k]*(1-u)*(1-v)+d[k]*u*(1-v)+b[k]*(1-u)*v+c[k]*u*v);
    }
    for(let j=0;j<across;j++)for(let i=0;i<along;i++){
      const n=j*(along+1)+i,t=n+along+1;indices.push(n,t,n+1,t,t+1,n+1);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(p.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();return mesh(name,g,material);
  }
  function ring(name,x,z,outerW,outerL,innerW,innerL,top,bottom,material){
    const o=[[-outerW/2,-outerL/2],[-outerW/2,outerL/2],[outerW/2,outerL/2],[outerW/2,-outerL/2]];
    const n=[[-innerW/2,-innerL/2],[-innerW/2,innerL/2],[innerW/2,innerL/2],[innerW/2,-innerL/2]];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      quad(name,[x+o[i][0],top,z+o[i][1]],[x+o[j][0],top,z+o[j][1]],
        [x+n[j][0],bottom,z+n[j][1]],[x+n[i][0],bottom,z+n[i][1]],material);
    }
  }
  function bolt(x,z,y=.07){mesh('captive-hex-bolt',new THREE.CylinderGeometry(.065,.065,.055,6),'edge',x,y,z);}
  const glyphs={P:['110','101','110','100','100'],C:['111','100','100','100','111'],A:['010','101','111','101','101']};
  function stencil(x,z,letter){
    box('bolted-identification-plaque',x+.085,-.01,z+.17,.36,.14,.54,'aged');
    for(const [row,bits]of glyphs[letter].entries())for(let col=0;col<3;col++)if(bits[col]==='1')skin('panel-function-stencil',x+col*.085,z+row*.085,.07,.07,.064,'dark');
  }
  for(let i=0;i<24;i++){
    const x=-circumference/2+(i+.5)*cell,w=cell-.045;
    family=pattern[((i+offset)%pattern.length+pattern.length)%pattern.length];
    const ivory=i%7===1?'replacement':i%7===4?'aged':'ivory';
    // Continuous segmented ivory section, with a dark gasket at each join.
    skin('armor-panel-joint',x,0,cell,6,-.025,'dark');
    // Remove the backing under open trays; a dark floor closes only visible depth.
    if(family==='pipe'||family==='cooling'){
      // Do not leave the joint sheet spanning the cavity aperture.
      const joint=root.children[root.children.length-1];root.remove(joint);joint.geometry.dispose();
      ring('outer-joint-gasket',x,0,cell,6,w-.04,5.91,-.025,-.025,'dark');
      ring('chamfered-ivory-tray-frame',x,0,w,5.94,w-1.05,4.45,.045,-.12,ivory);
      ring('machined-tray-inner-bevel',x,0,w-1.05,4.45,w-1.23,4.27,-.12,-.23,'edge');
      ring('deep-recess-walls',x,0,w-1.23,4.27,w-1.23,4.27,-.23,-.7,'dark');
      skin('recess-floor',x,0,w-1.23,4.27,-.7,'dark');
      if(family==='pipe'){
        for(const dx of variant==='pipe'?[-.78,.78]:[-.94,0,.94]){
          const pipeRadius=variant==='pipe'?.23:.17;
          const pipe=mesh('broad-service-conduit',new THREE.CylinderGeometry(pipeRadius,pipeRadius,3.96,14,8),'steel',x+dx,-.43,0);pipe.rotation.x=Math.PI/2;
          for(const z of [-1.37,1.37]){
            const collar=mesh('stepped-conduit-coupling',new THREE.CylinderGeometry(.235,.235,.44,12),'edge',x+dx,-.43,z);collar.rotation.x=Math.PI/2;
            for(const dz of [-.21,.21]){const seal=mesh('coupling-retaining-ring',new THREE.CylinderGeometry(.25,.25,.065,12),'brass',x+dx,-.43,z+dz);seal.rotation.x=Math.PI/2;}
          }
        }
        for(const z of [-.86,.86])box('recessed-pipe-retaining-strap',x,-.18,z,w-1.25,.085,.16,'aged');
        if(variant!=='pipe'){
          box('offset-valve-block',x+.94,-.23,.28,.46,.21,.49,'dark');
          box('valve-access-handle',x+.94,-.085,.28,.35,.075,.13,'brass');
        }
        if(variant==='pipe'){
          box('twin-feed-manifold',x,-.39,-1.82,w-1.4,.38,.42,'edge');
          box('manifold-identification-inset',x,-.192,-1.82,.68,.012,.23,'dark');
          for(const dx of [-.78,.78]){
            box('manifold-valve-housing',x+dx,-.27,-.3,.53,.28,.52,'aged');
            const wheel=mesh('recessed-valve-wheel',new THREE.TorusGeometry(.19,.045,6,12),'brass',x+dx,-.09,-.3);wheel.rotation.x=Math.PI/2;
            box('valve-wheel-crossbar',x+dx,-.09,-.3,.34,.06,.06,'brass');
          }
        }
        stencil(x-w/2+.18,-2.7,'P');
      }else{
        if(variant==='cooling'){
          for(const side of [-1,1])for(let z=-1.82;z<1.95;z+=.43){
            const blade=box('split-bank-cooling-louver',x+side*.88,-.3,z,1.38,.1,.36,'steel');blade.rotation.x=side*.48;
          }
          box('cooling-bank-divider',x,-.2,0,.22,.28,4.12,'edge');
          for(const z of [-1.72,1.72])box('cooling-bank-end-brace',x,-.13,z,w-1.35,.1,.14,'aged');
          for(let dx=-.13;dx<=.14;dx+=.13)box('central-heat-sink-fin',x+dx,-.085,0,.035,.09,2.65,'brass');
        }else for(let z=-1.84;z<2;z+=.43){
          const blade=box('deep-cooling-louver',x,-.25,z,w-1.3,.1,.38,'steel');blade.rotation.x=-.42;
        }
        for(const dx of [-.95,.95])box('cooling-cartridge-spine',x+dx,-.15,0,.105,.15,4.1,'aged');
        for(const dx of [-w/2+.73,w/2-.73])box('cooling-release-catch',x+dx,-.055,1.79,.19,.1,.35,'brass');
        stencil(x-w/2+.18,-2.7,'C');
      }
    }else if(family==='access'){
      const joint=root.children[root.children.length-1];root.remove(joint);joint.geometry.dispose();
      ring('outer-joint-gasket',x,0,cell,6,w-.04,5.91,-.025,-.025,'dark');
      ring('access-armor-bevel',x,0,w,5.94,w-.42,5.52,.02,.052,ivory);
      ring('access-door-seal',x,0,w-.42,5.52,w-.65,5.28,.013,.013,'dark');
      const doorW=w-.65;
      // Asymmetric split door. A real cutout exposes the handle pocket.
      skin('narrow-replacement-door',x+doorW*.34,0,doorW*.29,5.28,.036,'replacement');
      const left=x-doorW*.155, leftW=doorW*.68, pocketZ=.45,pocketL=.72,pocketW=.86;
      const front=2.64,back=-2.64;
      skin('main-access-door-forward',left,(pocketZ+pocketL/2+front)/2,leftW,front-pocketZ-pocketL/2,.035,ivory);
      skin('main-access-door-aft',left,(back+pocketZ-pocketL/2)/2,leftW,pocketZ-pocketL/2-back,.035,ivory);
      for(const side of [-1,1])skin('main-access-door-pocket-side',left+side*(leftW+pocketW)/4,pocketZ,(leftW-pocketW)/2,pocketL,.035,ivory);
      ring('handle-pocket-bevel',left,pocketZ,pocketW,pocketL,pocketW-.16,pocketL-.16,.035,-.16,'edge');
      skin('handle-pocket',left,pocketZ,pocketW-.16,pocketL-.16,-.16,'dark');
      box('recessed-door-handle',left,-.07,pocketZ,.5,.1,.12,'edge');
      for(const z of [-1.7,1.7]){
        box('broad-hatch-hinge',x-w/2+.42,.053,z,.25,.085,.57,'steel');
        box('quarter-turn-door-lock',x+w/2-.42,.053,z,.18,.065,.36,'brass');
      }
      if(variant==='access'){
        for(const z of [-1.23,1.7]){
          box('hatch-reinforcement-strap',left,.057,z,leftW-.18,.04,.17,'aged');
          for(const dx of [-leftW/2+.22,leftW/2-.22])bolt(left+dx,z,.09);
        }
        for(const z of [-.85,.85])box('additional-quarter-turn-lock',x+w/2-.42,.053,z,.18,.065,.36,'brass');
        skin('replacement-door-label-seat',x+doorW*.34,-.9,.63,.65,.048,'aged');
        for(let row=0;row<3;row++)skin('hatch-identification-bar',x+doorW*.34,-1.07+row*.16,.4-row*.08,.055,.051,'dark');
      }
      stencil(x-w/2+.24,-2.53,'A');
    }else{
      ring('quiet-armor-edge-bevel',x,0,w,5.94,w-.36,5.58,.02,.055,ivory);
      skin('quiet-curved-ivory-plate',x,0,w-.36,5.58,.055,ivory);
      skin('offset-plate-seam',x+.67,0,.06,5.5,.058,'dark');
      if(variant==='armor'){
        if(i%3===0){
          skin('broad-replacement-armor-inlay',x-.62,.35,2.08,3.45,.064,'replacement');
          for(const dx of [-.82,.82])for(const z of [-1.18,1.88])bolt(x-.62+dx,z,.09);
        }
        if(i%4===0){
          skin('inspection-marker-gasket',x-.62,-1.67,1.04,.26,.064,'dark');
          skin('neutral-service-marker',x-.62,-1.67,.66,.1,.068,'lamp');
        }
      }else{
        skin('replacement-inspection-plate',x-.62,.7,1.25,1.6,.064,'aged');
        for(const dz of [-.63,.63])bolt(x-.62,.7+dz,.095);
        skin('inspection-marker-gasket',x-.62,-1.67,1.04,.26,.064,'dark');
        skin('neutral-service-marker',x-.62,-1.67,.66,.1,.068,'lamp');
      }
    }
    for(const dx of [-w/2+.2,w/2-.2])for(const z of [-2.67,2.67])bolt(x+dx,z);
    // Broad neutral latch seats are visible on approach, not phase indicators.
    for(const z of [-2.87,2.87])skin('edge-locking-seat',x+.6,z,.48,.14,.057,'steel');
  }
  // Widen the accepted composition along travel only. Keep hex heads round
  // while increasing panel spans and spacing; radius and recess depth stay fixed.
  root.scale.z=length/6;
  for(const part of root.children)if(part.name==='captive-hex-bolt')part.scale.z=6/length;
  root.userData={revision:'tube-service-r2',variant,offset,length,radius,depth:.7,
    visibility:'Ivory armor, open mechanical trays, louvers and access doors. No equipment behind closed armor; no hidden tube skeleton.'};
  return root;
}
