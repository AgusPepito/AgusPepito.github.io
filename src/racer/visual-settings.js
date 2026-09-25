import { Vector3 } from 'three';

// High left/rear key: keep the solar disk and its road reflection away from
// the forward racing line. The sky and reflection capture use this same vector.
export const SUN_DIRECTION = new Vector3(-1, .8, .35).normalize();
export const PLANET_DIRECTION = new Vector3(.65, .35, -1).normalize();
const storageKey = 'vector-shift-graphics-v1';
export const GRAPHICS = {
  rich: { label: 'Rich', pixelRatio: 1.5, bloom: true, particles: 96 },
  light: { label: 'Light', pixelRatio: 1.25, bloom: false, particles: 40 },
};
export function graphicsSetting() {
  const query = new URLSearchParams(location.search).get('graphics');
  if (GRAPHICS[query]) return query;
  try { const saved = localStorage.getItem(storageKey); if (GRAPHICS[saved]) return saved; } catch { /* Optional storage. */ }
  return matchMedia('(pointer: coarse)').matches ? 'light' : 'rich';
}
export function saveGraphics(value) {
  if (!GRAPHICS[value]) return;
  try { localStorage.setItem(storageKey, value); } catch { /* Optional storage. */ }
}
