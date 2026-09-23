import './style.css';
import './overdrive.css';
import { Simulation, SPEED } from './simulation.js';
import { HoldAction } from './hold-action.js';
import { GameView } from './view.js';
import { COURSE_LENGTH, clamp, trackAt } from './track.js';

const $ = id => document.getElementById(id);
const settings = { cameraShift: true, speedShift: true, invincible: false, sound: false };
const sim = new Simulation(settings);
const canvas = $('world');
const keys = new Set();
const racing = new HoldAction();
const touch = { id: null, x: 0, y: 0, ox: 0, oy: 0, pad: false };
let view, lastTime = performance.now(), accumulator = 0, fps = 60, uiTimer = 0, flash = 0, lastStatus = 'ready';
let tuningPaused = false, audioContext;

function tone(kind) {
  if (!settings.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = kind === 'hit' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'hit' ? 110 : 420, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(45, audioContext.currentTime + 0.13);
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.17);
  } catch { /* Optional sound never blocks gameplay. */ }
}
function clearSteering() {
  touch.id = null; touch.x = 0; touch.y = 0;
  $('stick-knob').style.transform = ''; $('drag-ring').style.display = 'none';
}
function clearInput() { keys.clear(); racing.clear(); clearSteering(); }
function syncScreens() {
  $('intro').hidden = sim.status !== 'ready';
  $('hud').hidden = sim.status === 'ready';
  $('pause-screen').hidden = sim.status !== 'paused' || !$('tuning').hidden;
  $('results').hidden = sim.status !== 'over';
  $('pause').hidden = sim.status !== 'playing' && sim.status !== 'paused';
  $('pause').textContent = sim.status === 'paused' ? '▷' : 'Ⅱ';
  $('pause').setAttribute('aria-label', sim.status === 'paused' ? 'Resume game' : 'Pause game');
  if (sim.status === 'over') {
    $('result-score').textContent = String(sim.score).padStart(6, '0');
    $('result-distance').textContent = Math.floor(sim.distance - 30).toLocaleString();
    $('result-kills').textContent = sim.kills;
    $('result-walls').textContent = sim.wallHits;
    clearInput();
  }
}
function start() {
  if (!view) return;
  closeTuning(false); clearInput(); sim.reset(); view.reset(); sim.start();
  accumulator = 0; flash = 0; syncScreens(); tone('spark');
  $('startb').blur();
}
function pause() {
  if (sim.status === 'playing') sim.status = 'paused';
  else if (sim.status === 'paused') sim.status = 'playing';
  clearInput(); accumulator = 0; syncScreens();
}
function closeTuning(resume = true) {
  $('tuning').hidden = true; $('tune-toggle').setAttribute('aria-expanded', 'false');
  if (resume && tuningPaused && sim.status === 'paused') sim.status = 'playing';
  tuningPaused = false; syncScreens();
}
$('startb').addEventListener('click', start);
for (const id of ['restart', 'restart-paused', 'restart-settings']) $(id).addEventListener('click', start);
$('pause').addEventListener('click', () => { closeTuning(false); pause(); });
$('resume').addEventListener('click', pause);
$('tune-toggle').addEventListener('click', () => {
  if (!$('tuning').hidden) return closeTuning();
  tuningPaused = sim.status === 'playing'; if (tuningPaused) sim.status = 'paused';
  clearInput(); $('tuning').hidden = false; $('tune-toggle').setAttribute('aria-expanded', 'true'); syncScreens();
});
$('tune-close').addEventListener('click', () => closeTuning());
for (const [id, key] of [['camera-shift', 'cameraShift'], ['speed-shift', 'speedShift'], ['invincible', 'invincible'], ['sound', 'sound']]) {
  $(id).addEventListener('change', event => {
    settings[key] = event.target.checked; sim.options[key] = event.target.checked;
    $('practice-badge').hidden = !settings.invincible;
    if (key === 'sound') tone('kill');
  });
}
window.addEventListener('keydown', event => {
  if (/INPUT|TEXTAREA/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key)) event.preventDefault();
  if (event.repeat && ['p','escape','r','enter'].includes(key)) return;
  if (key === 'escape' && !$('tuning').hidden) { closeTuning(); return; }
  if (key === 'p' || key === 'escape') pause();
  if (key === 'r' && sim.status !== 'ready') start();
  if (key === 'enter' && (sim.status === 'ready' || sim.status === 'over') && $('tuning').hidden) start();
  if (sim.status === 'playing') racing.keyDown(event.code);
  keys.add(key);
});
window.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); racing.keyUp(event.code); });
window.addEventListener('blur', () => { if (sim.status === 'playing') pause(); else clearInput(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && sim.status === 'playing') pause(); });

