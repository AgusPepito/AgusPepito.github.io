import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import station from './station.js';

// Preview-only material batching. The source asset keeps named model parts.
function batch(source) {
  const result=new THREE.Group(), groups=new Map();source.updateMatrixWorld(true);
  source.traverse(n=>{if(!n.isMesh)return;
    if(!groups.has(n.material))groups.set(n.material,[]);
    const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();
    g.applyMatrix4(n.matrixWorld);groups.get(n.material).push(g);n.geometry.dispose();
  });
  for(const [material,parts]of groups){const merged=mergeGeometries(parts,false);if(!merged)throw new Error('Could not assemble preview geometry');
    result.add(new THREE.Mesh(merged,material));parts.forEach(g=>g.dispose());}
  return result;
}

try {
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  document.body.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x080e17);
  scene.add(new THREE.HemisphereLight(0xaebdce,0x333441,2.1));
  const sun=new THREE.DirectionalLight(0xffe7c5,3.6);sun.position.set(-200,330,170);scene.add(sun);
  const rim=new THREE.DirectionalLight(0x8faed0,1.5);rim.position.set(180,40,-250);scene.add(rim);
  const model=batch(station(THREE));scene.add(model);
  const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,1,12000);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,49,0);
  controls.enableDamping=true;controls.enablePan=false;controls.minDistance=280;controls.maxDistance=2400;
  const slider=document.querySelector('#distance'),label=document.querySelector('#distanceLabel');
  const buttons=[...document.querySelectorAll('[data-distance]')];
  const referenceDirection=new THREE.Vector3(1,.32,1.7).normalize();
  function distance(value,reset=false){const direction=reset?referenceDirection:camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(direction,value);controls.update();}
  distance(950,true);
  slider.addEventListener('input',()=>distance(Number(slider.value)));
  buttons.forEach(b=>b.addEventListener('click',()=>distance(Number(b.dataset.distance))));
  document.querySelector('#reset').addEventListener('click',()=>{model.rotation.y=0;distance(camera.position.distanceTo(controls.target),true);});
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
  let last=performance.now();
  renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;
    if(document.querySelector('#rotate').checked)model.rotation.y+=dt*.085;
    controls.update();renderer.render(scene,camera);
    const d=Math.round(camera.position.distanceTo(controls.target));label.value=`${d} m`;slider.value=String(d);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(Number(b.dataset.distance)-d)<15)));
    document.querySelector('#stats').textContent=`${renderer.info.render.triangles.toLocaleString()} triangles · ${renderer.info.render.calls} draw calls`;
  });
} catch(error) {document.querySelector('#error').textContent=error.message;console.error(error);}
