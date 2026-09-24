import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ASSET } from '../vendor/404/assetlib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('ship-canvas');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b121c);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.65, 0.35, 2.5);
composer.addPass(bloom); composer.addPass(new OutputPass());
scene.add(new THREE.HemisphereLight(0xc9e7ff, 0x526071, 2));
const key = new THREE.DirectionalLight(0xffedd3, 3.5); key.position.set(4, 7, -4); scene.add(key);
const rim = new THREE.DirectionalLight(0x87bfff, 2.5); rim.position.set(-4, 3, 4); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 1); fill.position.set(-3, -2, -2); scene.add(fill);
const grid = new THREE.GridHelper(12, 24, 0x304255, 0x1b2938); grid.position.y = -0.25; scene.add(grid);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.42, 0); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 4; controls.maxDistance = 15; controls.autoRotateSpeed = 1;
const views = { rear: [4.6, 3.4, -7.5], front: [-4.6, 3.1, 7.5], side: [8.4, 1.7, 0], top: [0, 9, -0.01], underside: [4, -4, -6] };
function setView(name) {
  camera.position.set(...views[name]); controls.target.set(0, 0.42, 0); controls.update();
  for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === name));
}
setView('rear');
const descriptions = {
  kestrel: 'A narrow central hull suspended between two armored engine pods. Rear fins frame the phase core.',
  manta: 'A continuous swept silhouette with inset engines and a long energy spine. A smoother interpretation of the reference.',
  splitframe: 'An exposed chassis links two hexagonal pods to a central energy drum. More mechanical, with strong gaps between the parts.',
};
let selected = null, phase = '#4de1ff', request = 0, candidate = 'kestrel', revision = 'v2';
const saturated = { '#4de1ff': '#00cfff', '#ffbe55': '#ff9200', '#dc8aff': '#b800ff' };
const ships = new Map();
function tint(ship) {
  ship.traverse(n => { if (n.isMesh) for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
    if (m.name === 'phase-energy') {
      m.color.set(revision === 'v2' ? saturated[phase] : phase);
      m.emissive.copy(m.color);
      m.emissiveIntensity = revision === 'v2' ? Number(document.getElementById('glow').value) : 1.8;
    }
  } });
}
async function choose(name) {
  candidate = name;
  const asset = revision === 'v2' ? `${name}-v2` : name;
  const id = ++request;
  try {
    if (!ships.has(asset)) {
      const ship = await ASSET(`./assets/ships/${asset}.js`);
      let meshes = 0; ship.traverse(n => { if (n.isMesh) meshes++; });
      if (!meshes) throw new Error('Ship could not load. Refresh after the deployment finishes.');
      ships.set(asset, ship);
    }
    if (id !== request) return;
    if (selected) scene.remove(selected);
    selected = ships.get(asset); tint(selected); scene.add(selected);
    bloom.enabled = revision === 'v2';
    document.getElementById('description').textContent = descriptions[name];
    document.getElementById('load-error').hidden = true;
    for (const b of document.querySelectorAll('[data-ship]')) b.setAttribute('aria-pressed', String(b.dataset.ship === name));
  } catch (e) {
    if (id !== request) return;
    const error = document.getElementById('load-error'); error.hidden = false; error.textContent = e.message;
  }
}
for (const b of document.querySelectorAll('[data-ship]')) b.addEventListener('click', () => choose(b.dataset.ship));
for (const b of document.querySelectorAll('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
for (const b of document.querySelectorAll('[data-color]')) {
  b.style.background = b.dataset.color;
  b.addEventListener('click', () => {
    phase = b.dataset.color; if (selected) tint(selected);
    for (const other of document.querySelectorAll('[data-color]')) other.setAttribute('aria-pressed', String(other === b));
  });
}
document.getElementById('spin').addEventListener('click', e => {
  controls.autoRotate = !controls.autoRotate; e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate));
});
document.getElementById('revision').addEventListener('change', e => {
  revision = e.target.value; choose(candidate);
});
document.getElementById('glow').addEventListener('input', e => {
  document.getElementById('glow-value').textContent = `${(Number(e.target.value) / 1.8).toFixed(1)}×`;
  if (selected) tint(selected);
});
controls.addEventListener('start', () => { for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', 'false'); });
function resize() {
  const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); composer.setSize(r.width, r.height); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();
renderer.setAnimationLoop(() => { controls.update(); composer.render(); });
choose('kestrel');
