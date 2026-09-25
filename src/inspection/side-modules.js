import './side-modules.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {detailedKit} from '../racer/detailed-kit.js';
import {mergeWallParts} from '../racer/wall-kit.js';

const sets=[
  {id:'pipe',title:'Pipes',description:'Central modules only: exposed runs, couplings, valves and offsets.',variants:['straight','coupling','valve','offset']},
  {id:'grille',title:'Grilles',description:'Central modules only: lattice, louvers and reinforced panels.',variants:['lattice','louver','reinforced']},
  {id:'cover',title:'Covers / armor',description:'Armor panels plus the shared starts, ends and ramps for every set.',variants:['plain','segmented','hatch','vented','start','end','ramp-start','ramp-end']},
];
const title=s=>s.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
const params=new URLSearchParams(location.search),cards=[];
for(const [i,set] of sets.entries()){
  const card=document.createElement('section');card.className='set';card.id=set.id;
  card.innerHTML=`<div class="set-head"><h2><span class="badge">0${i+1}</span>${set.title}</h2><p>${set.description}</p></div>
    <div class="preview" tabindex="0" aria-label="${set.title} interactive 3D preview"></div>
    <div class="set-controls"><div class="variant-row"><button class="previous" aria-label="Previous ${set.title} variant">←</button><label>Variant<select aria-label="${set.title} variant">${set.variants.map(kind=>`<option value="${kind}">${title(kind)}</option>`).join('')}</select></label><button class="next" aria-label="Next ${set.title} variant">→</button></div>
    <div class="view-row">${['Perspective','Front','Top','Back','Underside'].map(view=>`<button data-view="${view}">${view}</button>`).join('')}</div><div class="stats" role="status">Preparing…</div><div class="variants">${set.variants.length} variants: ${set.variants.map(title).join(' · ')}</div></div>`;
  document.getElementById('sets').append(card);cards.push({...set,element:card,preview:card.querySelector('.preview'),select:card.querySelector('select'),stats:card.querySelector('.stats')});
}

try{
  // One renderer/context for all independently orbitable previews.
  const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('catalog-canvas'),antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x09121c,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  let dirty=true,width=0,height=0;
  const request=()=>{dirty=true;};
  function fit(card,view=card.view||'Perspective'){
    if(!card.asset)return;card.view=view;
    const rect=card.preview.getBoundingClientRect();card.camera.aspect=rect.width/Math.max(1,rect.height);card.camera.updateProjectionMatrix();
    const size=card.bounds.getSize(new THREE.Vector3()),radius=size.length()/2;
    const angle=Math.min(THREE.MathUtils.degToRad(card.camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(card.camera.fov/2))*card.camera.aspect));
    const direction={Perspective:[.45,.55,1],Front:[0,.05,1],Top:[0,1,.001],Back:[0,.1,-1],Underside:[0,-1,.001]}[view];
    card.controls.target.set(0,0,0);card.camera.position.copy(new THREE.Vector3(...direction).normalize().multiplyScalar(radius/Math.sin(angle)*1.08));card.controls.update();request();
  }
  function release(card){
    if(!card.asset)return;
    const geometries=new Set(),materials=new Set();card.asset.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());card.scene.remove(card.asset);card.asset=null;
  }
  function choose(card){
    release(card);
    try{
      const source=detailedKit[card.id][card.select.value](THREE);
      // Match the playable side-bay length without bending the comparison model.
      source.scale.x=12.5/12;
      card.asset=mergeWallParts(THREE,source,{indexed:true});card.scene.add(card.asset);
      card.bounds=new THREE.Box3().setFromObject(card.asset);card.asset.position.sub(card.bounds.getCenter(new THREE.Vector3()));
      card.asset.updateMatrixWorld(true);card.bounds.setFromObject(card.asset);
      const buffers=new Set();let triangles=0;
      card.asset.traverse(m=>{if(!m.isMesh)return;m.material.wireframe=document.getElementById('wireframe').checked;
        triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;
        for(const attr of Object.values(m.geometry.attributes))buffers.add(attr.array.buffer);
        if(m.geometry.index)buffers.add(m.geometry.index.array.buffer);
      });
      card.stats.classList.remove('error');card.stats.textContent=`${Math.round(triangles).toLocaleString()} triangles · ${([...buffers].reduce((n,b)=>n+b.byteLength,0)/1048576).toFixed(2)} MiB geometry · 12.5 m module`;
      const url=new URL(location.href);url.searchParams.delete('frame');for(const item of cards)url.searchParams.set(item.id,item.select.value);history.replaceState(null,'',url);
      fit(card);
    }catch(error){card.stats.classList.add('error');card.stats.textContent=`Could not load variant: ${error.message}`;request();}
  }
  for(const card of cards){
    card.scene=new THREE.Scene();card.scene.background=new THREE.Color(0x0c1723);
    card.scene.add(new THREE.HemisphereLight(0xc6e4ff,0x65738a,2.4));
    const key=new THREE.DirectionalLight(0xfff0d8,2.6);key.position.set(15,22,18);card.scene.add(key);
    const fill=new THREE.DirectionalLight(0x84b8ed,1.5);fill.position.set(-12,8,-10);card.scene.add(fill);
    card.camera=new THREE.PerspectiveCamera(36,1,.02,500);
    card.controls=new OrbitControls(card.camera,card.preview);card.controls.minDistance=.4;card.controls.maxDistance=100;card.controls.addEventListener('change',request);
    if(card.variants.includes(params.get(card.id)))card.select.value=params.get(card.id);
    card.select.onchange=()=>choose(card);
    for(const [selector,step] of [['.previous',-1],['.next',1]])card.element.querySelector(selector).onclick=()=>{card.select.selectedIndex=(card.select.selectedIndex+step+card.variants.length)%card.variants.length;choose(card);};
    card.element.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>fit(card,button.dataset.view));
    new ResizeObserver(()=>fit(card)).observe(card.preview);
    choose(card);
  }
  document.getElementById('wireframe').onchange=()=>{for(const card of cards)card.asset?.traverse(m=>{if(m.isMesh)m.material.wireframe=document.getElementById('wireframe').checked;});request();};
  document.getElementById('fit-all').onclick=()=>cards.forEach(card=>fit(card,'Perspective'));
  window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request);
  renderer.setAnimationLoop(()=>{
    if(!dirty||document.hidden)return;dirty=false;
    if(width!==innerWidth||height!==innerHeight){width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);}
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    for(const card of cards){
      const rect=card.preview.getBoundingClientRect();if(rect.bottom<=0||rect.top>=height||rect.width===0)continue;
      const bottom=height-rect.bottom;
      renderer.setViewport(rect.left,bottom,rect.width,rect.height);renderer.setScissor(rect.left,Math.max(0,bottom),rect.width,Math.max(0,Math.min(height, height-rect.top)-Math.max(0,bottom)));
      renderer.render(card.scene,card.camera);
    }
  });
  document.addEventListener('visibilitychange',request);
  window.addEventListener('beforeunload',()=>{renderer.setAnimationLoop(null);for(const card of cards){card.controls.dispose();release(card);}renderer.dispose();});
}catch(error){for(const card of cards){card.stats.classList.add('error');card.stats.textContent=`Viewer unavailable: ${error.message}`;}}