for (const target of [canvas, $('stick')]) {
  target.addEventListener('pointerdown', event => {
    if (sim.status !== 'playing' || touch.id !== null) return;
    event.preventDefault(); target.setPointerCapture(event.pointerId);
    touch.id = event.pointerId; touch.pad = target.id === 'stick';
    if (touch.pad) { const box = target.getBoundingClientRect(); touch.ox = box.x + box.width / 2; touch.oy = box.y + box.height / 2; }
    else { touch.ox = event.clientX; touch.oy = event.clientY; $('drag-ring').style.display = 'block'; $('drag-ring').style.left = `${touch.ox}px`; $('drag-ring').style.top = `${touch.oy}px`; }
    movePointer(event);
  });
  target.addEventListener('pointermove', movePointer);
  for (const eventName of ['pointerup','pointercancel','lostpointercapture']) target.addEventListener(eventName, event => { if (event.pointerId === touch.id) clearSteering(); });
}
$('race-hold').addEventListener('pointerdown', event => {
  if (sim.status !== 'playing') return;
  event.preventDefault(); $('race-hold').setPointerCapture(event.pointerId);
  racing.pointerDown(event.pointerId);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  $('race-hold').addEventListener(name, event => racing.pointerUp(event.pointerId));
}
function movePointer(event) {
  if (event.pointerId !== touch.id) return;
  const dx = event.clientX - touch.ox, dy = event.clientY - touch.oy;
  const radius = touch.pad ? 32 : 48;
  touch.x = clamp(dx / radius, -1, 1); touch.y = clamp(-dy / radius, -1, 1);
  const transform = `translate(${clamp(dx, -radius, radius)}px, ${clamp(dy, -radius, radius)}px)`;
  if (touch.pad) $('stick-knob').style.transform = transform;
  else $('drag-ring').firstElementChild.style.transform = transform;
}
function input() {
  return {
    x: touch.id !== null ? touch.x : Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
    y: touch.id !== null ? touch.y : Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown')),
    racing: racing.active,
  };
}
function updateUI() {
  const road = trackAt(sim.s);
  $('sector-name').textContent = road.label; $('sector-hint').textContent = road.hint;
  $('lap').textContent = `LAP ${String(sim.lap).padStart(2, '0')}`;
  $('score').textContent = String(sim.score).padStart(6, '0');
  $('tally').textContent = `${sim.kills} destroyed / ${sim.passed} passed`;
  $('speed').textContent = String(Math.round(sim.speed * 3.6)).padStart(3, '0');
  $('speed-fill').style.width = `${clamp(sim.speed / SPEED.racing * 100, 0, 100)}%`;
  $('health').textContent = sim.health; $('health-fill').style.width = `${sim.health}%`;
  $('health-fill').style.background = sim.health < 35 ? '#ff7182' : '#caff64';
  const progress = (sim.distance % COURSE_LENGTH) / COURSE_LENGTH * 100;
  $('course-marker').style.left = `${progress}%`; $('progress-label').textContent = `${Math.floor(progress)}%`;
  $('mode').textContent = sim.racingHeld ? 'OVERDRIVE / RELEASE TO BRAKE' : sim.raceBlend > 0.1 ? 'RETURNING TO COMBAT' : 'COMBAT / HOLD TO RACE';
  $('mode').style.color = sim.raceBlend > 0.3 ? '#ffb25c' : '#caff64';
  $('race-hold').classList.toggle('active', sim.racingHeld);
  $('race-hold').setAttribute('aria-pressed', String(sim.racingHeld));
  document.body.style.setProperty('--rush', String(sim.status === 'playing' ? sim.raceBlend : 0));
  $('fps').textContent = `${Math.round(fps)} FPS`; $('draws').textContent = `${view.renderer.info.render.calls} DRAWS`;
}

function frame(now) {
  const elapsed = Math.max(0.0001, (now - lastTime) / 1000); lastTime = now;
  fps += (1 / elapsed - fps) * (1 - Math.exp(-elapsed * 2));
  // Fixed steps keep fast collision behavior stable. Cap only catch-up, never FPS measurement.
  const dt = Math.min(elapsed, 0.1);
  if (sim.status === 'playing') {
    accumulator += dt;
    while (accumulator >= 1 / 120) { sim.step(1 / 120, input()); accumulator -= 1 / 120; }
  } else accumulator = 0;
  for (const event of sim.events.splice(0)) {
    view.event(event);
    if (event.kind === 'hit') flash = 0.35;
    if (event.kind === 'hit' || event.kind === 'kill') tone(event.kind);
  }
  flash = Math.max(0, flash - dt); $('hit-flash').style.opacity = String(flash * 2.1);
  view.render(sim, dt, settings);
  if (lastStatus !== sim.status) { syncScreens(); lastStatus = sim.status; }
  uiTimer += elapsed; if (uiTimer > 0.1) { updateUI(); uiTimer = 0; }
  window.__GAME__ = {
    pos: [sim.x, sim.z], fps, speed: sim.speed, score: sim.score, over: sim.status === 'over',
    draws: view.renderer.info.render.calls, tris: view.renderer.info.render.triangles,
    status: sim.status, health: sim.health, lap: sim.lap, distance: sim.distance,
    kills: sim.kills, passed: sim.passed, wallHits: sim.wallHits,
    racingHeld: sim.racingHeld, raceBlend: sim.raceBlend,
    lateral: sim.lateral, heading: sim.yaw,
    track: { center: trackAt(sim.s).center, width: trackAt(sim.s).width, tight: trackAt(sim.s).tight },
    options: { ...settings },
  };
  requestAnimationFrame(frame);
}
try {
  view = new GameView(canvas);
  view.render(sim, 1 / 60, settings);
  $('startb').disabled = false; $('startb').innerHTML = 'Start your run <span aria-hidden="true">↗</span>';
  window.__READY__ = true; window.__START__ = start;
  window.addEventListener('resize', () => view.resize());
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); if (sim.status === 'playing') pause(); $('error').hidden = false; $('error-message').textContent = 'The graphics connection was interrupted. Reload to start a fresh run.'; });
  requestAnimationFrame(frame);
} catch (error) {
  console.error(error); $('error').hidden = false; $('error-message').textContent = `The track couldn't load. ${error.message}`;
}
