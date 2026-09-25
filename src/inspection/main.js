import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { levelInfo, levelAssetConfig, configureLevel } from '../racer/levels.js';
import { section, PHASES } from '../racer/track.js';
import { campaignDecorations } from '../racer/campaign-kit.js';
import { unpackAsset } from '../racer/asset-transfer.js';
import { applySlabEnvironment } from '../racer/slab-kit.js';
import slowAssets from './slow-assets.json';

const slow = document.body.dataset.kind === 'slow';
let gates = document.body.dataset.kind === 'gates';
const gateControls = gates || slow;
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const number = n => Math.round(n).toLocaleString();
const memory = n => `${(n / 1048576).toFixed(2)} MiB`;
document.getElementById('app').innerHTML = `
<aside>
  <nav><a href="./road-inspector.html" ${!gates&&!slow?'aria-current="page"':''}>Road</a><a href="./gate-inspector.html" ${gates?'aria-current="page"':''}>Gates</a><a href="./slow-assets.html" ${slow?'aria-current="page"':''}>Slowest 20</a></nav>
  <div class="eyebrow">VECTOR SHIFT / GEOMETRY LAB</div>
  <h1>${slow?'20 slowest assets':gates?'Gate inspector':'Road inspector'}</h1>
  <p class="intro">${slow?'Ranked by generation time in your saved v6 report. Select an entry to inspect its current geometry and generation cost.':gates?'Inspect every campaign gate, including its emitter, fittings and curtain.':'Explore the actual 100 m road chunks, surface panels and decoration assemblies.'}</p>
  <label class="field">Level<select id="level"></select></label>
  <label class="field">${slow?'Ranked asset':gates?'Gate':'Road chunk'}<select id="asset"></select></label>
  <div class="row"><button id="previous">← Previous</button><button id="next">Next →</button></div>
  ${slow?'<section class="baseline"><h2>Recorded v6 baseline</h2><div id="baseline-values"></div><p class="hint">25 Sep · 03:26 UTC. These are historical measurements; the costs below are generated now. GPU upload is not included.</p></section>':''}
  <label class="field">Mesh layout<select id="batch"><option value="parts">Inspect named parts</option><option value="game">Actual game batches</option></select></label>
  <p class="hint" id="batch-note"></p>
  ${gateControls?'<label class="field">Generation<select id="modules"><option value="on">Shared assets + deformation · v8</option><option value="v7">Previous shared modules · v7</option><option value="off">Original geometry · v6</option></select></label><p class="hint" id="module-note"></p><div class="row"><button id="rebuild">Rebuild sample</button><button id="save-log">Save comparison log</button></div><p class="hint" id="log-note"></p>':''}
  <div class="divider"><h2>View</h2></div>
  <div class="row view-buttons">${['Perspective','Top','Underside','Approach','Rear'].map(v=>`<button data-view="${v}">${v}</button>`).join('')}</div>
  <div class="row"><button id="fit">Fit visible parts</button><button id="show-all">Show all parts</button></div>
  <div class="toggles">
    <label><input id="wireframe" type="checkbox">Wireframe</label>
    <label><input id="backs" type="checkbox">Render both sides of faces</label>
    ${gateControls?'<label><input id="curtain" type="checkbox" checked>Show energy curtain</label>':''}
  </div>
  <div class="divider"><h2>Geometry costs</h2></div>
  <div class="stats">
    <div class="stat"><b id="bytes">—</b><span>Resident geometry buffers</span></div>
    <div class="stat"><b id="triangles">—</b><span>Visible triangles incl. instances</span></div>
    <div class="stat"><b id="vertices">—</b><span>Stored vertices (entire asset)</span></div>
    <div class="stat"><b id="stored-triangles">—</b><span>Stored triangles (entire asset)</span></div>
    <div class="stat"><b id="calls">—</b><span>Viewer draw calls / frame</span></div>
    <div class="stat"><b id="meshes">—</b><span>Visible meshes / instances</span></div>
    <div class="stat"><b id="build">—</b><span>Worker generation time</span></div>
  </div>
  <p class="hint">Buffers count vertex, index and instance data once. They exclude textures, GPU copies and browser overhead. Hiding parts does not free memory. Viewer draw calls are not a gameplay benchmark.</p>
  <div class="divider"><h2>Isolate parts</h2></div>
  <label class="field">Assembly<select id="category"><option value="all">All assemblies</option></select></label>
  <input class="search" id="search" type="search" placeholder="Filter part names…" aria-label="Filter part names">
  <div class="parts" id="parts"></div>
  <p class="hint">Drag to orbit · right-drag to pan · scroll to zoom. Touch: one finger orbits, two fingers pan and zoom. Both-sided rendering reveals existing faces; it does not restore removed geometry.</p>
  <a href="./racer.html?perf=1">Back to game →</a>
</aside>
<main id="viewport"><canvas id="viewer" aria-label="Interactive 3D asset viewer"></canvas>
  <div class="viewport-title"><strong id="asset-title">Preparing inspector</strong><p id="asset-detail"></p></div>
  <div class="empty-asset" id="empty-asset" hidden><strong>This chunk produces no geometry</strong><p>There is nothing to render after the gameplay masks are applied. Its generation cost is still recorded below.</p></div>
  <div class="status" id="status" role="status" aria-live="polite">Starting…</div>
</main>`;

