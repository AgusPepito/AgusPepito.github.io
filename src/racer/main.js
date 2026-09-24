import './style.css';
import { Race } from './simulation.js';
import { RaceView } from './view.js';
import { PHASES, GATES, LENGTH, section } from './track.js';
import { OBSTACLES, passageDirection } from './obstacles.js';
import { PHASE_CHAINS } from './sequences.js';
import { GAPS } from './jumps.js';
import { configureLevel, levelInfo } from './levels.js';

const $ = id => document.getElementById(id), race = new Race(), keys = new Set(), held = new Map();
const progressKey = 'vector-shift-campaign-001-checkpoint';
let currentLevel = 0, storageKey;
let view, best = null, last = performance.now(), accumulator = 0, shown = '', resultSaved = false, jumpQueued = false, brakeQueued = false;
let checkpointNotice = '';
try {
  const saved = Number(localStorage.getItem(progressKey));
  if (Number.isSafeInteger(saved) && saved >= 0 && saved < 100000) currentLevel = saved;
} catch { /* Storage is optional, including in private browsing. */ }
function loadBest() {
  storageKey = `vector-shift-campaign-001-level-${currentLevel}`; best = null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.time) && saved.time > 0 && Array.isArray(saved.splits) && saved.splits.length === 1 && saved.splits.every(Number.isFinite)) best = saved;
  } catch { /* Local records are optional. */ }
}
function updateLevelChoice() {
  if (![...$('level').options].some(o => Number(o.value) === currentLevel)) {
    const option = document.createElement('option'); option.value = currentLevel;
    option.textContent = `${currentLevel + 1} · ${levelInfo(currentLevel).name}`; $('level').append(option);
  }
  $('level').value = String(currentLevel);
  $('level-lesson').textContent = levelInfo(currentLevel).lesson;
}
configureLevel(currentLevel); loadBest(); updateLevelChoice();
const format = seconds => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
function clearInput() { keys.clear(); held.clear(); jumpQueued = false; brakeQueued = false; for (const id of ['left', 'right', 'boost', 'jump']) $(id).classList.remove('active'); }
function phase(index) { if (race.state === 'running' || race.state === 'ready') race.phase = index; }
function start(index = currentLevel, carry = null) {
  if (!view) return;
  if (index !== currentLevel) {
    currentLevel = index; configureLevel(currentLevel); view.dispose();
    try { view = new RaceView($('race-world')); }
    catch (error) { view = null; race.state = 'ready'; $('start').disabled = true; $('loading-error').hidden = false; $('loading-error').textContent = error.message; sync(); return; }
    loadBest(); updateLevelChoice();
  }
  if (!carry) { clearInput(); checkpointNotice = ''; }
  race.reset(); race.mode = $('mode').value;
  if (carry) Object.assign(race, carry);
  race.state = 'running'; resultSaved = false; accumulator = 0; view.snap = true;
  if (!carry) document.activeElement?.blur();
  sync();
}
function advanceCheckpoint() {
  const completed = currentLevel, completedTime = race.time;
  if (race.mode === 'phase') {
    try {
      if (!best || completedTime < best.time) localStorage.setItem(storageKey, JSON.stringify({ time: completedTime, splits: [...race.splits] }));
      const saved = Number(localStorage.getItem(progressKey));
      const previous = Number.isSafeInteger(saved) && saved >= 0 && saved < 100000 ? saved : 0;
      localStorage.setItem(progressKey, String(Math.max(previous, completed + 1)));
    } catch { /* A full storage device must not interrupt the run. */ }
  }
  const carry = {};
  for (const key of ['speed', 'u', 'lateralSpeed', 'phase', 'height', 'verticalSpeed', 'airborne', 'landing',
    'jumpTime', 'edgeGrace', 'jumpOriginHeight', 'boostBlend', 'thrustBlend', 'brakeTime', 'brakeCooldown', 'brakeTarget', 'brakeRate']) carry[key] = race[key];
  start(completed + 1, carry);
  checkpointNotice = `CHECKPOINT ${completed + 1} · ${format(completedTime)} · BOOST REFILLED\nLEVEL ${currentLevel + 1} / ${levelInfo(currentLevel).name}`;
}
function pause() {
  if (race.state === 'running') race.state = 'paused';
  else if (race.state === 'paused') race.state = 'running';
  clearInput(); accumulator = 0; sync();
}
function sync() {
  document.body.dataset.state = race.state;
  $('menu').hidden = race.state !== 'ready'; $('paused').hidden = race.state !== 'paused';
  $('result').hidden = !['crashed', 'checkpoint'].includes(race.state);
  $('pause').hidden = !['running', 'paused'].includes(race.state);
  $('pause').textContent = race.state === 'paused' ? 'Resume' : 'Pause';
  if (race.state !== shown) {
    if (race.state === 'crashed' || race.state === 'checkpoint') {
      clearInput();
      const finished = race.state === 'checkpoint', isBest = finished && race.mode === 'phase' && (!best || race.time < best.time);
      const wallCrash = race.crashKind === 'wall';
      const gapCrash = race.crashKind === 'gap';
      $('result-label').textContent = finished ? `CHECKPOINT ${currentLevel + 1} REACHED${isBest ? ' · BEST TIME' : ''}` : gapCrash ? 'TRACK GAP' : wallCrash ? 'SOLID OBSTACLE' : 'PHASE MISMATCH';
      $('result-title').textContent = finished ? 'LEVEL CLEAR.' : gapCrash ? 'MISSED LANDING.' : wallCrash ? 'WALL IMPACT.' : 'OUT OF PHASE.';
      const gate = GATES.find(g => Math.abs(g.s - race.s) < 0.1);
      $('result-copy').textContent = finished ? `${levelInfo(currentLevel).name} · ${format(race.time)}. Next: ${levelInfo(currentLevel + 1).name}. Boost refills at the checkpoint.` :
        gapCrash ? `${race.cause}. Press R to retry instantly.` :
        wallCrash ? `${race.cause} at ${(race.s / 1000).toFixed(2)} km. Solid walls cannot be phased through. Press R to retry instantly.` :
        `${gate ? `${PHASES[gate.phase].symbol} ${PHASES[gate.phase].name} was required` : race.cause}. You were in ${PHASES[race.phase].name} at ${(race.s / 1000).toFixed(2)} km. Press R to retry instantly.`;
      $('sector-results').textContent = finished ? levelInfo(currentLevel + 1).lesson : `Retry starts at Level ${currentLevel + 1}: ${levelInfo(currentLevel).name}, with full boost.`;
      $('retry').textContent = finished ? 'Continue to next level ↗' : 'Retry checkpoint ↗';
      if (finished && race.mode === 'phase') {
        try {
          const saved = Number(localStorage.getItem(progressKey));
          const previous = Number.isSafeInteger(saved) && saved >= 0 && saved < 100000 ? saved : 0;
          localStorage.setItem(progressKey, String(Math.max(previous, currentLevel + 1)));
        } catch { /* Continue without saved progress. */ }
      }
      if (isBest && !resultSaved) {
        best = { time: race.time, splits: [...race.splits] }; resultSaved = true;
        try { localStorage.setItem(storageKey, JSON.stringify(best)); } catch { /* Racing does not require storage. */ }
      }
    }
    shown = race.state;
  }
}
$('start').addEventListener('click', () => start(Number($('level').value)));
$('retry').addEventListener('click', () => start(race.state === 'checkpoint' ? currentLevel + 1 : currentLevel));
$('restart').addEventListener('click', () => start());
$('level').addEventListener('change', () => { $('level-lesson').textContent = levelInfo(Number($('level').value)).lesson; });
$('pause').addEventListener('click', pause); $('resume').addEventListener('click', pause);
$('back').addEventListener('click', () => { clearInput(); race.reset(); view.snap = true; sync(); });
for (const button of document.querySelectorAll('[data-phase]')) {
  const index = Number(button.dataset.phase); button.style.setProperty('--button-phase', PHASES[index].color);
  button.addEventListener('pointerdown', e => { e.preventDefault(); phase(index); });
  button.addEventListener('click', () => phase(index));
}
for (const id of ['left', 'right', 'boost', 'jump']) {
  const button = $(id);
  button.addEventListener('pointerdown', e => {
    if (race.state !== 'running') return;
    e.preventDefault(); button.setPointerCapture(e.pointerId); held.set(e.pointerId, id); button.classList.add('active');
    if (id === 'jump') jumpQueued = true;
  });
  const release = e => { held.delete(e.pointerId); if (![...held.values()].includes(id)) button.classList.remove('active'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
const controlCodes = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyS', 'KeyW', 'KeyJ', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3', 'KeyR', 'KeyP', 'Escape'];
window.addEventListener('keydown', e => {
  if (!controlCodes.includes(e.code)) return;
  e.preventDefault();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) pause(); return; }
  if (e.code === 'KeyR') { if (!e.repeat) start(); return; }
  if (['KeyS', 'ArrowDown'].includes(e.code)) {
    if (race.state === 'running') {
      if (!e.repeat && !keys.has('KeyS') && !keys.has('ArrowDown')) brakeQueued = true;
      keys.add(e.code);
    }
    return;
  }
  if (['Space', 'ArrowUp', 'KeyJ'].includes(e.code)) { if (!e.repeat && race.state === 'running') jumpQueued = true; return; }
  const index = /^(Digit|Numpad)([123])$/.exec(e.code);
  if (index) { phase(Number(index[2]) - 1); return; }
  if (race.state === 'running') keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
function suspend() { clearInput(); if (race.state === 'running') { race.state = 'paused'; accumulator = 0; sync(); } }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('resize', () => view?.resize());
$('race-world').addEventListener('webglcontextlost', e => { e.preventDefault(); suspend(); $('loading-error').hidden = false; $('loading-error').textContent = 'Graphics interrupted. Reload this page to restart.'; race.state = 'ready'; view = null; $('start').disabled = true; sync(); });

function updateHud() {
  $('checkpoint-notice').hidden = !checkpointNotice || race.time >= 3 || race.state !== 'running';
  $('checkpoint-notice').textContent = checkpointNotice;
  const chain = PHASE_CHAINS.find(c => c.gates[0].s - race.s < 650 && c.obstacleS + 8 > race.s);
  $('sequence-hint').hidden = !chain || race.state !== 'running' || race.mode !== 'phase';
  if (chain) {
    const obstacle = OBSTACLES.find(o => o.s === chain.obstacleS);
    const turn = passageDirection(obstacle, race.u);
    $('sequence-name').textContent = chain.name;
    const steps = $('sequence-steps');
    if (steps.dataset.chain !== chain.id) {
      steps.replaceChildren(); steps.dataset.chain = chain.id;
      for (let i = 0; i <= chain.gates.length; i++) {
        if (i) { const arrow = document.createElement('b'); arrow.textContent = '›'; steps.append(arrow); }
        const step = document.createElement('span'); step.id = `sequence-step-${i}`; steps.append(step);
      }
    }
    chain.gates.forEach((gate, i) => {
      const phase = PHASES[gate.phase], step = $(`sequence-step-${i}`);
      step.textContent = `${phase.symbol} ${gate.phase + 1} ${phase.name}`;
      step.style.color = phase.color; step.classList.toggle('cleared', race.s >= gate.s);
    });
    $(`sequence-step-${chain.gates.length}`).textContent = `${turn === 0 ? '↑' : turn > 0 ? '→' : '←'} ${obstacle.kind === 'hole' ? 'OPENING' : 'DODGE'}`;
  }
  const p = PHASES[race.phase]; document.documentElement.style.setProperty('--phase', p.color);
  $('speed').textContent = Math.round(race.speed * 3.6); $('time').textContent = format(race.time);
  $('section').textContent = `L${currentLevel + 1} · ${levelInfo(currentLevel).name} / ${section(race.s).name}`; $('best').textContent = race.mode === 'drive' ? 'DRIVING ONLY' : `LEVEL BEST ${best ? format(best.time) : '—'}`;
  $('drive-status').textContent = race.brakeTime > 0 ? 'BRAKE PULSE' : race.scrape ? 'EDGE CONTACT / SPEED LOST' : race.boostActive ?
    race.stripBoost ? `${p.symbol} BOOST + PHASE STRIP` : 'BOOST / FULL THRUST' : race.stripBoost ? `${p.symbol} MATCHED / ACCELERATING` : `${p.symbol} ${p.name} / CARRY YOUR SPEED`;
  $('boost').style.setProperty('--charge', `${race.boost.energy}%`);
  $('boost').classList.toggle('active', race.state === 'running' && race.boostActive);
  $('boost').setAttribute('aria-pressed', String(race.state === 'running' && race.boostActive));
  $('boost-charge').textContent = `${Math.floor(race.boost.energy)}%`;
  $('jump-status').textContent = race.airborne && race.edgeGrace <= 0 ? 'IN AIR' : 'SPACE';
  $('jump').classList.toggle('active', race.airborne);
  $('boost-status').textContent = race.boost.locked ? 'RELEASE TO REARM' : race.boostActive ? 'BOOSTING' : race.boost.cooldown > 0 ? 'COOLING DOWN' : race.boost.energy < 100 ? 'RECHARGING' : 'HOLD W / SHIFT';
  $('split').textContent = `CHECKPOINT · ${Math.max(0, (LENGTH - race.s) / 1000).toFixed(1)} KM`;
  const nextGate = GATES.find(g => g.s > race.s && g.s - race.s < 650);
  const gap = GAPS.find(g => g.end > race.s && g.start - race.s < 650);
  const jumpWall = OBSTACLES.find(o => o.kind === 'jump' && o.s + o.depth > race.s && o.s - race.s < 650);
  const next = [nextGate, gap && { ...gap, s: gap.start, kind: 'gap' }, jumpWall].filter(Boolean).sort((a, b) => a.s - b.s)[0];
  $('gate-hint').hidden = !next || race.state !== 'running' || race.mode !== 'phase';
  if (next?.kind) {
    $('gate-hint').style.setProperty('--gate', '#ffdf88');
    $('gate-hint').textContent = next.kind === 'gap' ?
      `TRACK GAP · ${Math.max(0, Math.ceil(next.start - race.s))} m TO EDGE\n${race.airborne ? `${Math.max(0, Math.ceil(next.end - race.s))} m TO LANDING · BOOST FOR RANGE` : next.full ? 'JUMP NEAR THE EDGE · BOOST FOR RANGE' : 'JUMP OR STEER AROUND THE MISSING PIECE'}` :
      `LOW BARRIER · ${Math.max(0, Math.ceil(next.s - race.s))} m\nJUMP OVER · SPACE`;
  } else if (next) {
    const p = PHASES[next.phase]; $('gate-hint').style.setProperty('--gate', p.color);
    $('gate-hint').textContent = `${p.symbol} ${p.name} GATE · ${Math.ceil(next.s - race.s)} m\n${next.full ? 'FULL WIDTH' : 'PARTIAL WIDTH'} · ${race.phase === next.phase ? 'PHASE MATCHED' : `SWITCH TO ${next.phase + 1}`}`;
  }
  for (const b of document.querySelectorAll('[data-phase]')) b.setAttribute('aria-pressed', String(Number(b.dataset.phase) === race.phase));
  $('speed-wash').style.opacity = view?.reduced ? 0 : Math.min(1, race.thrustBlend + (race.stripBoost ? 0.45 : 0));
}
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.06); last = now;
  if (view) {
    accumulator += race.state === 'running' ? dt : 0;
    while (accumulator >= 1 / 120) {
      const touch = [...held.values()];
      const steer = Number(keys.has('ArrowRight') || keys.has('KeyD') || touch.includes('right')) - Number(keys.has('ArrowLeft') || keys.has('KeyA') || touch.includes('left'));
      race.step(1 / 120, steer, keys.has('KeyW') || keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.includes('boost'), jumpQueued, brakeQueued);
      jumpQueued = false; brakeQueued = false;
      accumulator -= 1 / 120;
      if (race.state === 'checkpoint') { advanceCheckpoint(); break; }
    }
    sync(); updateHud(); view?.render(race, dt);
  }
  requestAnimationFrame(loop);
}
try { view = new RaceView($('race-world')); }
catch (error) { $('start').disabled = true; $('loading-error').hidden = false; $('loading-error').textContent = `Could not initialize the racer: ${error.message}`; }
sync(); updateHud(); requestAnimationFrame(loop);



