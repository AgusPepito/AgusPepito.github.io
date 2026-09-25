const MUSIC_ROOT=`${import.meta.env.BASE_URL}assets/music/`;
const RACE_TRACKS=['race-01.mp3'];
const STORAGE_KEY='vector-shift-music-enabled';

// Stream compressed audio through media elements, not decoded whole-song buffers.
// Track changes are independent of checkpoints and retries.
export class RaceMusic {
  constructor(button) {
    this.button=button;this.state='ready';this.track=0;this.enabled=true;
    this.failedTracks=new Set();
    try{this.enabled=localStorage.getItem(STORAGE_KEY)!=='false';}catch{}
    this.menu=new Audio(`${MUSIC_ROOT}menu.mp3`);
    this.menu.loop=true;this.menu.preload='none';this.menu.volume=.35;
    this.race=new Audio();this.race.loop=true;this.race.preload='none';this.race.volume=.4;
    this.race.addEventListener('ended',()=>this.nextTrack());
    this.race.addEventListener('error',()=>{
      this.failedTracks.add(this.track);
      if(this.failedTracks.size<RACE_TRACKS.length)this.nextTrack();
    });
    button.addEventListener('click',()=>{
      this.enabled=!this.enabled;
      try{localStorage.setItem(STORAGE_KEY,String(this.enabled));}catch{}
      this.updateButton();this.apply();
    });
    // Retry blocked playback inside a real user gesture. play() rejections are
    // harmless (autoplay policy, interrupted loads, or unavailable media).
    const unlock=event=>{if(!button.contains(event.target))this.apply();};
    document.addEventListener('pointerup',unlock);
    document.addEventListener('keydown',unlock);
    document.addEventListener('visibilitychange',()=>this.apply());
    window.addEventListener('pagehide',()=>{this.menu.pause();this.race.pause();});
    window.addEventListener('pageshow',()=>this.apply());
    this.updateButton();this.apply();
  }
  updateButton() {
    this.button.textContent=this.enabled?'♫ ON':'♫ OFF';
    this.button.setAttribute('aria-pressed',String(this.enabled));
    this.button.setAttribute('aria-label',this.enabled?'Mute music':'Enable music');
    this.button.title=this.enabled?'Mute music':'Enable music';
  }
  setState(state) {
    if(this.state===state)return;
    this.state=state;this.apply();
  }
  nextTrack() {
    if(this.failedTracks.size===RACE_TRACKS.length)return;
    do{this.track=(this.track+1)%RACE_TRACKS.length;}while(this.failedTracks.has(this.track));
    this.race.src=`${MUSIC_ROOT}${RACE_TRACKS[this.track]}`;
    this.apply();
  }
  apply() {
    if(!this.enabled||document.hidden||this.state==='paused'){
      this.menu.pause();this.race.pause();return;
    }
    const inMenu=this.state==='ready',active=inMenu?this.menu:this.race;
    (inMenu?this.race:this.menu).pause();
    if(!inMenu){
      if(this.failedTracks.size===RACE_TRACKS.length)return;
      if(!this.race.getAttribute('src'))this.race.src=`${MUSIC_ROOT}${RACE_TRACKS[this.track]}`;
      this.race.volume=this.state==='crashed' ? .16 : .4;
    }
    if(active.paused)active.play().catch(()=>{});
  }
}
