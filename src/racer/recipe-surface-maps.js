// Shared procedural finishes applied by the game after loading recipe assets.
let maps;
export function surfaceMaps(THREE){
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
    t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
    t.userData.sharedTrackResource=true;return t;
  };
  maps={roughnessMap:texture(rough),normalMap:texture(normal)};return maps;
}

