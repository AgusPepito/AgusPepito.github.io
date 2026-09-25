import {omitFaces,openBottomBox,topCylinder} from './geometry-cleanup.js';
import {surfaceMaps} from './slab-surface-r1.js';

// F1 cable manifold + F2 capacitor bank. Metres, +Y driving normal,
// travel toward -Z, crossing at Z=0. The extended station spans Z=-9 to +15.
// Hardware is recessed; the curtain is the only part above the driving skin.
export const EMITTER_APPROACH=15;
export const EMITTER_DEPARTURE=9;
export function setEmitterColor(root,color){
  const materials=new Set();
  root.traverse(n=>{if(n.isMesh)for(const m of (Array.isArray(n.material)?n.material:[n.material]))if(m.userData.phaseTint)materials.add(m);});
  for(const m of materials){m.color.set(color);if(m.emissive)m.emissive.set(color);}
  root.userData.phaseColor=color;
}

export default function generate(THREE,{width=36,color=0x4de1ff,projection=true,reuseModules=false,firstModuleOnly=false}={}){
  const root=new THREE.Group();root.name='recessed-phase-emitter-f1-f2-r1';
  const grain=surfaceMaps(THREE),mats={
    ivory:new THREE.MeshStandardMaterial({color:0xcec9b8,metalness:.32,roughness:.49,...grain,normalScale:new THREE.Vector2(.12,.12)}),
    graphite:new THREE.MeshStandardMaterial({color:0x444c52,metalness:.74,roughness:.42,...grain,normalScale:new THREE.Vector2(.28,.28)}),
    steel:new THREE.MeshStandardMaterial({color:0x829299,metalness:.83,roughness:.32}),
    brass:new THREE.MeshStandardMaterial({color:0xad8952,metalness:.7,roughness:.42}),
    dark:new THREE.MeshStandardMaterial({color:0x10181e,roughness:.78}),
    cable:new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.24,metalness:.28,roughness:.4}),
    energy:new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.5,metalness:.15,roughness:.22,toneMapped:false}),
    glass:new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,metalness:.55,roughness:.18}),
    curtain:new THREE.MeshBasicMaterial({color,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide,vertexColors:true,blending:THREE.AdditiveBlending,toneMapped:false}),
  };
  for(const [key,m]of Object.entries(mats)){
    m.name='phase-emitter-r1-'+key;
    if(['ivory','graphite','steel','brass','cable','glass'].includes(key))m.userData.slabFinish=true;
    if(['cable','energy','glass','curtain'].includes(key))m.userData.phaseTint=true;
  }
  function mesh(name,g,key,x=0,y=0,z=0){const m=new THREE.Mesh(g,mats[key]);m.name=name;m.position.set(x,y,z);root.add(m);return m;}
  function box(name,x,y,z,w,h,d,key){return mesh(name,openBottomBox(THREE,w,h,d),key,x,y,z);}
  // A horizontal beveled plate with real openings, not painted black overlays.
  function plate(name,x,z,w,d,key='ivory',holes=[],top=-.045){
    const b=Math.min(.10,w/8,d/8),s=new THREE.Shape();
    s.moveTo(-w/2+b,-d/2);s.lineTo(w/2-b,-d/2);s.lineTo(w/2,-d/2+b);s.lineTo(w/2,d/2-b);s.lineTo(w/2-b,d/2);s.lineTo(-w/2+b,d/2);s.lineTo(-w/2,d/2-b);s.lineTo(-w/2,-d/2+b);s.closePath();
    for(const [hx,hz,hw,hd]of holes){const p=new THREE.Path();p.moveTo(hx-hw/2,hz-hd/2);p.lineTo(hx-hw/2,hz+hd/2);p.lineTo(hx+hw/2,hz+hd/2);p.lineTo(hx+hw/2,hz-hd/2);p.closePath();s.holes.push(p);}
    const g=new THREE.ExtrudeGeometry(s,{depth:.10,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1});
    // Mirror shape Y to world Z, then turn extrusion toward +Y.
    g.rotateX(-Math.PI/2);g.scale(1,1,-1);
    // Reflection reverses winding; correct it while preserving the UVs.
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i+=3)for(const a of [p,n,uv])for(let k=0;k<a.itemSize;k++){
      const j=(i+1)*a.itemSize+k,l=(i+2)*a.itemSize+k,t=a.array[j];a.array[j]=a.array[l];a.array[l]=t;
    }
    g.computeVertexNormals();omitFaces(THREE,g,1,-1);return mesh(name,g,key,x,top-.118,z);
  }
  function bolt(x,z,y=-.032){
    mesh('captive-washer',topCylinder(THREE,.07,.025,8),'dark',x,y-.025,z);
    mesh('hex-fastener',topCylinder(THREE,.045,.04,6),'steel',x,y,z);
    box('fastener-slot',x,y+.021,z,.038,.004,.009,'dark');
  }
  function cylinder(name,x,y,z,r,length,key){const m=mesh(name,new THREE.CylinderGeometry(r,r,length,r>=.3?12:8,1,name==='capacitor-ceramic-body'),key,x,y,z);m.rotation.x=Math.PI/2;return m;}
  function cable(points,r,key='cable'){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh('routed-charging-cable',new THREE.TubeGeometry(curve,Math.max(12,(points.length-1)*5),r,6,false),key);
  }
  function well(x,z,w,d){
    box('deep-machined-well-floor',x,-1.22,z,w,.14,d,'dark');
    for(const side of [-1,1]){
      const longWall=box('well-long-wall',x+side*(w/2-.05),-.65,z,.10,1.08,d,'graphite');
      const endWall=box('well-end-wall',x,-.65,z+side*(d/2-.05),w,1.08,.10,'graphite');
      // Only the cavity-facing walls are exposed; their outer faces sit under armor.
      omitFaces(THREE,longWall.geometry,0,side);
      omitFaces(THREE,endWall.geometry,2,side);
    }
  }
  function capacitor(x,z,length){
    cylinder('capacitor-ceramic-body',x,-.68,z,.40,length,'graphite');
    for(const sign of [-1,1]){
      const end=z+sign*length/2;
      cylinder('capacitor-stepped-end',x,-.68,end,.43,.15,'steel');
      cylinder('terminal-brass-collar',x,-.68,end+sign*.10,.27,.13,'brass');
      cylinder('terminal-insulating-boot',x,-.68,end+sign*.20,.19,.12,'dark');
      cylinder('capacitor-phase-band',x,-.68,z+sign*length*.30,.414,.14,'energy');
      cylinder('capacitor-band-seal',x,-.68,z+sign*(length*.30+.1),.423,.055,'dark');
      box('cell-mount-saddle',x,-1.05,z+sign*length*.33,.99,.2,.26,'steel');
      for(const dx of [-.46,.46])bolt(x+dx,z+sign*length*.33,-.9);
    }
    for(const dx of [-.31,.31])box('capacitor-longitudinal-rib',x+dx,-.50,z,.055,.06,length*.76,'steel');
    plate('capacitor-identification-tab',x,z,.22,.48,'brass',[],-.22);
    for(const dz of [-.12,0,.12])box('capacitor-tab-engraving',x,-.218,z+dz,.13,.003,.022,'dark');
  }
  const count=Math.max(1,Math.round(width/6)),pitch=width/count,scale=pitch/6;
  let moduleParts;
  for(let i=0;i<(firstModuleOnly?1:count);i++){
    const first=root.children.length,cx=-width/2+(i+.5)*pitch;
    if(reuseModules&&moduleParts){
      for(const part of moduleParts){const m=part.clone();m.geometry=part.geometry.clone();root.add(m);}
    }else{
    box('sealed-station-undertray',0,-1.39,3,5.98,.18,11.98,'graphite');
    plate('perforated-ivory-station-frame',0,3,5.94,11.94,'ivory',[
      [-.77,1.65,3.32,6.60],[1.94,1.65,1.24,6.60],[-.77,-4.68,3.32,1.78],[1.94,-4.68,1.24,1.78],[0,-3,5.18,.86],
      ...[-.6,.6].map(z=>[0,z-3,5.04,.085]),
      ...[8.46,1,-2.77].map(z=>[-.75,z-3,3.26,z===8.46?.59:z<0?.26:.33]),
      ...[-2.74,1.1,2.75].flatMap(x=>[2.15,6.65].map(z=>[x,z-3,.18,.78])),
    ]);
    well(-.77,4.65,3.32,6.6);well(1.94,4.65,1.24,6.6);
    well(-.77,-1.68,3.32,1.78);well(1.94,-1.68,1.24,1.78);
    well(0,0,5.18,.86);
    for(const x of [-1.58,.04]){
      capacitor(x,4.8,3.35);capacitor(x,-1.68,.72);
      cable([[x,-.68,2.78],[x,-.64,2.30],[x+.22,-.48,1.89],[x+.22,-.40,.72]],.095);
      box('terminal-socket-block',x+.22,-.43,.78,.36,.35,.32,'brass');
      for(const z of [7.05,7.27,7.49])box('submerged-power-busbar',x,-.81,z,.89,.10,.09,'steel');
    }
    // F1: three phase-colored feeder cables with boots, couplings and combs.
    for(let j=0;j<3;j++){
      const x=1.57+j*.35;
      cable([[x,-.49,7.76],[x,-.46,6.8],[x,-.46,3.2],[x,-.48,1.45],[x-.16,-.39,.71]],.105);
      for(const z of [2.2,6.8,7.55]){
        cylinder('charging-cable-brass-coupling',x,-.46,z,.146,.22,'brass');
        for(const dz of [-.19,-.13,.13,.19])cylinder('charging-cable-ribbed-sleeve',x,-.46,z+dz,.132,.042,'dark');
      }
      for(const z of [3.5,5.4])box('recessed-cable-comb-tooth',x,-.31,z,.29,.075,.19,'ivory');
      cylinder('feed-termination-socket',x,-.49,7.94,.16,.20,'steel');
      cylinder('rear-return-cable',x,-.5,-1.65,.11,1.16,'cable');
    }
    for(const z of [3.5,5.4])for(const x of [1.4,2.49])bolt(x,z,-.28);
    // F2: optical cartridges sit in the transverse crossing trench.
    for(let j=0;j<5;j++){
      const x=-2.06+j*1.03;
      plate('projector-machined-bezel',x,0,.93,.72,'steel',[[0,0,.67,.47]],-.09);
      box('projector-reflector-bed',x,-.43,0,.78,.12,.57,'steel');
      box('recessed-optical-glass',x,-.245,0,.65,.07,.45,'glass');
      for(const dz of [-.13,.13])box('projector-energy-filament',x,-.193,dz,.56,.025,.045,'energy');
      box('lens-center-divider',x,-.181,0,.028,.025,.45,'dark');
      for(const dx of [-.40,.40])bolt(x+dx,0,-.067);
    }
    for(const z of [-.60,.60])box('crossing-line-recessed-phase-strip',0,-.075,z,5.02,.025,.055,'energy');
    // Service access, vents, hinges and deeply separated plate seams.
    for(const z of [8.46,1.0,-2.77]){
      plate('removable-service-hatch',-.75,z,3.22,z===8.46?.55:z<0?.22:.29,'graphite',[], -.078);
      for(const x of [-2.2,.7])bolt(x,z,-.055);
      box('recessed-hatch-latch',-.75,-.083,z,.27,.024,.095,'brass');
    }
    for(const x of [-2.74,1.1,2.75]){
      for(const z of [-2.66,.8,3.1,5.8,8.65])bolt(x,z);
      for(const z of [2.15,6.65]){
        plate('narrow-service-vent-bezel',x,z,.28,.92,'steel',[[0,0,.13,.68]],-.026);
        for(let n=0;n<6;n++)box('inset-service-vent-louver',x,-.21,z-.27+n*.108,.12,.045,.045,'dark');
      }
    }
    for(const z of [-2.94,8.94])box('flush-station-end-seal',0,-.17,z,5.94,.23,.09,'dark');
    // Six metres of additional machinery on BOTH ends. Repeat real hardware
    // at its authored proportions instead of stretching fasteners and cells.
    for(const z of [-6,12]){
      box('extension-sealed-undertray',0,-1.39,z,5.98,.18,5.98,'graphite');
      plate('extension-ivory-service-frame',0,z,5.94,5.94,'ivory',[
        [-.77,0,3.32,4.65],[1.94,0,1.24,4.65],
        ...[-2.64,2.64].map(dz=>[-.75,dz,3.26,.30]),
        ...[-2.74,1.1,2.75].map(x=>[x,0,.18,.78]),
      ]);
      well(-.77,z,3.32,4.65);well(1.94,z,1.24,4.65);
      for(const x of [-1.58,.04]){
        capacitor(x,z,2.8);
        for(const side of [-1,1]){
          cable([[x,-.68,z+side*1.66],[x,-.64,z+side*1.96],[x+.3,-.49,z+side*2.13]],.095);
          box('extension-cell-busbar',x,-.98,z+side*1.96,.94,.10,.09,'brass');
        }
      }
      for(let j=0;j<3;j++){
        const x=1.57+j*.35;
        cable([[x,-.49,z-2.14],[x,-.46,z-1],[x,-.46,z+1],[x,-.49,z+2.14]],.105);
        for(const dz of [-1.86,1.86]){
          cylinder('extension-feed-coupling',x,-.49,z+dz,.146,.22,'brass');
          for(const rib of [-.19,-.13,.13,.19])cylinder('extension-ribbed-boot',x,-.49,z+dz+rib,.132,.042,'dark');
        }
        for(const dz of [-.85,.85])box('extension-cable-comb',x,-.31,z+dz,.29,.075,.19,'ivory');
      }
      for(const dz of [-2.64,2.64]){
        plate('extension-maintenance-hatch',-.75,z+dz,3.22,.26,'graphite',[],-.078);
        box('extension-hatch-lock',-.75,-.067,z+dz,.27,.025,.09,'brass');
        for(const x of [-2.2,.7])bolt(x,z+dz,-.055);
      }
      for(const x of [-2.74,1.1,2.75]){
        plate('extension-cooling-bezel',x,z,.28,.92,'steel',[[0,0,.13,.68]],-.026);
        for(let n=0;n<6;n++)box('extension-cooling-louver',x,-.21,z-.27+n*.108,.12,.045,.045,'dark');
        for(const dz of [-2.65,-1.3,1.3,2.65])bolt(x,z+dz);
      }
      for(const dz of [-2.94,2.94])box('extension-end-seal',0,-.17,z+dz,5.94,.23,.09,'dark');
    }
    if(reuseModules)moduleParts=root.children.slice(first).map(m=>m.clone());
    }
    // Every detail follows the road's curvature. No tangent-mounted parts can
    // poke above the outside-tube skin. Scale pitch to close the ring exactly.
    for(const m of root.children.slice(first)){m.position.x=cx+m.position.x*scale;m.scale.x*=scale;}
  }
  if(projection){
    const g=new THREE.PlaneGeometry(width,7,Math.ceil(width/.25),24);g.translate(0,3.51,0);
    const p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){
      const h=p.getY(i),fade=Math.pow(Math.max(0,1-h/7.02),1.6),scan=.74+.26*Math.cos(h*13);
      const v=fade*scan;colors.push(v,v,v);
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const m=mesh('phase-projection-curtain',g,'curtain');m.renderOrder=2;
  }
  // Discard only materials that were never used (e.g. hardware-only study).
  const used=new Set(root.children.map(m=>m.material));Object.values(mats).forEach(m=>{if(!used.has(m))m.dispose();});
  root.userData.phaseColor=color;return root;
}
