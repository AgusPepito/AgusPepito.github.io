import {surfaceMaps} from './slab-surface-r1.js';

export const CHECKPOINT_HALF_LENGTH=15;

// C1 checkered deck + C2 optical instruments + recessed lamp cassettes.
// No typography. The crossing is Z=0; only the white curtain rises above Y=0.
export default function generate(THREE,{width=36,projection=true,rows=5}={}){
  const root=new THREE.Group();root.name='checkered-timing-station-r1';
  const grain=surfaceMaps(THREE),mats={
    ivory:new THREE.MeshStandardMaterial({color:0xd5d0bc,roughness:.48,metalness:.3,...grain,normalScale:new THREE.Vector2(.12,.12)}),
    graphite:new THREE.MeshStandardMaterial({color:0x303b43,roughness:.41,metalness:.72,...grain,normalScale:new THREE.Vector2(.27,.27)}),
    steel:new THREE.MeshStandardMaterial({color:0x82959b,roughness:.30,metalness:.85}),
    brass:new THREE.MeshStandardMaterial({color:0x9e8556,roughness:.43,metalness:.68}),
    dark:new THREE.MeshStandardMaterial({color:0x0c131a,roughness:.72}),
    glass:new THREE.MeshStandardMaterial({color:0x14242d,roughness:.12,metalness:.76}),
    light:new THREE.MeshStandardMaterial({color:0xfff8e8,emissive:0xfff8e8,emissiveIntensity:2.1,toneMapped:false}),
    curtain:new THREE.MeshBasicMaterial({color:0xfffaf0,transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide,vertexColors:true,blending:THREE.AdditiveBlending,toneMapped:false}),
  };
  for(const [key,m]of Object.entries(mats)){m.name='checkpoint-r1-'+key;if(['ivory','graphite','steel','brass','glass'].includes(key))m.userData.slabFinish=true;}
  function mesh(name,g,key,x=0,y=0,z=0){const m=new THREE.Mesh(g,mats[key]);m.name=name;m.position.set(x,y,z);root.add(m);return m;}
  const box=(name,x,y,z,w,h,d,key)=>mesh(name,new THREE.BoxGeometry(w,h,d),key,x,y,z);
  function horizontal(name,s,key,x,y,z,depth=.10){
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1});
    g.translate(0,0,-depth-.018);g.rotateX(-Math.PI/2);return mesh(name,g,key,x,y,z);
  }
  function plate(name,x,z,w,d,key,holes=[],circle=false,top=-.045){
    const b=.09,s=new THREE.Shape();
    s.moveTo(-w/2+b,-d/2);s.lineTo(w/2-b,-d/2);s.lineTo(w/2,-d/2+b);s.lineTo(w/2,d/2-b);s.lineTo(w/2-b,d/2);s.lineTo(-w/2+b,d/2);s.lineTo(-w/2,d/2-b);s.lineTo(-w/2,-d/2+b);s.closePath();
    for(const [hx,hz,hw,hd]of holes){const p=new THREE.Path(),hy=-hz;p.moveTo(hx-hw/2,hy-hd/2);p.lineTo(hx-hw/2,hy+hd/2);p.lineTo(hx+hw/2,hy+hd/2);p.lineTo(hx+hw/2,hy-hd/2);p.closePath();s.holes.push(p);}
    if(circle){const p=new THREE.Path();p.absarc(0,0,1.52,0,Math.PI*2,true);s.holes.push(p);}
    return horizontal(name,s,key,x,top,z);
  }
  function ring(x,z,outer,inner,y,key){const s=new THREE.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const p=new THREE.Path();p.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(p);return horizontal('concentric-instrument-bezel',s,key,x,y,z,.12);}
  function bolt(x,z,y=-.031){
    mesh('instrument-captive-washer',new THREE.CylinderGeometry(.065,.065,.022,12),'dark',x,y-.02,z);
    mesh('instrument-hex-fastener',new THREE.CylinderGeometry(.041,.041,.033,6),'steel',x,y,z);
    box('fastener-drive-recess',x,y+.018,z,.035,.003,.008,'dark');
  }
  function lens(x,z,r,y){
    mesh('recessed-optical-glass',new THREE.CylinderGeometry(r,r,.075,32),'glass',x,y,z);
    ring(x,z,r+.09,r+.01,y+.042,'steel');
  }
  function cassette(x,z,w=2.86){
    plate('timing-cassette-machined-rim',x,z,w,.56,'steel',[[0,0,w-.28,.30]],false,-.08);
    box('timing-cassette-dark-well',x,-.38,z,w-.08,.08,.50,'dark');
    for(let j=0;j<5;j++){
      const lx=x+(j-2)*(w-.55)/5;
      mesh('lamp-reflector-cup',new THREE.CylinderGeometry(.13,.13,.10,12),'graphite',lx,-.25,z);
      mesh('recessed-pearl-timing-lamp',new THREE.CylinderGeometry(.082,.082,.045,16),'light',lx,-.18,z);
    }
    for(const dx of [-w/2+.075,w/2-.075])bolt(x+dx,z,-.06);
  }
  function instrument(x,z){
    mesh('circular-well-opaque-floor',new THREE.CylinderGeometry(1.51,1.51,.10,40),'dark',x,-.93,z);
    ring(x,z,1.47,1.20,-.11,'ivory');
    ring(x,z,1.19,1.04,-.23,'steel');
    ring(x,z,1.02,.82,-.39,'graphite');
    ring(x,z,.81,.69,-.48,'brass');
    lens(x,z,.64,-.63);
    ring(x,z,.34,.30,-.566,'steel');
    mesh('optical-center-white-indicator',new THREE.CylinderGeometry(.06,.06,.028,16),'light',x,-.58,z);
    for(let n=0;n<24;n++){
      const a=n*Math.PI/12,s=Math.sin(a),c=Math.cos(a);
      const tick=box('radial-calibration-mark',x+s*1.34,-.103,z+c*1.34,.033,.006,n%3===0?.18:.095,'graphite');tick.rotation.y=a;
      if(n%3===0){bolt(x+s*1.43,z+c*1.43,-.086);const clamp=box('sensor-retaining-clamp',x+s*.95,-.345,z+c*.95,.13,.055,.21,'steel');clamp.rotation.y=a;}
      if(n%6===0)box('sensor-inner-status-pin',x+s*.89,-.327,z+c*.89,.055,.012,.055,'light');
    }
  }
  // Full tube belts use an even checker count so the closure alternates too.
  const columns=width>36?Math.max(2,2*Math.round(width/12)):Math.max(1,Math.round(width/6)),pitch=width/columns;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const first=root.children.length,z=(row-(rows-1)/2)*6,dark=(col+row)%2===1;
    const central=Math.abs(z)<.01;
    const circular=!central&&dark&&row%2===1;
    box('sealed-checker-tile-undertray',0,-1.08,z,5.99,.14,5.99,'dark');
    const holes=[[0,-2.28,2.90,.60],[0,2.28,2.90,.60]];
    if(central)holes.push([0,0,5.2,.94]);
    plate('beveled-'+(dark?'graphite':'ivory')+'-checker-tile',0,z,5.94,5.94,dark?'graphite':'ivory',holes,circular);
    if(circular)instrument(0,z);
    for(const dz of [-2.28,2.28])cassette(0,z+dz);
    for(const x of [-2.70,2.70])for(const dz of [-2.7,0,2.7])bolt(x,z+dz);
    // Small removable side covers remain text-free.
    for(const x of [-2.16,2.16]){
      plate('checker-service-lock-cover',x,z,.48,1.14,'graphite',[],false,-.024);
      for(const dz of [-.36,.36])box('service-cover-brass-lock',x,-.015,z+dz,.19,.016,.10,'brass');
    }
    if(central){
      box('white-curtain-emitter-well',0,-.43,z,5.20,.12,.94,'dark');
      for(let j=0;j<5;j++){
        const x=(j-2)*1.02;
        plate('crossing-projector-bezel',x,z,.94,.79,'steel',[[0,0,.69,.51]],false,-.078);
        box('projector-reflector-floor',x,-.32,z,.72,.065,.55,'graphite');
        for(const dz of [-.145,0,.145])box('white-curtain-origin-lens',x,-.205,z+dz,.61,.04,.065,'light');
        for(const dx of [-.40,.40])bolt(x+dx,z,-.054);
      }
    }
    if(row===0||row===rows-1){
      const dz=row===0?-2.83:2.83;
      // These lenses are mounted above the plate but still below driving Y=0.
      box('thin-perimeter-timing-strip',0,-.023,z+dz,5.22,.028,.065,'light');
    }
    const cx=-width/2+(col+.5)*pitch,scale=pitch/6;
    for(const m of root.children.slice(first)){m.position.x=cx+m.position.x*scale;m.scale.x*=scale;}
  }
  if(projection){
    const g=new THREE.PlaneGeometry(width,7,Math.ceil(width/.25),24);g.translate(0,3.505,0);
    const p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){const y=p.getY(i),v=Math.pow(Math.max(0,1-y/7.01),1.3)*(.86+.14*Math.cos(y*12));colors.push(v,v,v);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const curtain=mesh('checkpoint-white-curtain',g,'curtain');curtain.renderOrder=2;
  }
  const used=new Set(root.children.map(m=>m.material));Object.values(mats).forEach(m=>{if(!used.has(m))m.dispose();});
  root.userData={width,length:rows*6};return root;
}
