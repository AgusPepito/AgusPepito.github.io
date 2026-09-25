import {surfaceMaps} from './slab-surface-r1.js';

// Recessed optical fixtures inspired by the approved top-surface concept.
export default function generate(THREE,{kind='takeoff',width=36,length=12}={}){
  const root=new THREE.Group();root.name=`gap-${kind}-energy-surface-r2`;
  const maps=surfaceMaps(THREE),scale=width/36;
  const mats={
    plate:new THREE.MeshStandardMaterial({color:0x454b50,roughness:.48,metalness:.72,...maps,normalScale:new THREE.Vector2(.32,.32),envMapIntensity:.85}),
    replacement:new THREE.MeshStandardMaterial({color:0x62686c,roughness:.43,metalness:.74,...maps,normalScale:new THREE.Vector2(.32,.32)}),
    ivory:new THREE.MeshStandardMaterial({color:0xc6c9c3,roughness:.48,metalness:.32}),
    steel:new THREE.MeshStandardMaterial({color:0x748083,roughness:.36,metalness:.78}),
    dark:new THREE.MeshStandardMaterial({color:0x10171b,roughness:.8}),
    diffuser:new THREE.MeshStandardMaterial({color:0xbacbd0,emissive:0xc6d5d6,emissiveIntensity:.6,roughness:.4}),
    light:new THREE.MeshStandardMaterial({color:0xfff5de,emissive:0xfff2d2,emissiveIntensity:2.8,roughness:.25,toneMapped:false}),
  };
  for(const [key,mat]of Object.entries(mats)){mat.name='gap-top-r2-'+key;if(['plate','replacement','steel'].includes(key))mat.userData.slabFinish=true;}
  const fixtures=[];
  function stroke(points,w){
    const edges=points.slice(1).map((p,i)=>{const dx=p[0]-points[i][0],dz=p[1]-points[i][1],l=Math.hypot(dx,dz);return [-dz/l,dx/l];});
    const left=[],right=[];
    points.forEach(([x,z],i)=>{
      const a=edges[Math.max(0,i-1)],b=edges[Math.min(i,edges.length-1)];
      let nx=a[0]+b[0],nz=a[1]+b[1],l=Math.hypot(nx,nz);nx/=l;nz/=l;
      const d=w/2/(nx*b[0]+nz*b[1]);left.push([x+nx*d,z+nz*d]);right.push([x-nx*d,z-nz*d]);
    });return [...left,...right.reverse()];
  }
  function run(name,points,w){
    points=points.map(([x,z])=>[x*scale,z]);w*=scale;
    fixtures.push({name,points,w,outer:stroke(points,w+.36*scale),inner:stroke(points,w)});
  }
  if(kind==='takeoff'){
    for(const [i,z]of [2.1,5.6,9.1].entries())run(`takeoff-chevron-${i}`,[[-6.5,z+1],[0,z-1],[6.5,z+1]],.65);
    for(const side of [-1,1])for(const [i,a]of [1.6,6.5].entries())run(`takeoff-channel-${side}-${i}`,[[side*10.7,a],[side*10.7,a+3.7]],.42);
  }else{
    run('landing-end-strip',[[-16.3,.62],[16.3,.62]],.36);
    for(const [i,z]of [2.6,6,9.4].entries()){
      for(const side of [-1,1]){
        run(`landing-bracket-${side}-${i}`,[[side*6.5,z-1],[side*7.8,z-.65],[side*7.8,z+.65],[side*6.5,z+1]],.36);
        run(`landing-service-tile-${side}-${i}`,[[side*10.4,z-.28],[side*10.4,z+.28]],.6);
      }
      run(`landing-crossbar-${i}`,[[-2.2,z],[2.2,z]],.24);
    }
    for(const side of [-1,1])run(`landing-channel-${side}`,[[side*13.8,2],[side*13.8,10.5]],.3);
  }
  function path(points){return new THREE.Path(points.map(([x,z])=>new THREE.Vector2(x,-z)));}
  function shapeMesh(name,points,y,mat,holes=[]){
    const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));shape.holes=holes.map(path);
    const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
    const p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2,p.getZ(i)/4);
    const mesh=new THREE.Mesh(g,mats[mat]);mesh.name=name;mesh.position.y=y;root.add(mesh);return mesh;
  }
  const rectangle=(x,z,w,l)=>[[x-w/2,z-l/2],[x-w/2,z+l/2],[x+w/2,z+l/2],[x+w/2,z-l/2]];
  // Actual holes in both the top armor and its backing expose the light wells.
  const footprint=rectangle(0,length/2,width,length),holes=fixtures.map(f=>f.outer);
  shapeMesh('apron-brushed-armor',footprint,-.012,'plate',holes);

  function bevel(name,outer,inner){
    const clockwise=outer.reduce((sum,a,i)=>{const b=outer[(i+1)%outer.length];return sum+a[0]*b[1]-b[0]*a[1];},0)<0;
    for(let i=0;i<outer.length;i++){
      const j=(i+1)%outer.length,a=outer[i],b=outer[j],c=inner[j],d=inner[i];
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute([a[0],-.008,a[1],b[0],-.008,b[1],c[0],-.08,c[1],d[0],-.08,d[1]],3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
      // Orient every bezel quad toward the road-facing side.
      g.setIndex(clockwise?[0,1,2,0,2,3]:[0,2,1,0,3,2]);g.computeVertexNormals();
      const mesh=new THREE.Mesh(g,mats.ivory);mesh.name=name;root.add(mesh);
    }
  }
  for(const f of fixtures){
    const first=root.children.length;
    bevel(f.name+'-chamfer',f.outer,f.inner);
    shapeMesh(f.name+'-diffuser-bed',f.inner,-.085,'diffuser');
    // Individually segmented optical covers, including mitered corner cells.
    const lengths=f.points.slice(1).map((p,i)=>Math.hypot(p[0]-f.points[i][0],p[1]-f.points[i][1]));
    const cumulative=[0];for(const l of lengths)cumulative.push(cumulative.at(-1)+l);
    const total=cumulative.at(-1),cells=Math.max(1,Math.ceil(total/.7));
    function sample(d){const i=Math.min(lengths.length-1,cumulative.findIndex((v,j)=>j>0&&v>=d)-1);const t=(d-cumulative[i])/lengths[i];return f.points[i].map((v,k)=>v+(f.points[i+1][k]-v)*t);}
    for(let i=0;i<cells;i++){
      const a=total*i/cells+.025*scale,b=total*(i+1)/cells-.025*scale;
      const points=[sample(a),...f.points.filter((_,j)=>cumulative[j]>a&&cumulative[j]<b),sample(b)];
      shapeMesh(f.name+'-emitter-cell',stroke(points,f.w*.72),-.055,'light');
    }
    for(const part of root.children.slice(first))part.userData.lightAssembly=f.name;
  }
  function clear(rect){
    // Fixtures have a safety margin so seams/maintenance plates cannot bridge them.
    const [x,z,w,l]=rect;
    return !fixtures.some(f=>{
      const xs=f.outer.map(p=>p[0]),zs=f.outer.map(p=>p[1]);
      return x+w/2>Math.min(...xs)-.1&&x-w/2<Math.max(...xs)+.1&&z+l/2>Math.min(...zs)-.1&&z-l/2<Math.max(...zs)+.1;
    });
  }
  // Fine panel joints stop before optical wells rather than crossing the glass.
  for(const x of [-12,-6,0,6,12].map(x=>x*scale))for(let z=.2;z<length-.2;z+=.2){
    const rect=[x,z,.035,.2];if(clear(rect))shapeMesh('longitudinal-plate-joint',rectangle(...rect),-.01,'dark');
  }
  for(const z of [4,8,11.8])for(let x=-width/2+.2;x<width/2-.2;x+=.2){
    const rect=[x,z,.2,.035];if(clear(rect))shapeMesh('crosswise-plate-joint',rectangle(...rect),-.009,'dark');
  }
  for(const side of [-1,1])for(const z of [2.5,6,9.5]){
    const x=side*15.4*scale,rect=[x,z,1.3*scale,1.8];
    if(!clear(rect))continue;
    shapeMesh('inset-maintenance-plate',rectangle(...rect),-.008,'replacement');
    for(const dx of [-.48,.48])for(const dz of [-.72,.72]){
      shapeMesh('maintenance-fastener-seat',rectangle(x+dx*scale,z+dz,.13*scale,.18),-.005,'dark');
      shapeMesh('maintenance-fastener-head',rectangle(x+dx*scale,z+dz,.065*scale,.1),-.003,'steel');
    }
  }
  root.userData={revision:'gap-top-r2',kind,width,length,recess:.18};return root;
}
