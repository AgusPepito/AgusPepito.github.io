// Shared unwrapped slab candidate. Metres; +Y is the driving normal.
// All relief lies below the nominal road except the flush lane placed by callers.
let maps;
function surfaceMaps(THREE){
  if(maps)return maps;
  const size=256,rough=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
  // Periodic directional grain: no seams, no per-frame randomness or painted highlights.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2,i=(y*size+x)*4;
    const grain=Math.sin(37*u+Math.sin(2*v)*.24)*.5+Math.sin(79*u+3*v)*.22+Math.sin(11*u-v)*.28;
    const polish=Math.sin(3*u+Math.sin(v))*.08+Math.cos(2*v-u)*.04;
    const r=Math.round(204+grain*24+polish*70);
    rough.set([r,r,r,255],i);
    const nx=grain*.14,ny=Math.cos(79*u+3*v)*.015,nz=Math.sqrt(1-nx*nx-ny*ny);
    normal.set([Math.round(128+nx*127),Math.round(128+ny*127),Math.round(128+nz*127),255],i);
  }
  const texture=data=>{
    const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;
    t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
  };
  maps={roughnessMap:texture(rough),normalMap:texture(normal)};return maps;
}

export default function generate(THREE,{width=36,length=100,columns=6,index=0}={}){
  const root=new THREE.Group();root.name='brushed-slab-candidate-r1';
  const textures=surfaceMaps(THREE);
  const mats={};
  for(const [name,color,roughness,metalness]of [
    ['graphite',0x454b50,.48,.72],['worn',0x51565a,.56,.66],
    ['replacement',0x62686c,.39,.78],['edge',0x747b7d,.35,.8],
  ]){
    mats[name]=new THREE.MeshStandardMaterial({color,roughness,metalness,...textures,normalScale:new THREE.Vector2(.32,.32),envMapIntensity:.85});
    mats[name].userData.slabFinish=true;
  }
  mats.joint=new THREE.MeshStandardMaterial({color:0x11191e,roughness:.86});
  mats.fastener=new THREE.MeshStandardMaterial({color:0x677176,roughness:.4,metalness:.75});
  mats.fastener.userData.slabFinish=true;
  mats.ivory=new THREE.MeshStandardMaterial({color:0xc6c9c3,roughness:.57,metalness:.25});
  for(const [name,mat]of Object.entries(mats))mat.name='slab-r1-'+name;

  // Quad patches retain real-world UV scale through both road and tube deformation.
  function patch(name,a,b,c,d,material){
    const across=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>d[i]-v))/.3));
    const along=Math.max(1,Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/1));
    const p=[],uv=[],idx=[];
    for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
      const u=i/across,v=j/along,q=a.map((_,k)=>a[k]*(1-u)*(1-v)+d[k]*u*(1-v)+b[k]*(1-u)*v+c[k]*u*v);
      p.push(...q);uv.push(q[0]/2,q[2]/4);
    }
    for(let j=0;j<along;j++)for(let i=0;i<across;i++){const n=j*(across+1)+i,t=n+across+1;idx.push(n,t,n+1,t,t+1,n+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,mats[material]);mesh.name=name;root.add(mesh);
  }
  function face(name,x,z,w,l,y,mat){patch(name,[x-w/2,y,z-l/2],[x-w/2,y,z+l/2],[x+w/2,y,z+l/2],[x+w/2,y,z-l/2],mat);}
  function plate(x,z,w,l,top,mat,bolts=false){
    const bevel=.065,base=-.085;
    face('brushed-metal-plate',x,z,w-bevel*2,l-bevel*2,top,mat);
    const outer=[[-w/2,-l/2],[-w/2,l/2],[w/2,l/2],[w/2,-l/2]];
    const inner=outer.map(([a,b])=>[a-Math.sign(a)*bevel,b-Math.sign(b)*bevel]);
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      patch('machined-slab-bevel',[x+outer[i][0],base,z+outer[i][1]],[x+outer[j][0],base,z+outer[j][1]],
        [x+inner[j][0],top,z+inner[j][1]],[x+inner[i][0],top,z+inner[i][1]],'edge');
    }
    if(bolts)for(const dx of [-w/2+.25,w/2-.25])for(const dz of [-l/2+.3,l/2-.3]){
      face('fastener-dark-seat',x+dx,z+dz,.2,.25,top+.001,'joint');
      face('flush-captive-fastener',x+dx,z+dz,.11,.15,top+.003,'fastener');
      face('fastener-driver-slot',x+dx,z+dz,.065,.023,top+.004,'joint');
    }
  }
  face('slab-recess-floor',0,0,width,length,-.09,'joint');
  const cell=width/columns;
  for(let col=0;col<columns;col++)for(let row=0,at=0;at<length;row++,at+=12.5){
    const span=Math.min(12.5,length-at),x=-width/2+(col+.5)*cell,z=length/2-at-span/2;
    const kind=(col*3+row+index*2)%5,w=cell-.055,l=span-.065;
    // Three quiet courses for every repair/split course; consistent construction logic.
    if(kind===0){
      const narrow=w*.24,gap=.055,main=w-narrow-gap;
      plate(x-(narrow+gap)/2,z,main,l,-.012,'graphite',true);
      plate(x+(main+gap)/2,z,narrow,l,-.03,'replacement',false);
    }else if(kind===3){
      const short=l*.3,gap=.055,long=l-short-gap;
      plate(x,z-(short+gap)/2,w,long,-.018,'worn',false);
      plate(x,z+(long+gap)/2,w,short,-.006,'replacement',true);
    }else plate(x,z,w,l,kind===1?-.028:-.012,kind===2?'worn':'graphite',kind===4);
  }
  if(columns===6)for(const side of [-1,1])face('flush-ivory-edge-trim',side*(width/2-.12),0,.24,length,.002,'ivory');
  root.userData={length,width,revision:'slab-candidate-r1',depth:.09};return root;
}
