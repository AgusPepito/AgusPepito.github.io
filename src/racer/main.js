import './style.css';
import { Race } from './simulation.js';
import { RaceView } from './view.js';
import { PHASES, GATES, LENGTH } from './track.js';
import { OBSTACLES } from './obstacles.js';
import { GAPS, gapJumpCue } from './jumps.js';
import { configureLevel, levelInfo } from './levels.js';

const touchLayout = matchMedia('(pointer: coarse), (max-width: 700px)');
const pad = { pointer: null, steer: 0, boost: false, brakeArmed: true };
const actionPad = { pointer: null, zone: null, jumpArmed: true };
const $ = id => document.getElementById(id), race = new Race(), keys = new Set();
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
  updateLesson(currentLevel);
}
function updateLesson(index) {
  const lesson = levelInfo(index).lesson;
  $('level-lesson').textContent = touchLayout.matches ? lesson.replace('Space jumps. W boosts.', 'Right pad up jumps. Left pad forward boosts.').replace('with 1, 2 or 3', 'with the right pad directions') : lesson;
}
configureLevel(currentLevel); loadBest(); updateLevelChoice();
const format = seconds => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
function resetPad() {
  const pointer = pad.pointer;
  pad.pointer = null; pad.steer = 0; pad.boost = false; pad.brakeArmed = true;
  if (pointer !== null && $('thumbpad').hasPointerCapture(pointer)) $('thumbpad').releasePointerCapture(pointer);
  $('pad-knob').style.transform = 'translate(-50%, -50%)';
  $('thumbpad').classList.remove('pressed');
}
function clearInput() {
  keys.clear(); resetPad(); jumpQueued = false; brakeQueued = false;
  resetActionPad();
  $('jump').classList.remove('active');
}

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
  $('pause').textContent = race.state === 'paused' ? '▷' : 'Ⅱ';
  $('pause').setAttribute('aria-label', race.state === 'paused' ? 'Resume' : 'Pause');
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
        gapCrash ? `${race.cause}. ${touchLayout.matches ? 'Tap ↻ to retry instantly.' : 'Press Space or R to retry instantly.'}` :
        wallCrash ? `${race.cause} at ${(race.s / 1000).toFixed(2)} km. Solid walls cannot be phased through. ${touchLayout.matches ? 'Tap ↻ to retry instantly.' : 'Press Space or R to retry instantly.'}` :
        `${gate ? `${PHASES[gate.phase].symbol} ${PHASES[gate.phase].name} was required` : race.cause}. You were in ${PHASES[race.phase].name} at ${(race.s / 1000).toFixed(2)} km. ${touchLayout.matches ? 'Tap ↻ to retry instantly.' : 'Press Space or R to retry instantly.'}`;
      $('sector-results').textContent = finished ? levelInfo(currentLevel + 1).lesson : `Retry starts at Level ${currentLevel + 1}: ${levelInfo(currentLevel).name}, with full boost.`;
      $('retry').textContent = finished ? 'Continue to next level ↗' : touchLayout.matches ? 'Retry checkpoint ↻' : 'Retry checkpoint · SPACE ↗';
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
$('level').addEventListener('change', () => updateLesson(Number($('level').value)));
$('pause').addEventListener('click', pause); $('resume').addEventListener('click', pause);
let fullscreenHintTimer;
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
function syncFullscreen() {
  const active = Boolean(fullscreenElement());
  $('fullscreen').setAttribute('aria-pressed', String(active));
  $('fullscreen').setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  $('fullscreen').title = active ? 'Exit fullscreen' : 'Fullscreen';
  resetPad(); resetActionPad();
  requestAnimationFrame(() => view?.resize());
}
function fullscreenHint(message) {
  clearTimeout(fullscreenHintTimer);
  $('fullscreen-hint').textContent = message; $('fullscreen-hint').hidden = false;
  fullscreenHintTimer = setTimeout(() => { $('fullscreen-hint').hidden = true; }, 6500);
}
$('fullscreen').addEventListener('click', async () => {
  clearInput();
  const root = document.documentElement;
  const enter = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!fullscreenElement() && !enter) {
    fullscreenHint('Fullscreen is unavailable here. Try your browser’s Add to Home Screen option, then open the game from there.');
    return;
  }
  try {
    if (fullscreenElement()) await exit?.call(document);
    else await enter.call(root);
    $('fullscreen-hint').hidden = true;
    syncFullscreen();
  } catch {
    fullscreenHint('The browser could not open fullscreen. Try opening the game directly in Chrome or Safari.');
  }
});
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
$('back').addEventListener('click', () => { clearInput(); race.reset(); view.snap = true; sync(); });
for (const button of document.querySelectorAll('[data-phase]')) {
  const index = Number(button.dataset.phase); button.style.setProperty('--button-phase', PHASES[index].color);
  button.addEventListener('pointerdown', e => { e.preventDefault(); phase(index); });
  button.addEventListener('click', e => { if (e.detail === 0) phase(index); });
}
$('jump').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (race.state === 'crashed') start();
});
$('jump').addEventListener('click', e => {
  if (e.detail === 0 && race.state === 'crashed') start();
});
function resetActionPad() {
  const pointer = actionPad.pointer;
  actionPad.pointer = null; actionPad.zone = null; actionPad.jumpArmed = true;
  const control = $('action-pad');
  if (pointer !== null && control.hasPointerCapture(pointer)) control.releasePointerCapture(pointer);
  control.removeAttribute('data-zone');
  $('action-knob').style.transform = 'translate(-50%, -50%)';
}
function moveActionPad(e) {
  if (actionPad.pointer !== e.pointerId || race.state !== 'running') return;
  e.preventDefault();
  const rect = $('action-pad').getBoundingClientRect(), radius = rect.width * 0.38;
  const x = (e.clientX - rect.left - rect.width / 2) / radius;
  const y = (e.clientY - rect.top - rect.height / 2) / radius;
  const distance = Math.hypot(x, y), scale = radius / Math.max(1, distance);
  $('action-knob').style.transform = `translate(calc(-50% + ${x * scale}px), calc(-50% + ${y * scale}px))`;
  if (distance < 0.28) {
    actionPad.zone = null; actionPad.jumpArmed = true;
    $('action-pad').removeAttribute('data-zone'); return;
  }
  if (distance < 0.48) return;
  const horizontal = Math.abs(x) > Math.abs(y);
  const zone = horizontal ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
  // Keep the current sector near diagonal boundaries to avoid accidental toggles.
  if (actionPad.zone && zone !== actionPad.zone && Math.abs(Math.abs(x) - Math.abs(y)) < 0.16) return;
  actionPad.zone = zone; $('action-pad').dataset.zone = zone;
  if (zone === 'up') {
    if (actionPad.jumpArmed) { jumpQueued = true; actionPad.jumpArmed = false; }
  } else phase(zone === 'left' ? 0 : zone === 'down' ? 1 : 2);
}
$('action-pad').addEventListener('pointerdown', e => {
  if (race.state !== 'running' || actionPad.pointer !== null || e.button !== 0) return;
  actionPad.pointer = e.pointerId;
  $('action-pad').setPointerCapture(e.pointerId); moveActionPad(e);
});
$('action-pad').addEventListener('pointermove', moveActionPad);
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  $('action-pad').addEventListener(type, e => { if (actionPad.pointer === e.pointerId) resetActionPad(); });
}
$('action-pad').addEventListener('contextmenu', e => e.preventDefault());
const thumbpad = $('thumbpad');
function movePad(e) {
  if (pad.pointer !== e.pointerId || race.state !== 'running') return;
  e.preventDefault();
  const rect = thumbpad.getBoundingClientRect(), radius = rect.width * 0.38;
  const x = Math.max(-1, Math.min(1, (e.clientX - rect.left - rect.width / 2) / radius));
  const y = Math.max(-1, Math.min(1, (e.clientY - rect.top - rect.height / 2) / radius));
  pad.steer = Math.abs(x) < 0.12 ? 0 : Math.sign(x) * (Math.abs(x) - 0.12) / 0.88;
  // Separate axes retain full steering while pushing forward; hysteresis avoids chatter.
  pad.boost = pad.boost ? y < -0.38 : y < -0.62;
  if (y > 0.62 && pad.brakeArmed) { brakeQueued = true; pad.brakeArmed = false; }
  if (y < 0.25) pad.brakeArmed = true;
  const scale = radius / Math.max(1, Math.hypot(x, y));
  $('pad-knob').style.transform = `translate(calc(-50% + ${x * scale}px), calc(-50% + ${y * scale}px))`;
}
thumbpad.addEventListener('pointerdown', e => {
  if (race.state !== 'running' || pad.pointer !== null) return;
  pad.pointer = e.pointerId; thumbpad.setPointerCapture(e.pointerId);
  thumbpad.classList.add('pressed'); movePad(e);
});
thumbpad.addEventListener('pointermove', movePad);
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  thumbpad.addEventListener(type, e => { if (pad.pointer === e.pointerId) resetPad(); });
}
thumbpad.addEventListener('contextmenu', e => e.preventDefault());
touchLayout.addEventListener('change', () => { clearInput(); updateLesson(Number($('level').value)); });
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
  if (['Space', 'ArrowUp', 'KeyJ'].includes(e.code)) {
    if (!e.repeat) {
      if (e.code === 'Space' && race.state === 'crashed') start();
      else if (race.state === 'running') jumpQueued = true;
    }
    return;
  }
  const index = /^(Digit|Numpad)([123])$/.exec(e.code);
  if (index) { phase(Number(index[2]) - 1); return; }
  if (race.state === 'running') keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
