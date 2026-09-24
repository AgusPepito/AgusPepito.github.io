import { LEVEL_ENCOUNTERS } from './simulation.js';
import { FORK_ROUTES } from './forks.js';

const names = { darts: 'Darts', interceptors: 'Interceptors', mines: 'Mine layers', convoy: 'Convoy' };
const icons = {
  start: '<circle cx="12" cy="12" r="3" fill="currentColor"/>',
  darts: '<path d="M12 3 20 20 12 16 4 20Z"/>',
  interceptors: '<path d="m5 4 7 7 7-7M5 13l7 7 7-7"/>',
  mines: '<circle cx="12" cy="12" r="5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3"/>',
  convoy: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 8h12M9 17h6"/>',
  finish: '<path d="M6 21V3h13l-3 5 3 5H6"/>',
};
const check = '<path d="m5 12 5 5 9-10"/>', dash = '<path d="M6 12h12"/>';
const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

export class RouteMap {
  constructor(element) {
    this.element = element;
    this.stations = [{ type: 'start', name: 'Start' }, ...LEVEL_ENCOUNTERS.map(type => ({ type, name: names[type] })), { type: 'finish', name: 'Finish' }];
    element.innerHTML = `<div class="route-track"><div class="route-line"></div><div class="route-travelled"></div><ol class="route-stations">${this.stations.map((station, i) =>
      `<li class="route-station ${station.type}" style="left:${i / (this.stations.length - 1) * 100}%" aria-label="${station.name}">${svg(icons[station.type])}</li>`).join('')}</ol><span class="route-player" aria-hidden="true"></span></div><div class="route-caption"><span class="route-now"></span><span class="route-next"></span></div>`;
    this.nodes = [...element.querySelectorAll('.route-station')];
    const branchSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    branchSvg.setAttribute('viewBox', '0 0 100 32'); branchSvg.setAttribute('preserveAspectRatio', 'none');
    branchSvg.setAttribute('aria-hidden', 'true'); branchSvg.classList.add('route-branches');
    this.branches = FORK_ROUTES.map(route => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x = (route.index + 0.5) * 20;
      path.setAttribute('d', `M ${x} 14 C ${x + 20 / 3} -10 ${x + 40 / 3} -10 ${x + 20} 14`);
      path.setAttribute('vector-effect', 'non-scaling-stroke'); branchSvg.append(path); return path;
    });
    element.querySelector('.route-track').prepend(branchSvg);
    this.now = element.querySelector('.route-now'); this.next = element.querySelector('.route-next');
  }
  update(sim) {
    const level = sim.level;
    this.element.hidden = !level;
    if (!level) return;
    this.element.style.setProperty('--route-progress', `${sim.routeProgress * 100}%`);
    const bypass = sim.activeFork;
    const p = bypass ? Math.max(0, Math.min(1, (sim.s - bypass.start) / (bypass.end - bypass.start))) : 0;
    this.element.style.setProperty('--route-branch-offset', `${-72 * p * (1 - p)}px`);
    this.branches.forEach((path, i) => {
      const fork = level.forks.find(fork => fork.index === FORK_ROUTES[i].index);
      path.classList.toggle('taken', fork?.state === 'bypass' || fork?.state === 'rejoined');
      path.classList.toggle('available', fork?.state === 'approach');
    });
    this.nodes.forEach((node, i) => {
      const outcome = level.outcomes[i - 1];
      const cleared = i === 0 || outcome === 'cleared' || (i === this.stations.length - 1 && level.finished);
      const bypassed = outcome === 'escaped' || outcome === 'partial' || outcome === 'bypassed';
      const current = sim.encounter ? i === level.index : level.finished && i === this.stations.length - 1;
      node.classList.toggle('cleared', cleared); node.classList.toggle('bypassed', bypassed); node.classList.toggle('current', Boolean(current));
      if (current) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
      const state = current ? 'current' : outcome || (cleared ? 'reached' : 'ahead');
      const label = `${this.stations[i].name}: ${state}`;
      node.setAttribute('aria-label', label); node.title = label;
      const symbol = outcome === 'cleared' ? check : bypassed ? dash : icons[this.stations[i].type];
      if (node.dataset.symbol !== symbol) { node.innerHTML = svg(symbol); node.dataset.symbol = symbol; }
    });
    const nextName = names[LEVEL_ENCOUNTERS[level.index]] || 'Finish';
    this.now.textContent = level.finished ? 'HIGHWAY COMPLETE' : sim.encounter ? `NOW · ${names[sim.encounter.type]}` : level.index === LEVEL_ENCOUNTERS.length ? 'FINAL STRETCH' : 'ON THE HIGHWAY';
    this.next.textContent = level.finished ? 'FINISH' : `NEXT · ${nextName}`;
    if (bypass) {
      this.now.textContent = 'BYPASS · SLOW TRAFFIC'; this.next.textContent = 'REJOIN AHEAD';
    } else if (level.fork?.state === 'approach') {
      this.now.textContent = `FORK · ${Math.max(0, Math.ceil((level.fork.start - sim.s) / 5) * 5)} m`;
      this.next.textContent = `${level.fork.side < 0 ? '← LEFT' : 'RIGHT →'} SKIPS ${nextName.toUpperCase()}`;
    }
    this.element.setAttribute('aria-label', `Highway route. ${this.now.textContent}. ${this.next.textContent}. ${Math.round(sim.routeProgress * 100)} percent through the route.`);
  }
}
