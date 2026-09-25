import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import generate from '../../src/racer/dressing-assets.js';

// One static mesh per material. Preserve indexed primitive geometry; weld only
// the unindexed extruded sectors, retaining hard normal/UV boundaries.
function batch(source) {
  const result=new THREE.Group(),groups=new Map();source.updateMatrixWorld(true);
  result.name=source.name;result.userData={...source.userData};
  source.traverse(part=>{
    if(!part.isMesh)return;
    const transformed=part.geometry.clone().applyMatrix4(part.matrixWorld);
    const geometry=transformed.index?transformed:mergeVertices(transformed);
    if(geometry!==transformed)transformed.dispose();
    if(!groups.has(part.material))groups.set(part.material,[]);
    groups.get(part.material).push(geometry);part.geometry.dispose();
  });
  for(const [material,parts] of groups){
    const geometry=mergeGeometries(parts,false);
    if(!geometry)throw new Error(`Could not batch ${material.name}`);
    geometry.computeBoundingSphere();geometry.computeBoundingBox();
    const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;result.add(mesh);
    material.userData.originalEmission=material.emissiveIntensity;
    parts.forEach(part=>part.dispose());
  }
  return result;
}

// Same static warm/cool reflection-capture technique as the game's slab kit.
function environment(renderer) {
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x121f30);
  for(const [direction,color,strength,w,h] of [
    [[-1,.8,.35],0xffe4c5,2.4,4,6],[[.65,.35,-1],0x84b8ec,.7,16,16],[[-1,-.3,.4],0x8398b3,.65,10,26],
  ]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(strength),side:THREE.DoubleSide}));
    panel.position.set(...direction).normalize().multiplyScalar(16);panel.lookAt(0,0,0);studio.add(panel);
  }
  const generator=new THREE.PMREMGenerator(renderer),target=generator.fromScene(studio,.08,.1,100);
  generator.dispose();studio.traverse(part=>{part.geometry?.dispose();part.material?.dispose();});return target;
}

// Simple 36 m width guide, not another modeled track asset or gameplay scene.
function trackGuide() {
  const root=new THREE.Group();root.name='36m-track-scale-guide';
  const mats={deck:new THREE.MeshStandardMaterial({color:0x26303b,metalness:.6,roughness:.4}),
    seam:new THREE.MeshStandardMaterial({color:0x111a24,roughness:.7}),
    edge:new THREE.MeshStandardMaterial({color:0xa0acb4,metalness:.6,roughness:.35}),
    light:new THREE.MeshStandardMaterial({color:0xa0deff,emissive:0x41bfff,emissiveIntensity:2.5})};
  for(const [key,mat]of Object.entries(mats))mat.name=`guide-${key}`;
  const box=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats[mat]);m.position.set(x,y,z);root.add(m);};
  box(36,1,240,'seam',0,-.6,0);
  for(let z=-112.5;z<120;z+=15){
    for(let x=-15;x<18;x+=6)box(5.88,.22,14.8,'deck',x,0,z);
    for(const x of [-18,18]){
      box(.6,.55,14.7,'edge',x,.2,z);box(.35,.1,8,'light',x,.53,z);
    }
  }
  return batch(root);
}

const descriptions={
  ring:{title:'Broken arc',subtitle:'R2 · Open orbital frame',text:'A 216 m inner diameter leaves six track widths of open space. Exposed double rails, capped ends and cyan light bays make the scale readable.',direction:[.38,.22,1]},
  pylon:{title:'Relay crown',subtitle:'P3 · Off-track pylon',text:'Three raised prongs surround a lit relay core. Wide collars and exposed service pipes carry the medium-distance detail.',direction:[.75,.22,1]},
  boom:{title:'Service boom',subtitle:'S3 · Clear underside',text:'A long armored truss with recessed cyan rails and amber joint markers. One support mast; no hanging cylinders or pods.',direction:[.6,.35,1]},
};