function suspend() { clearInput(); if (race.state === 'running') { race.state = 'paused'; accumulator = 0; sync(); } }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('resize', () => { clearInput(); view?.resize(); });
$('race-world').addEventListener('webglcontextlost', e => { e.preventDefault(); suspend(); $('loading-error').hidden = false; $('loading-error').textContent = 'Graphics interrupted. Reload this page to restart.'; race.state = 'ready'; view = null; $('start').disabled = true; sync(); });

function updateHud() {
  const running = race.state === 'running', touch = touchLayout.matches;
  $('checkpoint-notice').hidden = !checkpointNotice || race.time >= 3 || !running;
  $('checkpoint-notice').textContent = checkpointNotice;
  $('level-notice').hidden = !running || race.time >= 2.5 || Boolean(checkpointNotice);
  $('level-notice').textContent = `L${currentLevel + 1} · ${levelInfo(currentLevel).name}`;
  const p = PHASES[race.phase]; document.documentElement.style.setProperty('--phase', p.color);
  $('speed').textContent = Math.round(race.speed * 3.6); $('time').textContent = format(race.time);
  $('pause-level').textContent = `Level ${currentLevel + 1} · ${levelInfo(currentLevel).name}`;
  $('best').textContent = race.mode === 'drive' ? 'Driving only' : `Personal best · ${best ? format(best.time) : '—'}`;
  const progress = Math.min(100, Math.max(0, race.s / LENGTH * 100));
  $('course-progress').style.setProperty('--progress', `${progress}%`);
  $('course-progress').setAttribute('aria-valuenow', String(Math.round(progress)));
  $('boost-meter').setAttribute('aria-valuenow', String(Math.floor(race.boost.energy)));
  $('boost-fill').style.width = `${race.boost.energy}%`;
  $('pad-charge').style.strokeDasharray = `${race.boost.energy} 100`;
  for (const id of ['thumbpad', 'boost-meter']) {
    $(id).classList.toggle('free', race.stripBoost);
    $(id).classList.toggle('boosting', race.boostActive);
    $(id).classList.toggle('braking', race.brakeTime > 0);
  }
  $('boost-label').textContent = race.stripBoost ? 'FREE TURBO' : race.boost.locked ? 'RELEASE W' : 'TURBO';
  $('jump-icon').textContent = race.state === 'crashed' ? '↻' : '↥';
  $('jump').setAttribute('aria-label', race.state === 'crashed' ? 'Retry checkpoint' : 'Jump');
  $('jump').classList.toggle('active', race.airborne);
  $('action-pad').dataset.phase = String(race.phase);
  $('action-pad').classList.toggle('airborne', race.airborne);
  const gap = GAPS.find(g => g.end > race.s && g.start - race.s < 650);
  const cue = gapJumpCue(race, gap);
  const blockingWall = gap && OBSTACLES.some(o => o.s + o.depth > race.s && o.s < gap.start);
  const cueVisible = cue && (!race.airborne || cue.airborne || race.edgeGrace > 0) && !blockingWall &&
    race.mode === 'phase' && running && cue.near && !cue.airborne;
  $('jump-cue').hidden = !cueVisible;
  if (cueVisible) {
    const boostAvailable = race.stripBoost || race.boost.energy >= (race.boostActive ? 0.01 : 15);
    $('jump-cue').dataset.tone = !cue.enough ? 'boost' : cue.ready ? 'jump' : 'wait';
    $('jump-cue').textContent = !cue.enough ? !boostAvailable ? 'LOW TURBO' : race.boost.locked ?
      touch ? 'CENTER · THEN PUSH UP' : 'RELEASE W · BOOST' : touch ? 'PUSH UP · TURBO' : 'W · TURBO' :
      cue.ready || race.s > cue.latest ? touch ? 'RIGHT PAD ↑ · JUMP' : 'SPACE · JUMP' : 'NEAR THE EDGE';
  }
  for (const b of document.querySelectorAll('[data-phase]')) b.setAttribute('aria-pressed', String(Number(b.dataset.phase) === race.phase));
  $('speed-wash').style.opacity = view?.reduced ? 0 : Math.min(1, race.thrustBlend + (race.stripBoost ? 0.45 : 0));
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.06); last = now;
  if (view) {
    accumulator += race.state === 'running' ? dt : 0;
    while (accumulator >= 1 / 120) {
      const keyboardSteer = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
      const steer = Math.max(-1, Math.min(1, keyboardSteer + pad.steer));
      race.step(1 / 120, steer, keys.has('KeyW') || keys.has('ShiftLeft') || keys.has('ShiftRight') || pad.boost, jumpQueued, brakeQueued);
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



