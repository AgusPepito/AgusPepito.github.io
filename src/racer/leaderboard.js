import {createClient} from '@supabase/supabase-js';
import {CAMPAIGN_LEVELS, CAMPAIGN_LAYOUT_REVISION} from './campaign.js';
import {SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY} from './leaderboard-config.js';

const STORAGE_KEY = 'vector-shift-leaderboard-v1';
const levelIds = new Set(CAMPAIGN_LEVELS.map(level => level.id));
export function cleanNickname(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 20);
}
export function leaderboardError(error) {
  if (error?.code === 'PGRST202' || error?.code === '42P01') return 'Leaderboards are awaiting database setup.';
  if (error?.code === 'anonymous_provider_disabled') return 'Anonymous sign-ins need to be enabled in Supabase.';
  if (error?.status === 429) return 'Too many requests. Try again shortly.';
  return 'Could not connect to leaderboards. Your pending times are kept here; try again when online.';
}

export class Leaderboard extends EventTarget {
  constructor() {
    super();
    this.nickname = ''; this.pending = {}; this.message = ''; this.busy = false;
    this.client = null; this.authPromise = null;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      this.nickname = cleanNickname(saved?.nickname);
      for (const [id, time] of Object.entries(saved?.revision === CAMPAIGN_LAYOUT_REVISION ? saved.pending ?? {} : {})) {
        if (levelIds.has(id) && Number.isInteger(time) && time >= 1000 && time <= 3600000) this.pending[id] = time;
      }
    } catch { /* Storage is optional; scores can still be published this session. */ }
    window.addEventListener('online', () => { void this.flush(); });
  }
  getClient() {
    // Lazy creation keeps auth/network initialization out of game boot.
    this.client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
      global: {fetch: (url, options = {}) => fetch(url, {
        ...options, signal: options.signal ?? AbortSignal.timeout(12000),
      })},
    });
    return this.client;
  }
  notify() { this.dispatchEvent(new Event('change')); }
  persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({nickname: this.nickname, revision: CAMPAIGN_LAYOUT_REVISION, pending: this.pending})); }
    catch { /* Private browsing or full storage: retain the in-memory queue. */ }
  }
  async identity() {
    if (!this.authPromise) {
      this.authPromise = (async () => {
        const client = this.getClient();
        const {data: {session}, error} = await client.auth.getSession();
        if (error) throw error;
        if (session) return session.user;
        const result = await client.auth.signInAnonymously();
        if (result.error) throw result.error;
        return result.data.user;
      })().finally(() => { this.authPromise = null; });
    }
    return this.authPromise;
  }
  setNickname(value) {
    const name = cleanNickname(value);
    if (name.length < 2) throw new Error('Choose a nickname with 2–20 characters.');
    this.nickname = name; this.persist();
    this.message = 'Nickname saved. New campaign times will be published automatically.';
    this.notify();
    return this.flush();
  }
  complete(levelId, seconds) {
    const milliseconds = Math.ceil(seconds * 1000);
    if (!levelIds.has(levelId) || !Number.isFinite(seconds) || milliseconds < 1000 || milliseconds > 3600000) return;
    this.pending[levelId] = Math.min(this.pending[levelId] ?? Infinity, milliseconds);
    this.persist();
    this.message = this.nickname ? 'Time queued for upload.' : 'Set your pilot name on the main menu to publish your times.';
    this.notify(); void this.flush();
  }
  async flush() {
    if (this.busy || !this.nickname || !Object.keys(this.pending).length) return;
    this.busy = true; this.message = 'Publishing times…'; this.notify();
    try {
      await this.identity();
      // Re-read the queue after each request: another level may finish while uploading.
      while (Object.keys(this.pending).length) {
        const [levelId, milliseconds] = Object.entries(this.pending)[0];
        const {error} = await this.getClient().rpc('submit_race_time', {
          p_level_id: levelId, p_revision: CAMPAIGN_LAYOUT_REVISION,
          p_time_ms: milliseconds, p_display_name: this.nickname,
        });
        if (error) throw error;
        if (this.pending[levelId] === milliseconds) delete this.pending[levelId];
        this.persist();
      }
      this.message = 'Times synced. Your fastest time for each level is kept.';
    } catch (error) { this.message = leaderboardError(error); }
    finally { this.busy = false; this.notify(); }
  }
  async top(levelId) {
    const {data, error} = await this.getClient().rpc('get_race_leaderboard', {
      p_level_id: levelId, p_revision: CAMPAIGN_LAYOUT_REVISION,
    });
    if (error) throw error;
    return data ?? [];
  }
}
