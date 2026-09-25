import './leaderboard.css';
import {CAMPAIGN_LEVELS, campaignArea, areaLevels} from './campaign.js';
import {Leaderboard, leaderboardError} from './leaderboard.js';
import {mockLeaderboard} from './leaderboard-mocks.js';

const formatTime = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;

export class LeaderboardUI {
  constructor(currentLevel, practice, returnToMenu, personalBest) {
    this.practice = practice;
    this.personalBest = personalBest;
    this.service = new Leaderboard();
    this.request = 0; this.index = null; this.visible = false;
    this.cache = new Map();
    this.profile = document.createElement('form');
    this.profile.className = 'pilot-profile';
    this.profile.innerHTML = `
      <div class="pilot-heading"><label for="pilot-name">PILOT NAME</label><span data-pilot-state>CHOOSE YOUR CALLSIGN</span></div>
      <div class="pilot-name-row"><input id="pilot-name" type="text" minlength="2" maxlength="20" placeholder="Enter your pilot name" required autocomplete="nickname" aria-describedby="pilot-note"><button type="submit" aria-label="Save pilot name">SAVE <span aria-hidden="true">↵</span></button></div>
      <p id="pilot-note">Race without a name, or save one to publish your times online.</p>
      <p class="pilot-status" data-profile-status role="status"></p>`;
    document.getElementById('campaign-picker').before(this.profile);
    this.name = this.profile.querySelector('input'); this.name.value = this.service.nickname;
    this.profile.addEventListener('submit', event => { event.preventDefault(); this.savePilot(); });
    this.name.addEventListener('input', () => {
      this.name.setCustomValidity('');
      this.profile.querySelector('[data-pilot-state]').textContent = this.name.value === this.service.nickname && this.service.nickname ? 'SAVED' : 'CHOOSE YOUR CALLSIGN';
    });

    this.board = document.createElement('aside');
    this.board.id = 'menu-leaderboard';
    this.board.setAttribute('aria-labelledby', 'leaderboard-title');
    this.board.innerHTML = `
      <div class="timing-title-row"><h2 id="leaderboard-title">TOP TIMES</h2></div>
      <p class="timing-course" data-course></p>
      <div class="timing-record"><div><span>TOP TIME</span><strong data-record>—</strong><p data-record-pilot></p></div><div class="timing-personal"><span>YOUR BEST</span><strong data-personal-best>—</strong><p data-personal-note>No completed run</p></div></div>
      <div class="timing-chart-heading"><span>#</span><span>PILOT</span><span>ELAPSED TIME · LOWER IS BETTER</span></div>
      <ol class="timing-chart" aria-label="Top ten completion times"></ol>
      <div class="timing-axis" aria-hidden="true"><span>0 SEC</span><span data-axis-mid></span><span data-axis-end></span></div>
      <div class="timing-board-footer"><p data-board-status role="status"></p><button type="button" data-refresh aria-label="Refresh times">↻</button></div>`;
    document.getElementById('menu').append(this.board);
    this.board.querySelector('[data-refresh]').onclick = () => { void this.refresh(true); void this.service.flush(); };
    window.addEventListener('online', () => { if (this.visible) void this.refresh(true); });
    this.resultStatus = document.createElement('p');
    this.resultStatus.className = 'board-result-status'; this.resultStatus.setAttribute('role', 'status');
    document.querySelector('#result .panel-copy').after(this.resultStatus);
    const resultButton = document.createElement('button');
    resultButton.type = 'button'; resultButton.className = 'panel-secondary'; resultButton.textContent = 'VIEW LEVEL TIMES';
    resultButton.onclick = () => {
      returnToMenu();
      this.board.scrollIntoView({block: 'nearest', behavior: 'instant'});
      this.board.querySelector('[data-refresh]').focus({preventScroll: true});
    };
    document.querySelector('#result .result-secondary-actions').append(resultButton);
    this.service.addEventListener('change', () => {
      this.updateStatus();
      if (!this.service.busy) {
        // Keep the last known real scores visible if the next request fails.
        for (const entry of this.cache.values()) entry.at = 0;
        if (this.visible) void this.refresh();
      }
    });
    this.updateStatus(); this.select(currentLevel());
    window.setTimeout(() => { void this.service.flush(); }, 1500);
  }
  savePilot() {
    try {
      // Race also saves a newly typed name, without requiring an extra button click.
      if (!this.name.reportValidity()) return false;
      void this.service.setNickname(this.name.value);
      this.name.value = this.service.nickname;
      this.name.setCustomValidity(''); this.updateStatus(); return true;
    } catch (error) {
      this.name.setCustomValidity(error.message); this.name.reportValidity(); return false;
    }
  }
  ensurePilot() {
    if (this.practice) return true;
    // A fresh visitor can start with one tap. Unnamed times remain queued locally.
    if (!this.name.value.trim() && !this.service.nickname) return true;
    if (this.name.value === this.service.nickname && this.service.nickname) return true;
    return this.savePilot();
  }
  select(index) {
    if (this.index === index) return;
    this.index = index; this.request++;
    const area = campaignArea(index), ordinal = areaLevels(area.id).findIndex(level => level.index === index) + 1;
    this.board.querySelector('[data-course]').textContent = `${area.name} / ${String(ordinal).padStart(2,'0')} ${CAMPAIGN_LEVELS[index].name}`;
    this.board.querySelector('ol').setAttribute('aria-label', `Top ten completion times for ${CAMPAIGN_LEVELS[index].name}`);
    this.renderCurrent();
    if (this.visible) void this.refresh();
  }
  setVisible(visible) {
    if (this.visible === visible) return;
    this.visible = visible;
    if (visible) this.renderPersonalBest();
    if (visible) void this.refresh();
  }
  complete(index, time) { this.service.complete(CAMPAIGN_LEVELS[index].id, time); }
  result(finished) { this.resultStatus.hidden = !finished; }
  updateStatus() {
    const count = Object.keys(this.service.pending).length;
    this.profile.querySelector('[data-pilot-state]').textContent = this.name.value === this.service.nickname && this.service.nickname ? 'SAVED' : 'CHOOSE YOUR CALLSIGN';
    const message = this.service.busy ? 'Uploading times…' : count ? `${count} ${count === 1 ? 'time' : 'times'} waiting to sync. ${this.service.message}` : '';
    this.profile.querySelector('[data-profile-status]').textContent = message;
    this.resultStatus.textContent = this.service.message || 'Set your pilot name on the main menu to publish times.';
    if (this.index !== null) this.renderPersonalBest();
  }
  renderCurrent() {
    const cached = this.cache.get(this.index);
    const realRows = cached?.rows ?? [];
    const placeholders = mockLeaderboard(this.index).slice(0, Math.max(0, 10 - realRows.length))
      .map(row => ({...row, placeholder: true}));
    this.render([...realRows, ...placeholders]);
    this.board.querySelector('[data-board-status]').textContent = cached
      ? placeholders.length ? 'Example pilots fill open places. Race to add your time.' : 'Campaign runs · fastest times first.'
      : 'Loading times… Example pilots fill open places.';
  }
  render(rows) {
    this.renderPersonalBest();
    const list = this.board.querySelector('ol'); list.replaceChildren();
    const fastest = rows.find(row => !row.placeholder);
    this.board.querySelector('[data-record]').textContent = fastest ? formatTime(fastest.time_ms) : '—';
    this.board.querySelector('[data-record-pilot]').textContent = fastest ? fastest.display_name : 'Awaiting first finisher';
    const max = rows.length ? Math.ceil(Math.max(...rows.map(row => row.time_ms)) / 5000) * 5000 : 0;
    this.board.querySelector('[data-axis-mid]').textContent = max ? `${max / 2000}` : '';
    this.board.querySelector('[data-axis-end]').textContent = max ? `${max / 1000} SEC` : '';
    if (!rows.length) {
      const empty = document.createElement('li'); empty.className = 'timing-empty';
      empty.textContent = 'YOUR NEXT RUN COULD LEAD THE BOARD.'; list.append(empty);
    }
    for (const [index, entry] of rows.entries()) {
      const row = document.createElement('li'); row.className = `timing-row${entry.is_you ? ' is-you' : ''}${entry.placeholder ? ' is-placeholder' : ''}`;
      const rank = document.createElement('span'); rank.className = 'timing-rank'; rank.textContent = entry.placeholder ? '—' : String(index + 1).padStart(2, '0');
      const name = document.createElement('span'); name.className = 'timing-pilot'; name.textContent = `${entry.display_name}${entry.is_you ? ' · YOU' : ''}`;
      if (entry.placeholder) {
        const label = document.createElement('small'); label.className = 'timing-example'; label.textContent = 'EXAMPLE'; name.append(label);
      }
      const time = document.createElement('span'); time.className = 'timing-time'; time.textContent = formatTime(entry.time_ms);
      const track = document.createElement('span'); track.className = 'timing-track'; track.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('i'); bar.style.width = `${entry.time_ms / max * 100}%`; track.append(bar);
      row.append(rank, name, time, track); list.append(row);
    }
  }
  renderPersonalBest() {
    const local = this.personalBest();
    const published = this.cache.get(this.index)?.rows.find(row => row.is_you)?.time_ms;
    const localMs = Number.isFinite(local) && local > 0 ? Math.ceil(local * 1000) : null;
    const time = localMs === null ? published : Math.min(localMs, published ?? Infinity);
    this.board.querySelector('[data-personal-best]').textContent = time ? formatTime(time) : '—';
    this.board.querySelector('[data-personal-note]').textContent = time ? time === published ? 'Published personal best' : 'Saved on this browser' : 'No completed run';
  }
  async refresh(force = false) {
    const index = this.index, cached = this.cache.get(index);
    if (!force && cached && Date.now() - cached.at < 30000) { this.renderCurrent(); return; }
    const request = ++this.request;
    const status = this.board.querySelector('[data-board-status]'); status.textContent = 'Loading live times…';
    try {
      const rows = await this.service.top(CAMPAIGN_LEVELS[index].id);
      if (request !== this.request || this.index !== index) return;
      this.cache.set(index, {rows, at: Date.now()}); this.renderCurrent();
    } catch (error) {
      if (request === this.request) status.textContent = `${leaderboardError(error)} Example rows are not ranked.`;
    }
  }
}