try {
  const viewport=document.querySelector('#viewport');
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.outputColorSpace=THREE.SRGBColorSpace;viewport.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x090f19);
  const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.6;
  scene.add(new THREE.HemisphereLight(0xaacbea,0x26323c,.7));
  const sun=new THREE.DirectionalLight(0xffe4c5,2.8);sun.position.set(-200,200,180);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x8dc9ff,1.3);fill.position.set(170,80,-200);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(43,1,.3,6000);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=true;
  controls.minDistance=30;controls.maxDistance=2200;
  const models=new Map(Object.keys(descriptions).map(key=>[key,batch(generate(THREE,{kind:key}))]));
  const guide=trackGuide();scene.add(guide);
  let composer,bloom;
  if(renderer.extensions.has('EXT_color_buffer_float')){
    composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
    bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.38,.42,1.15);
    composer.addPass(bloom);composer.addPass(new OutputPass());
  }else{
    document.querySelector('#bloom').disabled=true;document.querySelector('#bloom').checked=false;
    document.querySelector('#notice').textContent='Bloom unavailable on this device; emissive lenses remain visible.';
  }
  let skyTexture;
  new THREE.TextureLoader().load(new URL('../../public/assets/space/planet-stars-r2.png',import.meta.url).href,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;
    skyTexture=texture;setBackground();
  },undefined,()=>{document.querySelector('#notice').textContent='Space backdrop unavailable; studio background is active.';});
  function setBackground(){scene.background=document.querySelector('#space').checked&&skyTexture?skyTexture:new THREE.Color(0x090f19);scene.backgroundIntensity=.55;}
  document.querySelector('#space').addEventListener('change',setBackground);
  const selection=document.querySelector('#asset'),distanceInput=document.querySelector('#distance');
  let current,key,fitDistance=400;
  function setDistance(distance,reset=false){
    const direction=reset?new THREE.Vector3(...descriptions[key].direction).normalize():camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();
  }
  function resize(){
    const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();composer?.setSize(w,h);
  }
  function select(next){
    if(current)scene.remove(current);key=next;current=models.get(key);current.rotation.set(0,0,0);scene.add(current);
    selection.value=key;const info=descriptions[key],size=current.userData.dimensions;
    document.querySelector('#title').textContent=info.title;document.querySelector('#subtitle').textContent=info.subtitle;
    document.querySelector('#description').textContent=info.text;
    document.querySelector('#dimensions').textContent=`${size.map(n=>Math.round(n)).join(' × ')} m · width / height / depth`;
    controls.target.set(0,size[1]/2,0);
    if(key==='ring'){
      const c=new THREE.Vector3(...current.userData.apertureCenter).add(new THREE.Vector3(...current.userData.originOffset));
      guide.position.copy(c);controls.target.copy(c);
    }else if(key==='pylon')guide.position.set(-65,22,0);
    else guide.position.set(0,12,65);
    const halfFov=THREE.MathUtils.degToRad(camera.fov/2);
    fitDistance=Math.max(size[1],size[0]/Math.max(camera.aspect,.35))/(2*Math.tan(halfFov))*1.28+size[2]/2;
    fitDistance=THREE.MathUtils.clamp(fitDistance,120,1900);setDistance(fitDistance,true);
    let triangles=0,bytes=0;current.traverse(part=>{if(!part.isMesh)return;
      triangles+=(part.geometry.index?.count??part.geometry.attributes.position.count)/3;
      for(const attribute of Object.values(part.geometry.attributes))bytes+=attribute.array.byteLength;
      bytes+=part.geometry.index?.array.byteLength??0;
    });
    document.querySelector('#stats').textContent=`Model only: ${Math.round(triangles).toLocaleString()} triangles · ${current.children.length} material batches · ${(bytes/1048576).toFixed(2)} MB geometry`;
    history.replaceState(null,'',`?asset=${key}`);
  }
  selection.addEventListener('change',()=>select(selection.value));
  distanceInput.addEventListener('input',()=>setDistance(Number(distanceInput.value)));
  document.querySelector('#fit').addEventListener('click',()=>{current.rotation.set(0,0,0);select(key);});
  document.querySelector('#mid').addEventListener('click',()=>setDistance(Math.max(fitDistance*1.75,650)));
  document.querySelector('#track').addEventListener('change',event=>{guide.visible=event.target.checked;});
  document.querySelector('#lights').addEventListener('change',event=>{
    for(const model of [...models.values(),guide])model.traverse(part=>{
      if(part.isMesh)part.material.emissiveIntensity=event.target.checked?part.material.userData.originalEmission:0;
    });
  });
  document.querySelector('#bloom').addEventListener('change',event=>{if(bloom)bloom.enabled=event.target.checked;});
  new ResizeObserver(resize).observe(viewport);resize();
  const query=new URLSearchParams(location.search).get('asset');select(models.has(query)?query:'ring');
  let last=performance.now();
  renderer.setAnimationLoop(now=>{
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(document.querySelector('#rotate').checked)current.rotation.y+=dt*.12;
    controls.update();if(composer)composer.render();else renderer.render(scene,camera);
    const d=Math.round(camera.position.distanceTo(controls.target));
    document.querySelector('#distanceLabel').value=`${d} m`;distanceInput.value=String(d);
  });
}catch(error){document.querySelector('#error').textContent=error.message;console.error(error);}
