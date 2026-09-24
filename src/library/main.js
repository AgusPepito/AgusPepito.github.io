import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import foundation from '../../public/assets/track/flat-foundation-r1.js';
import { pipeKit, addPipeBays } from '../racer/pipe-kit.js';
import { grilleKit, coverKit, addSurfaceBays } from '../racer/surface-kits.js';
import { raisedKit, addRaisedBays } from '../racer/raised-kit.js';
import detailedPipe from '../../public/assets/track/raised-pipe-detail-r3.js';
import { detailedKit, addDetailedBays } from '../racer/detailed-kit.js';
import { reviewCatalog } from './review-assets.js';
import { slabAssembly, applySlabEnvironment } from '../racer/slab-kit.js';
import slabs from '../../public/assets/track/slab-surface-r1.js';

const $ = id => document.getElementById(id);
const catalog = {
  '01': [
    ['foundation', 'Complete foundation · R1', foundation],
    ['road', 'Road skin and panel courses', () => subset(n => ['continuous-road-no-underside', 'flush-panel-course', 'panel-joint', 'expansion-joint'].includes(n.name))],
    ['bay', 'Common empty bay frame · one side', () => subset(n => n.name === 'service-bays', true)],
    ['edge', 'Edge trim · middle', () => subset(n => n.name === 'edge-middle', true)],
    ['splice', 'Edge splice', () => subset(n => n.name === 'edge-end-splice', true)],
    ['start', 'Bay start trim', () => subset(n => n.name === 'bay-start-cap', true)],
    ['divider', 'Bay divider', () => subset(n => n.name === 'shared-bay-divider', true)],
    ['end', 'Bay end trim', () => subset(n => n.name === 'bay-end-cap', true)],
    ['bracket', 'Visible bracket', () => subset(n => n.name === 'visible-outer-bracket', true)],
    ['socket', 'Mount socket', () => subset(n => n.name === 'visible-mount-socket', true)],
  ],
  '02': [
    ...Object.entries(pipeKit).map(([key, factory]) => [key, `${key[0].toUpperCase()}${key.slice(1)} · R1`, factory]),
    ['assembly', 'Pipe bays in approved frames', () => { const g = foundation(THREE); addPipeBays(THREE, g); return g; }],
  ],
};
for (const [id, kit] of [['03', grilleKit], ['04', coverKit]]) {
  catalog[id] = [
    ...Object.entries(kit).map(([key, factory]) => [key, `${key[0].toUpperCase()}${key.slice(1)} · R1`, factory]),
    ['assembly', 'Mounted in approved frames', () => { const g = foundation(THREE); addSurfaceBays(THREE, g, id); return g; }],
  ];
}
const requestedRevision = new URLSearchParams(location.search).get('revision');
const revision = ['r1','r2','r3'].includes(requestedRevision) ? requestedRevision : 'r3';
$('revision').value = revision;
$('revision').addEventListener('change', () => {
  const url = new URL(location.href); url.searchParams.set('revision', $('revision').value); url.searchParams.delete('asset'); location.href = url.href;
});
if (revision !== 'r1') for (const [id, family] of [['01','frame'],['02','pipe'],['03','grille'],['04','cover']]) {
  catalog[id] = [
    ...Object.entries((revision === 'r3' ? detailedKit : raisedKit)[family]).map(([kind, factory]) => [kind, `Raised ${family} · ${kind} · ${revision.toUpperCase()}`, factory]),
    ['assembly', `Road with raised housings · ${revision.toUpperCase()}`, () => {
      const g = foundation(THREE);
      for (const child of [...g.children]) if (child.name === 'service-bays') { child.traverse(n => n.geometry?.dispose()); g.remove(child); }
      (revision === 'r3' ? addDetailedBays : addRaisedBays)(THREE,g,id);return g;
    }],
  ];
}
if (revision === 'r2') catalog['02'].unshift(['detail-r3', 'R3 candidate · 30° detailed pipe housing', detailedPipe]);
if (revision === 'r3') catalog['02'].push(['detail-r3', 'Approved original R3 reference', detailedPipe]);
Object.assign(catalog, reviewCatalog(THREE));
for(const [category,shape]of [['01','flat'],['07','outside'],['08','inside']]){
  const half=shape==='flat'?18:Math.PI*18;
  catalog[category].unshift(
    ['slab-candidate','Slab candidate · brushed metal with crossing lane',()=>slabAssembly(THREE,{shape,length:50,courseEnd:50,strips:[{start:0,end:50,phase:2,from:-6/half,to:6/half,width:3.24/half}]})],
    ['slab-closeup','Slab candidate · unwrapped plate detail',()=>slabs(THREE,{width:12,length:25,columns:2})],
  );
}
function release(group) {
  const geometries = new Set(), materials = new Set();
  group.traverse(n => { if (n.geometry) geometries.add(n.geometry); if (n.material) materials.add(n.material); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
function subset(predicate, first = false) {
  const source = foundation(THREE), out = new THREE.Group(); source.updateMatrixWorld(true);
  source.traverse(n => {
    if (!predicate(n) || (first && out.children.length)) return;
    const clone = n.clone(true);
    clone.traverse(c => { if (c.geometry) c.geometry = c.geometry.clone(); if (c.material) c.material = c.material.clone(); });
    n.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale); out.add(clone);
  });
  release(source); return out;
}

try {
  const renderer = new THREE.WebGLRenderer({ canvas: $('viewer'), antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b121c);
  scene.add(new THREE.HemisphereLight(0xb5d8ff, 0x465578, 2.4));
  const sun = new THREE.DirectionalLight(0xd6eeff, 2.4); sun.position.set(120, 180, 40); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x6a9bdf, 1.5); fill.position.set(-70, -100, -60); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 2000);
  const controls = new OrbitControls(camera, $('viewer')); controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  let asset, nodes = [], radius = 1, view = 'perspective';
  function fit() {
    if (!asset) return;
    asset.traverse(n => { if (n.isMesh) n.visible = true; });
    const selected = $('node').value === 'all' ? null : nodes[Number($('node').value)];
    if (selected) asset.traverse(n => { if (n.isMesh) n.visible = n === selected; });
    const box = new THREE.Box3().setFromObject(selected || asset), size = box.getSize(new THREE.Vector3());
    controls.target.copy(box.getCenter(new THREE.Vector3()));
    radius = Math.max(size.length() / 2, 0.1);
    const angle = Math.min(THREE.MathUtils.degToRad(camera.fov) / 2, Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect));
    const distance = radius / Math.sin(angle) * 1.12;
    const direction = view === 'top' ? new THREE.Vector3(0, 1, 0.001) : view === 'side' ? new THREE.Vector3(1, 0, 0) : view === 'front' ? new THREE.Vector3(0, 0.22, 1) : new THREE.Vector3(0.85, 0.9, 1);
    camera.position.copy(controls.target).addScaledVector(direction.normalize(), distance);
    controls.minDistance = radius * 0.1; controls.maxDistance = distance * 4;
    camera.near = Math.max(0.005, radius / 1000); camera.far = Math.max(2000, distance * 8); camera.updateProjectionMatrix();
    controls.update();
    $('dimensions').textContent = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m · width / height / length`;
  }
  function choose() {
    if (asset) { scene.remove(asset); release(asset); }
    const entry = catalog[$('category').value].find(a => a[0] === $('asset').value);
    asset = entry[2](THREE); scene.add(asset); asset.updateMatrixWorld(true);
    if(entry[0].startsWith('slab-'))applySlabEnvironment(THREE,renderer,asset);
    nodes = []; asset.traverse(n => { if (n.isMesh) nodes.push(n); });
    $('node').replaceChildren(new Option('Whole asset', 'all'));
    nodes.forEach((node, i) => $('node').add(new Option(`${i + 1} · ${node.name || 'mesh'}`, String(i))));
    $('description').textContent = { '01': 'Approved foundation R1. Parts extracted from the road asset.', '02': 'Approved pipe kit R1.', '03': 'Grille kit R1 — awaiting approval. Open lattice, louvers and reinforced panels.', '04': 'Covered-metal kit R1 — awaiting approval. Plain armor, segmented panels, hatches and vents.' }[$('category').value];
    if (revision === 'r2') $('description').textContent = 'Raised R2: full-height start/end connectors across families. Separate ramp-start/ramp-end caps for exposed ends. Approximately 3.3 m high. Awaiting approval.';
    if (revision === 'r3') $('description').textContent = 'Detailed R3 set: approved 30° profile, full-height family connectors and separate ramp caps. Individual modules are 12 m long; mounted bays use a 12.5 m pitch.';
    if ($('category').value === '05') $('description').textContent = 'Mixed assembly R1 reuses R3 housings. Full-height family joins, empty frames and ramp caps only at exposed ends. The driving sample uses unequal runs across chunk boundaries.';
    if ($('category').value === '06') $('description').textContent = 'Phase lanes R1: dark inset beds, narrow colored borders, end symbols and neutral edge markers. Active lane width 6.48 m. Drive the sample for matching-phase turbo.';
    if (['07','08'].includes($('category').value)) $('description').textContent = 'Tube R1: 18 m radius, fully drivable circumference, flush bands and shallow protected service recesses. The approved lane geometry follows the curvature at the same 6.48 m width. Use Front to look through the mouth, or zoom into the inside tube.';
    if(['07','08'].includes($('category').value)){
      const detail=$('asset').value.startsWith('detail-');
      const variation=$('asset').value.startsWith('variation-');
      $('drive').href=`./racer.html?review=${$('category').value}&revision=r1${variation?'&detail=variations':detail?'&detail=service':''}`;
      $('status').textContent=variation?`${$('category').value} · R2 variations · awaiting review`:detail?`${$('category').value} · R2 service section · approved`:`${$('category').value} · R1 · awaiting review`;
      if(detail)$('description').textContent='Approved twelve-metre ivory service section: 70 cm pipe/cooling recesses, stepped couplings, louvers, asymmetric access doors and replacement plates. Shared geometry follows either tube.';
      if(variation)$('description').textContent='Four variations of the approved 12 m section: twin-feed pipe manifolds, split cooling banks, reinforced access hatches and quiet replacement armor. Drive eight sections with unequal graphite intervals and shifted panel arrangements around the tube.';
    }
    if($('asset').value.startsWith('slab-')){
      $('description').textContent='Initial shared slab candidate: shallow machined bevels, inset joints, asymmetric repair plates, flush fasteners and brushed metal grain. Soft environment highlights reveal changes in polish. The driving sample includes a crossing violet lane.';
      $('status').textContent=`${$('category').value} · Metal slab style · approved`;
      $('drive').href=`./racer.html?review=${$('category').value}&detail=slabs`;
    }
    if ($('asset').value === 'detail-r3') {
      $('description').textContent = 'Approved original R3 reference: 30° from vertical, matching trapezoid end cheeks, detailed pipe couplings and roof. Preserved for comparison with the complete set.';
      $('status').textContent = 'Original R3 reference · approved';
    }
    $('drive').hidden = $('asset').value === 'detail-r3';
    for (const n of nodes) n.material.wireframe = $('wireframe').checked;
    const url = new URL(location.href); url.searchParams.set('category', $('category').value); url.searchParams.set('asset', entry[0]); url.searchParams.set('revision', ['05','06','07','08'].includes($('category').value) ? 'r1' : revision); history.replaceState(null, '', url);
    fit();
  }
  function category(preferred) {
    const id = $('category').value;
    const newSample = ['05','06','07','08'].includes(id);
    $('revision').disabled = newSample;
    $('revision').value = newSample ? 'r1' : revision;
    $('revision').querySelector('[value="r1"]').textContent = newSample ? 'R1 · First category sample' : 'R1 · Shallow inserts';
    $('asset').replaceChildren(...catalog[id].map(a => new Option(a[1], a[0])));
    if (catalog[id].some(a => a[0] === preferred)) $('asset').value = preferred;
    $('status').textContent = `${id} · R1 ${['01', '02'].includes(id) ? 'approved' : 'awaiting your review'}`;
    if (revision === 'r2') $('status').textContent = `${id} · R2 raised · awaiting review`;
    if (revision === 'r3') $('status').textContent = `${id} · Detailed R3 set · awaiting review`;
    if (newSample) $('status').textContent = `${id} · R1 · awaiting your review`;
    $('drive').href = `./racer.html?review=${id}&revision=${newSample ? 'r1' : revision}`; choose();
  }
  function resize() {
    const rect = $('viewer').parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); fit();
  }
  $('category').addEventListener('change', () => category());
  $('asset').addEventListener('change', choose); $('node').addEventListener('change', fit);
  $('reset').addEventListener('click', fit);
  $('wireframe').addEventListener('change', () => { nodes.forEach(n => { n.material.wireframe = $('wireframe').checked; }); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; fit(); }));
  const params = new URLSearchParams(location.search);
  if (catalog[params.get('category')]) $('category').value = params.get('category');
  resize(); category(params.get('asset'));
  new ResizeObserver(resize).observe($('viewer').parentElement);
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
} catch (error) { $('error').hidden = false; $('error').textContent = `Could not load viewer: ${error.message}`; }