for(let i=0;i<4;i++) $('level').add(new Option(`${i+1} · ${levelInfo(i).name}`,i));
$('level').value = ['0','1','2','3'].includes(params.get('level')) ? params.get('level') : '1';
$('batch').value = params.get('batch')==='parts'?'parts':gateControls||params.get('batch')==='game'?'game':'parts';
if(gateControls)$('modules').value=['off','v7'].includes(params.get('gateModules'))?params.get('gateModules'):'on';
if(slow)$('level').disabled=true;

try { start(); } catch(error) { status(`Could not start the viewer: ${error.message}`,true); }
function status(message,error=false){ $('status').textContent=message;$('status').dataset.error=String(error); }

function start(){
  const renderer=new THREE.WebGLRenderer({canvas:$('viewer'),antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a111b);
  scene.add(new THREE.HemisphereLight(0xc5e3ff,0x526280,2.4));
  const key=new THREE.DirectionalLight(0xe5f5ff,2.4);key.position.set(80,120,60);scene.add(key);
  const fill=new THREE.DirectionalLight(0x83b0ed,1.5);fill.position.set(-60,-80,-50);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(42,1,.02,5000);
  const controls=new OrbitControls(camera,$('viewer'));controls.enableDamping=true;
  controls.minDistance=.05;controls.maxDistance=1500;
  let asset=null,worker=null,entries=[],groups=[],view='Perspective',bounds=new THREE.Box3();
  const materials=new Map();let config;
  const logKey=slow?'vector-shift-slow-assets-comparisons-v7':'vector-shift-gate-comparisons-v7';
  let comparisonLog=[];
  function refreshLog(){try{const saved=JSON.parse(localStorage.getItem(logKey)||'[]');if(Array.isArray(saved))comparisonLog=saved.slice(-80);}catch{}}
  refreshLog();
  function logStatus(persisted=true){if(gateControls)$('log-note').textContent=`${comparisonLog.length} saved samples${persisted?' in this browser':' in this tab (browser storage unavailable)'}. Generation times vary; rebuild samples for a fair comparison. Gate generation can switch to the previous implementation.`;}
  logStatus();

  function resize(){
    const {width,height}=$('viewport').getBoundingClientRect();
    renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe($('viewport'));resize();
  let lastStats=0;
  renderer.setAnimationLoop(time=>{
    controls.update();renderer.render(scene,camera);
    if(time-lastStats>250){$('calls').textContent=number(renderer.info.render.calls);lastStats=time;}
  });

  function release(){
    if(!asset)return;
    const geometries=new Set();
    asset.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);if(m.isInstancedMesh)m.dispose();}});
    geometries.forEach(g=>g.dispose());materials.forEach((_,m)=>m.dispose());
    scene.remove(asset);asset=null;materials.clear();groups=[];
  }
  function populate(preferred){
    if(slow){
      entries=slowAssets.items.map(item=>({...item,label:`#${item.rank} · L${item.level+1} · ${item.kind==='chunk'?'Road '+item.station+'–'+(item.station+100):item.kind==='gate'?'Gate '+item.station:'Jump barrier '+item.station} m · ${number(item.buildMs)} ms`}));
      $('asset').replaceChildren(...entries.map((e,i)=>new Option(e.label,i)));
      const selected=entries.findIndex(e=>e.rank===Number(params.get('rank')));
      $('asset').value=String(Math.max(0,selected));load();return;
    }
    const level=Number($('level').value);configureLevel(level);config=levelAssetConfig(level);
    const decorations=campaignDecorations();entries=[];
    if(gates){
      entries=config.gates.map(g=>({station:g.s,gate:g,label:`${g.s} m · ${PHASES[g.phase].name||['Cyan','Amber','Violet'][g.phase]} · ${section(g.s).name}`}));
    }else{
      for(let s=-50;s<config.length+100;s+=100){
        const tags=[];
        if(decorations.services.some(b=>b.start>=s&&b.start<s+100))tags.push('service belt');
        if(decorations.layouts.some(layout=>layout.some((bay,i)=>bay&&i*12.5>=s&&i*12.5<s+100)))tags.push('side bays');
        entries.push({station:s,label:`${s}–${Math.min(s+100,config.length+100)} m · ${section(s+50).name}${tags.length?' · '+tags.join(', '):''}`});
      }
    }
    $('asset').replaceChildren(...entries.map((e,i)=>new Option(e.label,i)));
    const selected=entries.findIndex(e=>e.station===preferred);
    $('asset').value=String(selected>=0?selected:0);load();
  }
  function load(){
    worker?.terminate();worker=null;release();
    $('empty-asset').hidden=true;
    const entry=entries[Number($('asset').value)],grouped=entry.kind!=='obstacle'&&$('batch').value==='parts';
    if(slow){
      gates=entry.kind==='gate';$('level').value=String(entry.level);
      configureLevel(entry.level);config=levelAssetConfig(entry.level);
      entry.gate=gates?config.gates.find(g=>g.s===entry.station):undefined;
      entry.obstacle=entry.kind==='obstacle'?config.obstacles.find(o=>o.s===entry.station):undefined;
      $('baseline-values').textContent=`${entry.buildMs.toFixed(1)} ms generation · ${entry.packMs.toFixed(1)} ms packing · ${memory(entry.bytes)}`;
      $('curtain').disabled=!gates;
      $('batch').disabled=entry.kind==='obstacle';
      $('module-note').textContent='Preparing selected generation mode…';
    }
    $('parts').replaceChildren();$('category').replaceChildren(new Option('All assemblies','all'));
    ['bytes','triangles','vertices','stored-triangles','meshes','build'].forEach(id=>$(id).textContent='—');
    if(gates)$('module-note').textContent='Checking whether this station supports repeated modules…';
    $('previous').disabled=$('asset').selectedIndex<=0;
    $('next').disabled=$('asset').selectedIndex>=entries.length-1;
    $('asset-title').textContent=entry.label;
    $('asset-detail').textContent=`${levelInfo(Number($('level').value)).name} · ${grouped?'Named part groups':'Gameplay material batches'}`;
    $('batch-note').textContent=grouped?'Parts retain their names for isolation. Splitting gameplay batches changes draw calls and may change buffer size.':'Uses the game’s merged meshes and instancing. Part isolation follows material batches.';
    if(slow&&entry.kind==='obstacle')$('batch-note').textContent='Jump barrier uses the actual gameplay material batches.';
    const url=new URL(location.href);url.searchParams.set('level',$('level').value);url.searchParams.set('station',entry.station);url.searchParams.set('batch',$('batch').value);history.replaceState(null,'',url);
    if(gateControls)url.searchParams.set('gateModules',$('modules').value);
    if(slow)url.searchParams.set('rank',entry.rank);
    history.replaceState(null,'',url);
    status('Generating selected asset in a worker…');
    const active=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker=active;
    const fail=message=>{if(worker!==active)return;active.terminate();worker=null;status(message,true);};
    active.onerror=e=>fail(`Generation failed: ${e.message}`);
    active.onmessage=({data})=>{
      if(worker!==active)return;
      if(data.error){fail(`Generation failed: ${data.error}`);return;}
      active.terminate();worker=null;
      try{
        asset=unpackAsset(data.packet);scene.add(asset);
        bounds.setFromObject(asset);if(!bounds.isEmpty())asset.position.sub(bounds.getCenter(new THREE.Vector3()));
        asset.updateMatrixWorld(true);bounds.setFromObject(asset);
        applySlabEnvironment(THREE,renderer,asset);
        const byName=new Map();
        asset.traverse(m=>{
          if(!m.isMesh)return;
          for(const mat of Array.isArray(m.material)?m.material:[m.material])if(!materials.has(mat))materials.set(mat,mat.side);
          const name=m.name||m.material.name||'Unnamed mesh';
          if(!byName.has(name))byName.set(name,{name,meshes:[],enabled:true,category:grouped?name.split(' / ')[0]:'Game batches'});
          byName.get(name).meshes.push(m);
        });
        groups=[...byName.values()];
        for(const group of groups)group.stats=bufferStats(group.meshes);
        groups.sort((a,b)=>b.stats.bytes-a.stats.bytes);
        const totals=bufferStats(groups.flatMap(g=>g.meshes));
        $('empty-asset').hidden=totals.triangles>0;
        $('bytes').textContent=memory(totals.bytes);$('vertices').textContent=number(totals.vertices);$('build').textContent=`${(data.buildMs/1000).toFixed(2)} s`;
        $('stored-triangles').textContent=number(totals.storedTriangles);
        if(gates){
          const plan=asset.userData.gateModules;
          $('module-note').textContent=plan.mode==='baked'?`Original deformation retained: ${plan.reason}.`:plan.mode==='deformed-modules'?`One source strip shared ${plan.count} times, deformed along the track in the vertex shader. Compare gameplay FPS as well as generation time.`:`One ${plan.mode==='flat-modules'?'flat strip':'curved wedge'} repeated ${plan.count} times. Curtain stays separate.`;
        }else if(slow){
          const info=asset.userData.optimization;
          $('module-note').textContent=info?.kind==='chunk'?`${info.skippedSlabTiles} fully masked slab tiles skipped before construction.`:info?.modulePlan&&info.modulePlan.mode!=='baked'?`Barrier section repeated ${info.modulePlan.count} times. Approach markings remain separate.`:'Original barrier assembly retained.';
        }
        if(gateControls){
          refreshLog();
          comparisonLog.push({savedAt:new Date().toISOString(),version:'shared-assets-v8',generationMode:$('modules').value,assetOptimization:asset.userData.optimization,level:Number($('level').value),station:entry.station,
            kind:slow?entry.kind:'gate',rank:entry.rank,baseline:slow?{version:slowAssets.version,buildMs:entry.buildMs,packMs:entry.packMs,bytes:entry.bytes}:undefined,
            batch:entry.kind==='obstacle'?'game':$('batch').value,modulesRequested:gates?$('modules').value!=='off':null,modulePlan:asset.userData.gateModules,
            geometryBytes:totals.bytes,storedVertices:totals.vertices,storedTriangles:totals.storedTriangles,placedTriangles:totals.triangles,
            meshBatches:groups.reduce((n,g)=>n+g.meshes.length,0),workerBuildMs:data.buildMs,workerPackMs:data.packMs,
            userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency});
          comparisonLog=comparisonLog.slice(-80);
          let persisted=true;try{localStorage.setItem(logKey,JSON.stringify(comparisonLog));}catch{persisted=false;}logStatus(persisted);
        }
        for(const category of new Set(groups.map(g=>g.category)))$('category').add(new Option(category,category));
        createParts();applyMaterials();visibility();fit();
        status(`Ready · ${groups.length} part groups · ${memory(data.bytes)} transferred · ${data.packMs.toFixed(0)} ms packing. Orbit freely to inspect the underside or rear.`);
      }catch(error){release();status(`Could not display asset: ${error.message}`,true);}
    };
    active.postMessage({kind:entry.kind==='obstacle'?'obstacle':gates?'gates':'road',config,start:entry.station,gate:entry.gate,obstacle:entry.obstacle,grouped,modules:!gateControls||$('modules').value!=='off',optimizations:!gateControls||$('modules').value==='on'});
  }
  function createParts(){
    $('parts').replaceChildren();
    for(const group of groups){
      const row=document.createElement('div');row.className='part';
      const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=group.enabled;
      const name=document.createElement('span');name.className='name';name.textContent=group.name;
      const stats=group.stats,detail=document.createElement('small');detail.textContent=`${memory(stats.bytes)} · ${number(stats.triangles)} triangles`;name.append(detail);
      check.onchange=()=>{group.enabled=check.checked;visibility();};group.check=check;group.row=row;
      label.append(check,name);const solo=document.createElement('button');solo.textContent='Solo';solo.title=`Show only ${group.name}`;
      solo.onclick=()=>{for(const g of groups){g.enabled=g===group;g.check.checked=g.enabled;}$('category').value='all';visibility();fit();};
      row.append(label,solo);$('parts').append(row);
    }
    filterRows();
  }
  function filterRows(){
    const query=$('search').value.toLowerCase(),category=$('category').value;
    for(const g of groups)g.row.hidden=!(g.name.toLowerCase().includes(query)&&(category==='all'||category===g.category));
  }
  function visibility(){
    const category=$('category').value,visible=[];
    for(const g of groups)for(const m of g.meshes){
      const curtain=(Array.isArray(m.material)?m.material:[m.material]).some(mat=>mat.name.endsWith('-curtain'));
      m.visible=g.enabled&&(category==='all'||category===g.category)&&(!gates||$('curtain').checked||!curtain);
      if(m.visible)visible.push(m);
    }
    const stats=bufferStats(visible);$('triangles').textContent=number(stats.triangles);
    $('meshes').textContent=`${number(visible.length)} / ${number(visible.reduce((n,m)=>n+(m.isInstancedMesh?m.count:0),0))}`;
    filterRows();
  }
  function applyMaterials(){
    for(const [material,side] of materials){material.wireframe=$('wireframe').checked;material.side=$('backs').checked?THREE.DoubleSide:side;material.needsUpdate=true;}
  }
  function fit(){
    if(!asset)return;
    const box=new THREE.Box3();asset.updateMatrixWorld(true);asset.traverse(m=>{if(m.isMesh&&m.visible)box.union(new THREE.Box3().setFromObject(m));});
    if(box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).length()/2;
    const vertical=THREE.MathUtils.degToRad(camera.fov/2),angle=Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect));
    const distance=Math.max(.5,radius/Math.sin(angle)*1.12);
    const direction={Perspective:[1,.8,1],Top:[0,1,.001],Underside:[0,-1,.001],Approach:[0,.1,1],Rear:[0,.1,-1]}[view];
    camera.position.copy(center).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));
    camera.near=Math.max(.01,distance/10000);camera.far=Math.max(5000,distance*4);camera.updateProjectionMatrix();controls.target.copy(center);controls.update();
  }
  $('level').onchange=()=>populate(gates?1300:150);$('asset').onchange=load;$('batch').onchange=load;
  if(gateControls){
    $('modules').onchange=load;$('rebuild').onclick=load;
    $('save-log').onclick=()=>{
      refreshLog();logStatus();
      const data={schema:1,exportedAt:new Date().toISOString(),notes:['One row per completed asset generation. Compare identical level, station and batch mode.','Buffer memory excludes textures, GPU copies, browser overhead and generation peaks.','Stored triangles count each unique geometry once; placed triangles include all instances, including the full curtain.','Generation time excludes packing, main-thread upload and shader compilation.'],samples:comparisonLog};
      const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=href;link.download=`vector-shift-${slow?'slow-assets':'gate'}-comparison-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
    };
  }
  for(const [id,step] of [['previous',-1],['next',1]])$(id).onclick=()=>{$('asset').selectedIndex+=step;load();};
  for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{view=button.dataset.view;fit();};
  $('fit').onclick=fit;$('show-all').onclick=()=>{for(const g of groups){g.enabled=true;g.check.checked=true;}$('category').value='all';if(gates)$('curtain').checked=true;visibility();fit();};
  $('wireframe').onchange=applyMaterials;$('backs').onchange=applyMaterials;
  if(gateControls)$('curtain').onchange=visibility;
  $('category').onchange=()=>{visibility();fit();};$('search').oninput=filterRows;
  window.addEventListener('beforeunload',()=>{worker?.terminate();renderer.setAnimationLoop(null);});
  populate(params.has('station')?Number(params.get('station')):gates?1300:150);
}

function bufferStats(meshes){
  const buffers=new Set(),geometries=new Set();let vertices=0,triangles=0,storedTriangles=0;
  for(const mesh of meshes){
    const g=mesh.geometry;
    if(!geometries.has(g)){
      geometries.add(g);vertices+=g.attributes.position?.count||0;
      storedTriangles+=(g.index?.count??g.attributes.position?.count??0)/3;
      for(const a of Object.values(g.attributes))buffers.add((a.array||a.data.array).buffer);
      if(g.index)buffers.add(g.index.array.buffer);
    }
    const elements=g.index?.count??g.attributes.position?.count??0;
    triangles+=Math.max(0,Math.min(elements-g.drawRange.start,g.drawRange.count))/3*(mesh.isInstancedMesh?mesh.count:1);
    if(mesh.isInstancedMesh)buffers.add(mesh.instanceMatrix.array.buffer);
  }
  return {bytes:[...buffers].reduce((n,b)=>n+b.byteLength,0),vertices,triangles,storedTriangles};
}
