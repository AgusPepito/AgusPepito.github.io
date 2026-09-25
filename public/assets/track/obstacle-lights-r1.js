// Integrated action signs. UVs survive road/tube deformation and worker packing.
const states = new WeakMap();
export function installObstacleLight(THREE, material) {
  const config = material.userData.obstacleLight;
  if (!config || config.role !== 'sign' || states.has(material)) return;
  const uniforms = {signTime:{value:0}, signDirection:{value:0}, signActive:{value:0},
    signReady:{value:0}, signReduced:{value:0}, signJump:{value:config.kind==='jump'?1:0}};
  const previous=material.onBeforeCompile, key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec2 vSignUv;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvSignUv=uv;');
    shader.fragmentShader=`varying vec2 vSignUv;
      uniform float signTime,signDirection,signActive,signReady,signReduced,signJump;
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec2 p=vSignUv*2.0-1.0;
      // Upward chevrons for jump; rotate the same symbol toward the chosen exit.
      vec2 q=signJump>0.5?p:vec2(p.y,p.x*signDirection);
      float chevron=0.0;
      float aa=max(fwidth(q.x)+fwidth(q.y),0.012);
      for(int row=0;row<2;row++){
        float y=0.08+float(row)*0.68;
        float d=abs(q.y-(y-abs(q.x)*0.85));
        chevron=max(chevron,(1.0-smoothstep(0.065,0.065+aa,d))*(1.0-smoothstep(0.64,0.68+aa,abs(q.x))));
      }
      float visible=signJump>0.5?1.0:step(0.5,abs(signDirection));
      float flow=pow(0.5+0.5*sin(q.y*4.0-signTime*4.0),3.0)*signActive*(1.0-signReduced);
      outgoingLight=diffuseColor.rgb*(2.1+flow*1.4+signReady*1.1);
      diffuseColor.a*=chevron*visible;
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=>`${key}|obstacle-sign-r1`;
  material.needsUpdate=true;states.set(material,uniforms);
}

export function updateObstacleLight(material,{time=0,direction=0,active=0,ready=false,reduced=false}={}){
  const config=material.userData.obstacleLight;
  if(!config)return;
  if(config.role==='rail'){
    material.color.setHex(0xeaf5ef).multiplyScalar(1.7+active*.35+(ready?1.1:0));return;
  }
  const u=states.get(material);if(!u)return;
  u.signTime.value=time;u.signDirection.value=direction;u.signActive.value=active;
  u.signReady.value=ready?1:0;u.signReduced.value=reduced?1:0;
}

export function obstacleLightKit(THREE,kind){
  const sign=new THREE.MeshBasicMaterial({color:0xeaf5ef,transparent:true,depthWrite:false});
  sign.name=`action-${kind}-sign`;sign.userData.obstacleLight={kind,role:'sign'};
  installObstacleLight(THREE,sign);
  const rail=new THREE.MeshBasicMaterial({color:new THREE.Color(0xeaf5ef).multiplyScalar(1.7)});
  rail.name=`action-${kind}-rail`;rail.userData.obstacleLight={kind,role:'rail'};
  const danger=new THREE.MeshBasicMaterial({color:new THREE.Color(0xff3826).multiplyScalar(2.8)});
  danger.name='action-obstruction-red';
  const housing=new THREE.MeshStandardMaterial({color:0x111b23,metalness:.45,roughness:.55});
  housing.name='action-sign-housing';
  function box(root,name,x,y,z,w,h,d,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.name=name;mesh.position.set(x,y,z);root.add(mesh);return mesh;
  }
  function panel(root,x,y,z,w,h){
    box(root,`${kind}-action-sign-cassette`,x,y,z-.07,w+.16,h+.16,.12,housing);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h,Math.max(1,Math.ceil(w/.3)),1),sign);
    mesh.name=`${kind}-illuminated-action-chevrons`;mesh.position.set(x,y,z);root.add(mesh);
  }
  function jump(root,height){
    panel(root,0,height/2,-.065,1.55,Math.min(1.64,height-.55));
    box(root,'jump-clearance-light-rail',0,height-.10,-.08,4.28,.115,.08,rail);
    for(const side of [-1,1])box(root,'jump-obstruction-foot-light',side*1.92,.23,-.065,.18,.28,.06,danger);
  }
  function wallEdges(root,width,height=7){
    const inset=Math.min(.15,width*.1),arm=Math.min(1.3,width*.3);
    for(const side of [-1,1])for(const top of [false,true]){
      const y=top?height-.22:.3,z=top?-1.045:-.045;
      box(root,'wall-red-corner-horizontal',side*(width/2-inset-arm/2),y,z,arm,.15,.05,danger);
      box(root,'wall-red-corner-upright',side*(width/2-inset),top?height-.67:.75,z,.15,1.04,.05,danger);
    }
  }
  return {jump,panel,wallEdges};
}
