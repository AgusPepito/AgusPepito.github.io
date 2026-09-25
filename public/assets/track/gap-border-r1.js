import {topCylinder} from './geometry-cleanup.js';
// A partial opening's lateral edge. X=0 is the cut; intact road is +X.
// Flush fixtures occupy the intact side, with only exposed fascia below it.
export default function generate(THREE,{length=12.5}={}){
  const root=new THREE.Group();root.name='partial-gap-illuminated-border';
  const mats={
    ivory:new THREE.MeshStandardMaterial({color:0xc6c9c3,roughness:.57,metalness:.25}),
    steel:new THREE.MeshStandardMaterial({color:0x66767d,roughness:.4,metalness:.72}),
    dark:new THREE.MeshStandardMaterial({color:0x11191f,roughness:.8}),
    light:new THREE.MeshStandardMaterial({color:0xfff5de,emissive:0xfff2d2,emissiveIntensity:2.3,toneMapped:false}),
  };
  for(const [key,mat]of Object.entries(mats)){mat.name='gap-border-r1-'+key;if(key==='steel')mat.userData.slabFinish=true;}
  function box(name,x,y,z,w,h,l,key){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mats[key]);m.name=name;m.position.set(x,y,z);root.add(m);}
  box('cut-side-recessed-web',.1,-.47,0,.2,.77,length,'dark');
  box('cut-side-lower-flange',.12,-.85,0,.24,.13,length,'steel');
  box('border-recess-floor',.32,-.18,0,.64,.06,length,'dark');
  box('flush-border-ivory-rail',.12,-.035,0,.24,.07,length,'ivory');
  const count=Math.max(1,Math.ceil(length/2.5)),cell=length/count;
  for(let i=0;i<count;i++){
    const z=-length/2+(i+.5)*cell,l=cell-.08;
    box('replaceable-side-web',.025,-.46,z,.045,.57,l,'steel');
    box('side-web-fastener-seat',.06,-.46,z-l/2+.08,.12,.72,.12,'ivory');
    // Housing sits in a reserved 0.64 m strip of road; the light is below Y=0.
    box('border-optical-well',.43,-.13,z,.38,.1,l,'dark');
    for(const x of [.265,.595])box('border-light-bezel',x,-.055,z,.05,.11,l,'steel');
    for(const s of [-1,1])box('border-light-end-cap',.43,-.055,z+s*(l/2-.07),.38,.11,.14,'ivory');
    const tiles=Math.max(1,Math.floor(l/.65)),usable=l-.34;
    for(let j=0;j<tiles;j++)box('recessed-border-light-tile',.43,-.042,z-usable/2+(j+.5)*usable/tiles,.25,.024,usable/tiles-.04,'light');
    for(const x of [.12,.43])for(const s of [-1,1]){
      const bolt=new THREE.Mesh(topCylinder(THREE,.032,.012,6),mats.steel);
      bolt.name='flush-border-fastener';bolt.position.set(x,-.003,z+s*(l/2-.08));root.add(bolt);
    }
  }
  root.userData={width:.64,length,depth:.915,lightRecess:.03};return root;
}
