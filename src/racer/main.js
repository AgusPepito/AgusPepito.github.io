import './style.css';
import './menu.css';
import './pause-menu.css';
import './race-screens.css';
import { MenuDemo } from './menu-demo.js';
import { setupMenuUI } from './menu-ui.js';
import { RaceMusic } from './music.js';
import { Race } from './simulation.js';
import { RaceView } from './view.js';
import { graphicsSetting, saveGraphics } from './visual-settings.js';
import { PerformancePanel } from './performance-panel.js';
import { CampaignStream, PREFETCH_BYTES } from './campaign-stream.js';
import { levelAssetConfig } from './levels.js';
import {CAMPAIGN_LEVELS,CAMPAIGN_LAYOUT_REVISION,CampaignProgress,campaignArea,campaignLabel} from './campaign.js';
import {CampaignMenu} from './campaign-menu.js';
import {LeaderboardUI} from './leaderboard-ui.js';
import {CourseLoading} from './loading-ui.js';
import { PHASES, GATES, LENGTH, section, profileSection } from './track.js';
import { OBSTACLES } from './obstacles.js';
import { GAPS, gapJumpCue } from './jumps.js';
import {constructionWalls,constructionWallShape,constructionPassages,constructionEmitters,constructionObstacles,constructionCheckpoints,constructionSurfaceCycle,emitterShapeFor} from './levels.js';
import {CHECKPOINT_REVIEW_AT} from './checkpoint-kit.js';
import { configureLevel, levelInfo, constructionReview, constructionBaseline, constructionCategory, constructionRevision, constructionTubeDetail, constructionTubeVariations, constructionSlabDetail, constructionTransition, constructionGap, constructionGapShape } from './levels.js';

const touchLayout = matchMedia('(pointer: coarse), (max-width: 700px)');
const pad = { pointer: null, steer: 0, jumpArmed: true, brakeArmed: true };
const actionPad = { pointer: null, zone: null, boost: false };
const boostCodes = ['KeyW', 'ShiftLeft', 'ShiftRight'];
const $ = id => document.getElementById(id), race = new Race(), keys = new Set();
const profiler = new PerformancePanel();
setupMenuUI();
const graphicsSelect=$('graphics-quality');
graphicsSelect.value=graphicsSetting();
graphicsSelect.addEventListener('change',()=>{
  const quality=graphicsSelect.value;
  saveGraphics(quality);
  const url=new URL(location.href);url.searchParams.set('graphics',quality);
  history.replaceState(null,'',url);
  view?.setGraphics(quality);
  if(view)graphicsSelect.value=view.pipeline.quality;
});
const music=new RaceMusic($('music-toggle'));
const campaignParams=new URLSearchParams(location.search);
const campaignPractice=!constructionReview&&campaignParams.get('practice')==='1';
const campaignProgress=new CampaignProgress();
let currentLevel = 0, storageKey;
let view, best = null, last = performance.now(), accumulator = 0, shown = '', resultSaved = false, jumpQueued = false, brakeQueued = false, boostQueued = false;
let checkpointNotice = '';
let checkpointNoticeAt=0,reviewCheckpointPassed=false;
let reviewTimeScale = 1, reviewSpeedButton;
let buffering = false, bufferBegan = null;
let preparedLevel = null;
let finishedBest=false;
const campaignMenu=constructionReview?null:new CampaignMenu(campaignProgress,campaignPractice,selectFromMenu);
const leaderboard=constructionReview?null:new LeaderboardUI(()=>currentLevel,campaignPractice,returnToMenu,()=>best?.time??null);
function takePreparedLevel(index) {
  const prepared = preparedLevel; preparedLevel = null;
  if (prepared?.index === index && prepared.stream && !prepared.stream.error) {
    profiler.event('prefetch-adopted', {level:index, assets:prepared.stream.generated, bytes:prepared.stream.cacheBytes});
    return prepared.stream;
  }
  prepared?.stream?.dispose(); return null;
}
function prepareNextLevel() {
  if (constructionReview || currentLevel>=CAMPAIGN_LEVELS.length-1 || !view?.assetsReady(race.s)) return;
  if (!preparedLevel) {
    try {
      preparedLevel = {index:currentLevel+1, stream:new CampaignStream(levelAssetConfig(currentLevel+1), {background:true})};
      profiler.event('prefetch-start', {level:currentLevel+1, budgetBytes:PREFETCH_BYTES});
    } catch (error) {
      // Cache failure must not affect the playable current level.
      preparedLevel = {index:currentLevel+1, disabled:true};
      profiler.event('prefetch-error', {level:currentLevel+1,message:error.message});
    }
  }
  const stream = preparedLevel.stream;
  if (stream) {
    const metric = stream.update(0);
    if (metric) profiler.event('prefetch-asset', {level:preparedLevel.index,...metric});
    if (stream.error && !preparedLevel.reportedError) {
      preparedLevel.reportedError = true;
      profiler.event('prefetch-error', {level:preparedLevel.index,message:stream.error});
    }
  }
}
const courseLoading=new CourseLoading(),assetNotice=courseLoading.element;
function updateAssetReadiness() {
  graphicsSelect.disabled=!view||view.shaderWarmup.state==='compiling';
  const error = view?.assetStream?.error || view?.shaderWarmup.error;
  const waiting = Boolean(view && !view.assetsReady(race.s));
  const next = race.state === 'running' && waiting;
  if (next !== buffering) {
    if (next) {
      bufferBegan = performance.now(); clearInput(); accumulator = 0;
      profiler.event('asset-wait-start', { level: currentLevel, distance: race.s });
    } else {
      profiler.event('asset-wait-end', { level: currentLevel, distance: race.s, durationMs: performance.now() - bufferBegan });
      bufferBegan = null;
    }
  }
  buffering = next; document.body.dataset.buffering = String(buffering);
  const browsingOtherArea=campaignMenu&&campaignMenu.browsedArea!==campaignArea(currentLevel).id;
  const browsedLocked=browsingOtherArea&&!campaignPractice&&!campaignProgress.unlocked(campaignMenu.browsedArea);
  $('start').disabled=Boolean(error||waiting||!view||browsingOtherArea);
  const stream = view?.assetStream;
  const rawProgress=stream?.total?stream.completed/stream.total:0;
  const percent=waiting?Math.min(100,Math.max(0,Math.floor(rawProgress*100))):100;
  const finalizing=view?.shaderWarmup.state==='compiling'||Boolean(waiting&&stream?.ready());
  courseLoading.update({visible:Boolean(error||buffering||race.state==='ready'&&waiting),inMenu:race.state==='ready',
    name:levelInfo(currentLevel).name,percent,finalizing,error});
  const status=error?'COULD NOT LOAD COURSE':waiting?'LOADING COURSE':browsedLocked?'AREA LOCKED':browsingOtherArea?'SELECT A LEVEL':campaignPractice?'PRACTICE · UNRANKED':'READY TO RACE';
  if($('menu-status').textContent!==status)$('menu-status').textContent=status;
  if(!constructionReview){
    const button=$('start'),label=error?'LOAD FAILED':browsedLocked?'LOCKED':browsingOtherArea?'SELECT LEVEL':waiting?'LOADING':`${campaignPractice?'PRACTICE':'RACE'} · ${levelInfo(currentLevel).name}`;
    const detail=error?'!':waiting||browsingOtherArea?'':'»';
    button.dataset.loading=String(waiting&&!error);
    button.setAttribute('aria-busy',String(waiting&&!error));
    if($('start-label').textContent!==label)$('start-label').textContent=label;
    if($('start-progress').textContent!==detail)$('start-progress').textContent=detail;
  }
  if (error && view && !view.reportedAssetError) { profiler.event('asset-worker-error', { message: error }); view.reportedAssetError = true; }
}
function createView(renderer = null, preparedStream = null, shared = null) {
  const began = performance.now();
  const nextView = new RaceView($('race-world'), renderer, preparedStream, shared);
  const viewLevel=currentLevel;
  nextView.onShaderWarmup=(type,data)=>profiler.event(type,{level:viewLevel,...data});
  if(!constructionReview)nextView.menuDemo=new MenuDemo();
  profiler.event('view-created', { level: currentLevel, durationMs: performance.now() - began,reusedSharedAssets:Boolean(shared),scenery:nextView.spaceScenery?.stats });
  return nextView;
}
function toggleReviewSpeed() {
  if (!constructionReview) return;
  reviewTimeScale = reviewTimeScale === 1 ? .25 : 1;
  reviewSpeedButton.textContent = reviewTimeScale === 1 ? 'Speed 1× · T' : 'Slow ¼× · T';
  reviewSpeedButton.setAttribute('aria-pressed', String(reviewTimeScale !== 1));
}
if(!constructionReview){
  currentLevel=campaignProgress.recommended();
  const requested=CAMPAIGN_LEVELS.findIndex(level=>level.id===campaignParams.get('level'));
  if(requested>=0&&(campaignPractice||campaignProgress.unlocked(CAMPAIGN_LEVELS[requested].area)))currentLevel=requested;
}
if (constructionReview) {
  document.body.classList.add('construction-review');
  document.querySelectorAll('.review-copy').forEach(copy=>{copy.hidden=false;});
  currentLevel = 0;
  const pipes = constructionCategory === '02';
  const title = { '01': 'FLAT FOUNDATION', '02': 'PIPE BAYS', '03': 'GRILLE BAYS', '04': 'COVERED METAL', '05': 'MIXED HOUSINGS', '06': 'PHASE LANES', '07': 'OUTSIDE TUBE', '08': 'INSIDE TUBE', '09':'OUTSIDE TRANSITIONS','10':'INSIDE TRANSITIONS','11':'FLAT GAP STUDY','12':'BUTTRESSED WALLS','13':'CHECKERED CHECKPOINTS' }[constructionCategory];
  document.title = `Track library · ${constructionCategory} · ${constructionRevision}`;
  $('menu').querySelector('.eyebrow').textContent = 'TRACK LIBRARY / AWAITING YOUR REVIEW';
  $('menu').querySelector('h1').textContent = `${title}.`;
  $('menu').querySelector('h1 + p').textContent = 'Graphite road panels, ivory edge trim and empty service-bay frames. No hazards. Gentle bends and a bare-edge interval expose the joins and terminations.';
  if (pipes) $('menu').querySelector('h1 + p').textContent = 'Exposed pipe bundles, socket bulkheads, couplings, valves and offset runs inside the approved frames. No hazards. Both sides use different sequences.';
  if (constructionCategory === '03') $('menu').querySelector('h1 + p').textContent = 'Lattice, angled louvers and reinforced grilles in the approved frames. Shallow dark backing, visible start/end trims, and occasional pipe sections for comparison.';
  if (constructionCategory === '04') $('menu').querySelector('h1 + p').textContent = 'Quiet metal covers, segmented armor, service hatches and vents. Tapered start/end panels and occasional grille sections for comparison.';
  $('menu').querySelector('p.subtle').textContent = 'Check width, frame depth, joins and readability at cruise and turbo.';
  $('level').innerHTML = `<option value="0">${constructionCategory} · ${title} · ${constructionRevision}</option>`;
  $('start').textContent = 'Drive review segment ↗';
  $('start').removeAttribute('data-loading');
  $('start').removeAttribute('aria-busy');
  const compare = document.createElement('a'); compare.className = 'original-link';
  compare.href = constructionBaseline ? `?review=${constructionCategory}` : pipes ? '?review=01' : '?review=01&surface=original';
  compare.textContent = constructionBaseline ? 'View construction R1 ↗' : pipes ? 'Compare approved foundation ↗' : 'Compare original road ↗';
  if (['03', '04'].includes(constructionCategory) && !constructionBaseline) { compare.href = '?review=01'; compare.textContent = 'Compare approved foundation ↗'; }
  if (['R2', 'R3'].includes(constructionRevision)) {
    $('menu').querySelector('h1 + p').textContent = 'Raised roadside housings: ivory supports, roof caps and inward-facing service bays. Full-height family connections; ramp caps only at run ends. Road surface and controls unchanged.';
    compare.href = `?review=${constructionCategory}`; compare.textContent = 'Compare shallow R1 ↗';
    if (constructionRevision === 'R3') {
      $('menu').querySelector('h1 + p').textContent = 'Detailed 30° housings: machined pipe fittings, grille cartridges and sloped armor. Full-height family connections; ramp caps at exposed ends.';
      compare.href = `?review=${constructionCategory}&revision=r2`; compare.textContent = 'Compare raised R2 ↗';
    }
  }
  if (['05','06'].includes(constructionCategory)) {
    $('menu').querySelector('h1 + p').textContent = constructionCategory === '05'
      ? 'Pipes, grilles, quiet armor and empty frames in unequal runs. Continuous family joins and ramp caps at exposed ends. Different arrangements on each side.'
      : 'Flush cyan, amber and violet lane inserts through the mixed housings. Match your ship phase to the colored lane for turbo; neutral road intervals separate the runs.';
    $('menu').querySelector('p.subtle').textContent = constructionCategory === '05'
      ? 'Check family joins, roof continuity, exposed ends and the balance of busy and quiet sections.'
      : 'Check lane boundaries, start/end readability and the distinction between colored lanes and neutral edge markers.';
    compare.href = constructionCategory === '05' ? '?review=04&revision=r3' : '?review=05&revision=r1';
    compare.textContent = constructionCategory === '05' ? 'Compare R3 covered bays ↗' : 'Compare mixed housings without lanes ↗';
  }
  $('start').after(compare);
  if (['07','08'].includes(constructionCategory)) {
    $('menu').querySelector('h1 + p').textContent=constructionCategory==='08'
      ? 'Drive the complete inner circumference. Curved graphite panels, flush ivory bands, protected service recesses and a violet lane winding around the tunnel.'
      : 'Drive the complete outer circumference. Curved graphite panels, flush ivory bands, protected service recesses and phase lanes leading around the tube.';
    $('menu').querySelector('p.subtle').textContent='Check the closure seam, all-around lane readability, mouth thickness and service recesses. No hazards; R retries.';
    compare.href=constructionCategory==='08'?'?review=07&revision=r1':'?review=06&revision=r1';
    compare.textContent=constructionCategory==='08'?'Compare outside tube ↗':'Compare approved flat lanes ↗';
  }
  const library = document.createElement('a'); library.className = 'original-link';
  library.href = `./library.html?category=${constructionCategory}&revision=${constructionRevision.toLowerCase()}`; library.textContent = 'Individual asset library ↗'; compare.after(library);
  if(constructionTubeDetail){
    document.title=`Tube ${constructionCategory} · R2 service section`;
    $('menu').querySelector('h1').textContent='IVORY SERVICE SECTION.';
    $('menu').querySelector('h1 + p').textContent='One twelve-metre ivory section: deep pipe trays, cooling cartridges, asymmetric access doors and replacement armor plates. Quiet graphite surrounds it.';
    $('menu').querySelector('p.subtle').textContent='Approved twelve-metre composition. Steer around the tube to see each panel family. W boosts; R retries.';
    $('level').options[0].textContent=`${constructionCategory} · R2 APPROVED SERVICE SECTION`;
    compare.href=`?review=${constructionCategory}&revision=r1`;compare.textContent='Compare original tube R1 ↗';
    library.href+= '&asset=detail-r2';
  }
  if(constructionTubeVariations){
    document.title=`Tube ${constructionCategory} · R2 service variations`;
    $('menu').querySelector('h1').textContent='SERVICE VARIATIONS.';
    $('menu').querySelector('h1 + p').textContent='Pipe manifolds, split cooling banks, reinforced access hatches and quiet armor. Eight twelve-metre ivory sections punctuate unequal graphite stretches across this 1,800 m tube.';
    $('menu').querySelector('p.subtle').textContent='First section at 100 m. Steer around the tube to compare the panels. W boosts; R retries.';
    $('level').options[0].textContent=`${constructionCategory} · R2 SERVICE VARIATIONS`;
    compare.href=`?review=${constructionCategory}&detail=service`;compare.textContent='Compare approved service section ↗';
    library.href=`./library.html?category=${constructionCategory}&revision=r1&asset=variation-pipe`;
  }
  if(constructionSlabDetail){
    document.title=`Track ${constructionCategory} · brushed metal slab candidate`;
    $('menu').querySelector('h1').textContent='BRUSHED METAL SLABS.';
    $('menu').querySelector('h1 + p').textContent='Shallow bevels, inset joints, repair plates and brushed metal highlights across a 600 m sample. A violet lane crosses the slab layouts from 75 m.';
    $('menu').querySelector('p.subtle').textContent='Compare the plate depth, sheen and readability at speed. Press 3 to match the violet lane; W boosts and R retries.';
    $('level').options[0].textContent=`${constructionCategory} · SLAB CANDIDATE`;
    compare.href=`?review=${constructionCategory}&revision=r1`;compare.textContent='Compare original slabs ↗';
    library.href=`./library.html?category=${constructionCategory}&revision=r1&asset=slab-candidate`;
  }
  if(constructionTransition){
    $('menu').querySelector('h1 + p').textContent=constructionCategory==='09'
      ?'Flat road rolls into an outside tube and opens back out. Approved brushed metal slabs, ivory service sections and a continuous cyan lane follow the changing surface.'
      :'Flat road curls into an inside tube, opens into a flat connector, then rolls into a short outside tube. Brushed metal slabs, changing service panels and a continuous violet lane.';
    $('menu').querySelector('p.subtle').textContent='Check the closing edges, lane width, mechanical fittings and camera clearance while steering. No hazards. R retries.';
    compare.href=constructionCategory==='09'?'?review=07&detail=slabs':'?review=09';
    compare.textContent=constructionCategory==='09'?'Compare approved tube slabs ↗':'Compare outside transition ↗';
    library.href=`./library.html?category=${constructionCategory}&revision=r1&asset=closing`;
  }
  if(constructionGap){
    $('level').options[0].textContent=`11 · ${constructionGapShape.toUpperCase()} GAPS`;
    $('menu').querySelector('h1').textContent=`${constructionGapShape.toUpperCase()} GAPS`;
    $('menu').querySelector('h1 + p').textContent='Illuminated takeoff arrows, receiving brackets and bright landing strips. The partial opening has recessed border lights and exposed metal cut faces. Both gaps are 75 m long, with twelve-metre illuminated ends.';
    if(constructionGapShape!=='flat')$('menu').querySelector('h1 + p').textContent+=constructionGapShape==='inside'?' New deep service collars give the open tube ends thickness, with ivory armor and recessed energy lights.':' New plated end caps close the exposed tube interior, with mechanical service recesses and energy lights.';
    $('menu').querySelector('p.subtle').textContent='Full gap at 450 m; 18 m wide partial opening at 1050 m. Space jumps, steering can bypass the partial gap. T toggles quarter speed. R retries.';
    const prefix=constructionGapShape==='flat'?'':`${constructionGapShape}-`;
    compare.href=`./library.html?category=11&revision=r1&asset=${prefix}takeoff`;compare.textContent='Inspect takeoff lip ↗';
    library.href=`./library.html?category=11&revision=r1&asset=${prefix}landing`;library.textContent='Inspect landing lip ↗';
    const shapes=document.createElement('p');shapes.className='subtle';
    for(const shape of ['flat','outside','inside']){
      const link=document.createElement('a');link.href=`?review=11&shape=${shape}`;
      link.textContent=shape==='flat'?'Flat gaps':`${shape==='outside'?'Outside':'Inside'} tube gaps`;
      if(shape===constructionGapShape)link.setAttribute('aria-current','page');
      if(shapes.childNodes.length)shapes.append(' · ');shapes.append(link);
    }
    $('menu').querySelector('p.subtle').after(shapes);
  }
  if(constructionWalls){
    $('level').options[0].textContent=`12 · ${constructionWallShape.toUpperCase()} WALLS`;
    $('menu').querySelector('h1').textContent=`${constructionWallShape.toUpperCase()} WALLS`;
    $('menu').querySelector('h1 + p').textContent='W4 walls R2: beveled ivory armor, recessed vent and lock pockets, detailed service doors, crown pipe couplings and pearl-white optical wells. Rebuilt surface layers replace the overlapping first-pass plates.';
    $('menu').querySelector('p.subtle').textContent='Solid walls at 350, 800 and 1250 m. Steer around them; these are not jump barriers. T toggles quarter speed. R retries.';
    compare.href=`./library.html?category=12&revision=r1&asset=${constructionWallShape}-run`;compare.textContent='Inspect wall assembly ↗';
    library.href=`./library.html?category=12&revision=r1&asset=${constructionWallShape}-middle`;library.textContent='Inspect repeatable module ↗';
    const links=document.createElement('p');links.className='subtle';
    for(const shape of ['flat','outside','inside']){
      const a=document.createElement('a');a.href=`?review=12&shape=${shape}${constructionObstacles?'&element=obstacles':constructionEmitters?'&element=gates':constructionPassages?'&element=passages':''}`;a.textContent=`${shape==='flat'?'Flat':shape==='inside'?'Inside tube':'Outside tube'} ${constructionObstacles?'obstacles':constructionEmitters?'phase gates':constructionPassages?'passages':'walls'}`;
      if(constructionSurfaceCycle)a.dataset.emitterShape=shape;
      if(shape===constructionWallShape)a.setAttribute('aria-current','page');
      if(links.childNodes.length)links.append(' · ');links.append(a);
    }
    $('menu').querySelector('p.subtle').after(links);
    if(constructionPassages){
      $('level').options[0].textContent=`12 · ${constructionWallShape.toUpperCase()} PASSAGES`;
      $('menu').querySelector('h1').textContent=`${constructionWallShape.toUpperCase()} PASSAGES`;
      $('menu').querySelector('h1 + p').textContent='P3 service gantries with ivory jambs, protected pipework, cabinet details, a recessed truss and pearl-white receiving lights. Approved W4 walls fill the road beside each opening.';
      $('menu').querySelector('p.subtle').textContent='Passages at 350, 850 and 1350 m. Steer through the lit opening; jumping hits the lintel. T toggles quarter speed. R retries.';
      compare.href=`./library.html?category=12&asset=${constructionWallShape}-passage`;compare.textContent='Inspect passage frame ↗';
      library.href=`./library.html?category=12&asset=${constructionWallShape}-passage-infill`;library.textContent='Inspect passage with walls ↗';
    }
    if(constructionEmitters){
      $('level').replaceChildren(...[0,1,2].map(i=>new Option(`12 · ${emitterShapeFor(i).toUpperCase()} PHASE GATES`,String(i))));
      $('menu').querySelector('h1').textContent=`${constructionWallShape.toUpperCase()} PHASE GATES`;
      $('menu').querySelector('h1 + p').textContent='Twenty-four-metre recessed power stations: additional cable and capacitor bays extend both ends for longer visibility. Deep service wells and segmented optical emitters sit below the road; only the light curtain projects above it.';
      $('menu').querySelector('p.subtle').textContent='All three surfaces cycle automatically. Choose a starting surface above or use Next surface to skip ahead. Match gate colors with 1, 2 and 3. T slows; R retries the current surface.';
      compare.id='gate-inspect';library.id='gate-module-link';
      compare.href=`./library.html?category=12&asset=${constructionWallShape}-gate`;compare.textContent='Inspect complete phase gate ↗';
      library.href=`./library.html?category=12&asset=${constructionWallShape}-gate-module`;library.textContent='Inspect detailed emitter module ↗';
    }
    if(constructionObstacles){
      $('level').replaceChildren(...[0,1,2].map(i=>new Option(`12 · ${emitterShapeFor(i).toUpperCase()} OBSTACLES`,String(i))));
      $('menu').querySelector('h1').textContent=`${constructionWallShape.toUpperCase()} OBSTACLES`;
      $('menu').querySelector('h1 + p').textContent='Detailed louver barriers, armored end caps and a compact service passage. Drive through a tall opening, choose between jumping and an opening, then clear a full-width low barrier.';
      $('menu').querySelector('p.subtle').textContent='350 m: opening only. 850 m: jump or opening. 1350 m: jump only. 1800 m: offset passage. Space jumps; T slows; R retries. Next surface switches between flat and both tubes.';
      compare.id='obstacle-inspect';library.id='obstacle-module-link';
      compare.textContent='Inspect jump-or-opening assembly ↗';library.textContent='Inspect J3 louver module ↗';
    }
  }
  if(constructionCheckpoints){
    $('level').replaceChildren(...[0,1,2].map(i=>new Option(`13 · ${emitterShapeFor(i).toUpperCase()} CHECKPOINT`,String(i))));
    $('menu').querySelector('h1 + p').textContent='Thirty metres of ivory-and-graphite checkers, recessed circular timing instruments and pearl-white lamp cassettes. A dedicated optical row projects the white checkpoint curtain.';
    $('menu').querySelector('p.subtle').textContent='Checkpoint at 350 m. Every phase can pass. Boost refills without stopping the ship; clear road continues beyond it. T slows, R retries, Next surface switches between flat and both tubes.';
    compare.id='checkpoint-inspect';library.id='checkpoint-module-link';
    compare.textContent='Inspect complete checkpoint ↗';library.textContent='Inspect recessed instrument details ↗';
  }
  const label = document.createElement('div'); label.id = 'construction-label';
  label.textContent = constructionBaseline ? `${constructionCategory} · ORIGINAL ROAD` : `${constructionCategory} · ${title} ${constructionRevision}`;
  if(constructionTubeDetail)label.textContent=`${constructionCategory} · R2 ${constructionTubeVariations?'SERVICE VARIATIONS':'APPROVED SERVICE SECTION'}`;
  if(constructionSlabDetail)label.textContent=`${constructionCategory} · BRUSHED METAL SLAB CANDIDATE`;
  if(constructionGap)label.textContent=`11 · ${constructionGapShape.toUpperCase()} · FULL + PARTIAL GAPS`;
  if(constructionWalls)label.textContent=`12 · ${constructionWallShape.toUpperCase()} · W4 WALLS R2`;
  if(constructionPassages)label.textContent=`12 · ${constructionWallShape.toUpperCase()} · P3 PASSAGES R1`;
  if(constructionEmitters)label.textContent=`12 · ${constructionWallShape.toUpperCase()} · RECESSED PHASE GATES R1`;
  if(constructionObstacles)label.textContent=`12 · ${constructionWallShape.toUpperCase()} · J3 OBSTACLE ASSEMBLIES R1`;
  document.body.append(label);
  reviewSpeedButton = document.createElement('button');
  reviewSpeedButton.id = 'review-speed';
  reviewSpeedButton.type = 'button';
  reviewSpeedButton.textContent = 'Speed 1× · T';
  reviewSpeedButton.setAttribute('aria-label', 'Quarter-speed review mode');
  reviewSpeedButton.setAttribute('aria-pressed', 'false');
  reviewSpeedButton.title = 'Toggle normal / quarter-speed review with T. Jump distance stays the same.';
  reviewSpeedButton.addEventListener('click', toggleReviewSpeed);
  document.body.append(reviewSpeedButton);
  if(constructionSurfaceCycle){
    const next=document.createElement('button');next.id='review-next-surface';next.type='button';
    next.addEventListener('click',()=>{start((currentLevel+1)%3);checkpointNotice=`${constructionCategory} · ${constructionWallShape.toUpperCase()} ${constructionCheckpoints?'CHECKPOINT':constructionObstacles?'OBSTACLES':'GATES'}`;});
    document.body.append(next);
  }
}
function loadBest() {
  best = null;
  if (constructionReview) return;
  storageKey = `vector-shift-areas-001-best-${CAMPAIGN_LEVELS[currentLevel].id}-${CAMPAIGN_LAYOUT_REVISION}`;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.time) && saved.time > 0 && Array.isArray(saved.splits) && saved.splits.length === 1 && saved.splits.every(Number.isFinite)) best = saved;
  } catch { /* Local records are optional. */ }
}
function updateLevelChoice() {
  leaderboard?.select(currentLevel);
  if(campaignMenu){campaignMenu.select(currentLevel);updateLesson(currentLevel);return;}
  if (![...$('level').options].some(o => Number(o.value) === currentLevel)) {
    const option = document.createElement('option'); option.value = currentLevel;
    option.textContent = `${currentLevel + 1} · ${levelInfo(currentLevel).name}`; $('level').append(option);
  }
  $('level').value = String(currentLevel);
  if(constructionSurfaceCycle){
    const shape=constructionWallShape;
    $('construction-label').textContent=`${constructionCategory} · ${shape.toUpperCase()} · ${constructionCheckpoints?'CHECKERED CHECKPOINT':constructionObstacles?'J3 OBSTACLE ASSEMBLIES':'RECESSED PHASE GATES'} R1`;
    $('menu').querySelector('h1').textContent=`${shape.toUpperCase()} ${constructionCheckpoints?'CHECKPOINT':constructionObstacles?'OBSTACLES':'PHASE GATES'}`;
    $('review-next-surface').textContent=`Next surface: ${emitterShapeFor(currentLevel+1)} ↗`;
    if(constructionCheckpoints){
      $('checkpoint-inspect').href=`./library.html?category=13&asset=${shape}-checkpoint`;
      $('checkpoint-module-link').href=`./library.html?category=13&asset=${shape}-checkpoint-module`;
    }else if(constructionObstacles){
      $('obstacle-inspect').href=`./library.html?category=12&asset=${shape}-obstacle-jump-or-opening`;
      $('obstacle-module-link').href=`./library.html?category=12&asset=${shape}-barrier-middle`;
    }else{
      $('gate-inspect').href=`./library.html?category=12&asset=${shape}-gate`;
      $('gate-module-link').href=`./library.html?category=12&asset=${shape}-gate-module`;
    }
    for(const link of document.querySelectorAll('[data-emitter-shape]')){
      if(link.dataset.emitterShape===shape)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    }
  }
  updateLesson(currentLevel);
}
function updateLesson(index) {
  const lesson = levelInfo(index).lesson;
  $('level-lesson').textContent = touchLayout.matches ? lesson.replace('Space jumps. W boosts.', 'Left pad up jumps. Right pad up boosts.').replace('with 1, 2 or 3', 'with the right pad directions') : lesson;
}
configureLevel(currentLevel); loadBest(); updateLevelChoice();
const format = seconds => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
function resetPad() {
  const pointer = pad.pointer;
  pad.pointer = null; pad.steer = 0; pad.jumpArmed = true; pad.brakeArmed = true;
  if (pointer !== null && $('thumbpad').hasPointerCapture(pointer)) $('thumbpad').releasePointerCapture(pointer);
  $('pad-knob').style.transform = 'translate(-50%, -50%)';
  $('thumbpad').classList.remove('pressed');
}
function clearInput() {
  keys.clear(); resetPad(); jumpQueued = false; brakeQueued = false; boostQueued = false;
  resetActionPad();
  $('jump').classList.remove('active');
}

function phase(index) { if (race.state === 'running' || race.state === 'ready') race.phase = index; }
function changeLevel(index) {
  if(!view||!Number.isInteger(index)||index<0)return false;
  if(constructionSurfaceCycle)index%=3;
  if(!constructionReview&&(!CAMPAIGN_LEVELS[index]||!campaignPractice&&!campaignProgress.unlocked(CAMPAIGN_LEVELS[index].area)))return false;
  if (index !== currentLevel) {
    currentLevel = index; configureLevel(currentLevel);
    const renderer = view.renderer,shared=constructionReview?null:view.releaseSharedObjects();
    const disposeBegan=performance.now();view.dispose({ keepRenderer: true });
    profiler.event('previous-view-disposed',{level:currentLevel,durationMs:performance.now()-disposeBegan});
    try { view = createView(renderer, takePreparedLevel(index),shared); }
    catch (error) { view = null; race.state = 'ready'; $('start').disabled = true; $('loading-error').hidden = false; $('loading-error').textContent = error.message; sync(); return false; }
    loadBest(); updateLevelChoice();
  }
  return true;
}
function selectFromMenu(index){
  if(!changeLevel(index))return;
  clearInput();race.reset();view.snap=true;checkpointNotice='';
  updateLevelChoice();updateAssetReadiness();sync();
}
function returnToMenu(){
  clearInput();race.reset();if(view)view.snap=true;checkpointNotice='';
  updateLevelChoice();sync();
}
function start(index = currentLevel, carry = null) {
  const startBegan = performance.now();
  if(!carry&&leaderboard&&!leaderboard.ensurePilot())return;
  if(!changeLevel(index))return;
  if (!carry) { clearInput(); checkpointNotice = ''; }
  race.reset(); race.mode = 'phase';
  $('controls-dialog').close();
  reviewCheckpointPassed=false;checkpointNoticeAt=0;
  if (carry) Object.assign(race, carry);
  race.state = 'running'; resultSaved = false; finishedBest=false; accumulator = 0; view.snap = true;
  updateAssetReadiness();
  if (!carry) document.activeElement?.blur();
  // Prepare the reset camera and HUD before removing the menu. Otherwise the
  // browser can expose the previous frame/telemetry during the Play handoff.
  updateHud();
  const renderBegan=performance.now();
  view.render(race, 0);
  profiler.event('start-first-render',{level:currentLevel,durationMs:performance.now()-renderBegan});
  last = performance.now();
  sync();
  profiler.event('run-start', { level: currentLevel, mode: race.mode, checkpoint: Boolean(carry), durationMs: performance.now() - startBegan });
  profiler.previous = null;
}
function saveCompletion(){
  if(constructionReview||resultSaved||race.mode!=='phase')return;
  finishedBest=!best||race.time<best.time;
  if(!campaignPractice){
    campaignProgress.complete(currentLevel);
    if(finishedBest){
      best={time:race.time,splits:[...race.splits]};
      try{localStorage.setItem(storageKey,JSON.stringify(best));}catch{/* Optional records. */}
    }
    leaderboard?.complete(currentLevel,race.time);
  }
  resultSaved=true;campaignMenu.select(currentLevel);
}
function nextCampaignIndex(){
  const next=currentLevel+1,level=CAMPAIGN_LEVELS[next];
  return level&&(campaignPractice||campaignProgress.unlocked(level.area))?next:null;
}
function advanceCheckpoint() {
  if(constructionSurfaceCycle){start((currentLevel+1)%3);checkpointNotice=`${constructionCategory} · ${constructionWallShape.toUpperCase()} ${constructionCheckpoints?'CHECKPOINT':constructionObstacles?'OBSTACLES':'GATES'}`;return;}
  if (constructionReview) { start(); checkpointNotice = `${constructionCategory} · SAMPLE RESTARTED`; return; }
  const completed = currentLevel, completedTime = race.time;
  saveCompletion();
  const next=nextCampaignIndex();
  // Area boundaries reset surface/orientation safely on Continue. The final
  // course stays on its result screen instead of generating another round.
  if(next===null||campaignArea(next).id!==campaignArea(currentLevel).id){accumulator=0;sync();return;}
  const carry = {};
  for (const key of ['speed', 'u', 'lateralSpeed', 'phase', 'height', 'verticalSpeed', 'airborne', 'landing',
    'jumpTime', 'edgeGrace', 'jumpOriginHeight', 'boostBlend', 'thrustBlend', 'brakeTime', 'brakeCooldown', 'brakeTarget', 'brakeRate']) carry[key] = race[key];
  const nextInfo=levelInfo(next),departure=section(LENGTH),arrival=profileSection(0,nextInfo.profile,nextInfo.runs);
  // Relay Grid changes from flat to inside mid-area. Never carry a tube
  // coordinate, bank or airborne pose onto an incompatible starting surface.
  const sameSurface=departure.curl===arrival.curl&&departure.halfWidth===arrival.halfWidth;
  start(next, sameSurface?carry:null);
  checkpointNotice = `${campaignLabel(completed)} · ${format(completedTime)}\nNEXT / ${campaignLabel(currentLevel)}`;
}
function pause() {
  if (race.state === 'running') race.state = 'paused';
  else if (race.state === 'paused') race.state = 'running';
  clearInput(); accumulator = 0; sync();
}
function sync() {
  music.setState(race.state);
  document.body.dataset.state = race.state;
  leaderboard?.setVisible(race.state==='ready');
  $('menu').hidden = race.state !== 'ready'; $('paused').hidden = race.state !== 'paused';
  $('result').hidden = !['crashed', 'checkpoint'].includes(race.state);
  $('pause').hidden = !['running', 'paused'].includes(race.state);
  $('pause').textContent = race.state === 'paused' ? '▷' : 'Ⅱ';
  $('pause').setAttribute('aria-label', race.state === 'paused' ? 'Resume' : 'Pause');
  if (race.state !== shown) {
    if (race.state === 'crashed' || race.state === 'checkpoint') {
      clearInput();
      const finished = race.state === 'checkpoint';
      leaderboard?.result(finished&&!campaignPractice);
      if(finished)saveCompletion();
      const isBest=finished&&finishedBest&&!campaignPractice;
      const wallCrash = race.crashKind === 'wall';
      const gapCrash = race.crashKind === 'gap';
      const area=constructionReview?null:campaignArea(currentLevel),next=constructionReview?null:nextCampaignIndex();
      const complete=finished&&!campaignPractice&&area&&campaignProgress.areaComplete(area.id);
      const allComplete=finished&&!campaignPractice&&CAMPAIGN_LEVELS.every(level=>campaignProgress.completed.has(level.id));
      $('result').dataset.outcome=finished?'complete':'crashed';
      $('result-kicker').textContent=finished?isBest?'NEW PERSONAL BEST':'FINISH LINE':'RUN ENDED';
      $('result-emblem').textContent=finished?'✓':'!';
      $('result-label').textContent=area?`${area.number} / ${area.name}`:'TRACK LIBRARY';
      $('result-mode').textContent=constructionReview?'REVIEW':campaignPractice?'PRACTICE':'CAMPAIGN';
      $('result-level').textContent=levelInfo(currentLevel).name;
      $('result-title').textContent = finished ? allComplete?'CAMPAIGN CLEAR':complete?'AREA CLEAR':campaignPractice?'RUN COMPLETE':'LEVEL CLEAR' : gapCrash ? 'MISSED LANDING' : wallCrash ? 'WALL IMPACT' : 'OUT OF PHASE';
      const gate = GATES.find(g => Math.abs(g.s - race.s) < 0.1);
      const hitObstacle=OBSTACLES.find(o=>race.s>=o.s-4&&race.s<=o.s+o.depth+4);
      $('result-copy').textContent = finished ? next!==null?`NEXT / ${campaignArea(next).name} · ${levelInfo(next).name}`:
        allComplete?`All ${CAMPAIGN_LEVELS.length} levels cleared. Replay your favorites and improve your times.`:campaignPractice?'Practice run complete. Return to the area selector to choose another course.':currentLevel===CAMPAIGN_LEVELS.length-1?'Clear the remaining levels in Nexus to complete the campaign.':'Clear the remaining levels in this area to unlock the next.' :
        gapCrash ? 'JUMP NEAR THE EDGE. FOLLOW THE TAKEOFF CUE.' :
        wallCrash ? hitObstacle?.kind==='jump'?'JUMP OVER THE LOW BARRIER.':hitObstacle?.kind==='hole'?'LINE UP WITH THE WHITE OPENING. STAY LOW.':'STEER CLEAR OF SOLID WALLS.' :
        gate ? `${PHASES[gate.phase].name} REQUIRED / ${PHASES[race.phase].name} ACTIVE` : 'MATCH THE GATE’S PHASE.';
      $('result-distance').textContent=`${(race.s/1000).toFixed(2)} KM`;
      $('result-time').textContent=format(race.time);
      $('retry-label').textContent=finished?next===null?'CHOOSE LEVEL':'CONTINUE':'RETRY LEVEL';
      $('retry-hint').textContent=touchLayout.matches||finished?'':'SPACE / R';
      $('retry').setAttribute('aria-label',finished?next===null?'Choose a level':'Continue to next level':'Retry level');
    }
    shown = race.state;
  }
}
$('start').addEventListener('click', () => start(Number($('level').value)));
$('retry').addEventListener('click', () => {
  if(race.state!=='checkpoint'){start();return;}
  const next=nextCampaignIndex();if(next===null)returnToMenu();else start(next);
});
$('restart').addEventListener('click', () => start());
$('level').addEventListener('change', () => constructionReview?updateLesson(Number($('level').value)):selectFromMenu(Number($('level').value)));
$('pause').addEventListener('click', pause); $('resume').addEventListener('click', pause);
$('return-menu').addEventListener('click',returnToMenu);
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
$('back').addEventListener('click',returnToMenu);
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
  actionPad.pointer = null; actionPad.zone = null; actionPad.boost = false;
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
    actionPad.zone = null; actionPad.boost = false;
    $('action-pad').removeAttribute('data-zone'); return;
  }
  if (distance < 0.48) return;
  const horizontal = Math.abs(x) > Math.abs(y);
  const zone = horizontal ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
  // Keep the current sector near diagonal boundaries to avoid accidental toggles.
  if (actionPad.zone && zone !== actionPad.zone && Math.abs(Math.abs(x) - Math.abs(y)) < 0.16) return;
  actionPad.zone = zone; $('action-pad').dataset.zone = zone;
  if (zone === 'up' && !actionPad.boost) boostQueued = true;
  actionPad.boost = zone === 'up';
  if (zone !== 'up') phase(zone === 'left' ? 0 : zone === 'down' ? 1 : 2);
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
  if (y < -0.62 && pad.jumpArmed) { jumpQueued = true; pad.jumpArmed = false; }
  if (y > -0.38) pad.jumpArmed = true;
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
  if($('controls-dialog').open)return;
  if(race.state==='ready'&&e.target.closest('button, select, input, a'))return;
  if(race.state==='ready'&&!constructionReview)return;
  if (constructionReview && e.code === 'KeyT' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault(); if (!e.repeat) toggleReviewSpeed(); return;
  }
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
  if (race.state === 'running') {
    if (boostCodes.includes(e.code) && !e.repeat && !keys.has(e.code)) boostQueued = true;
    keys.add(e.code);
  }
});
window.addEventListener('keyup', e => keys.delete(e.code));
function suspend() { clearInput(); if (race.state === 'running') { race.state = 'paused'; accumulator = 0; sync(); } }
window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('resize', () => { clearInput(); view?.resize(); });
$('race-world').addEventListener('webglcontextlost', e => { e.preventDefault(); suspend(); view?.assetStream?.dispose(); $('loading-error').hidden = false; $('loading-error').textContent = 'Graphics interrupted. Reload this page to restart.'; race.state = 'ready'; view = null; buffering = false; assetNotice.hidden = true; $('start').disabled = true; sync(); });

function updateHud() {
  const running = race.state === 'running', touch = touchLayout.matches;
  const info=levelInfo(currentLevel);
  const hint=!constructionReview&&running&&!buffering?info.hints.find(entry=>race.s>=entry.start&&race.s<entry.end):null;
  $('lesson-cue').hidden=!hint;
  if(hint){
    if($('lesson-title').textContent!==hint.title)$('lesson-title').textContent=hint.title;
    const copy=touch?hint.touch:hint.pc;
    if($('lesson-copy').textContent!==copy)$('lesson-copy').textContent=copy;
  }
  $('checkpoint-notice').hidden = !checkpointNotice || race.time-checkpointNoticeAt >= 3 || !running;
  $('checkpoint-notice').textContent = checkpointNotice;
  $('level-notice').hidden = constructionReview || !running || race.time >= 2.5 || Boolean(checkpointNotice);
  $('level-notice').textContent = constructionReview?info.name:`${campaignArea(currentLevel).name} / ${campaignLabel(currentLevel)}`;
  const p = PHASES[race.phase]; document.documentElement.style.setProperty('--phase', p.color);
  $('speed').textContent = Math.round(race.speed * 3.6); $('time').textContent = format(race.time);
  const progress = Math.min(100, Math.max(0, race.s / LENGTH * 100));
  if(race.state==='paused'){
    $('pause-area').textContent=constructionReview?'TRACK LIBRARY':`${campaignArea(currentLevel).name} / ${campaignLabel(currentLevel).split(' / ')[0]}`;
    $('pause-mode').textContent=constructionReview?'REVIEW':campaignPractice?'PRACTICE':'CAMPAIGN';
    $('pause-level').textContent=info.name;
    $('pause-time').textContent=format(race.time);
    $('pause-best-label').textContent=constructionReview||race.mode==='drive'?'MODE':'PERSONAL BEST';
    $('best').textContent=constructionReview?'Asset review':race.mode==='drive'?'Driving only':best?format(best.time):'—';
    $('pause-progress-copy').textContent=`${Math.floor(progress)}%`;
    $('pause-progress').style.setProperty('--pause-progress',`${progress}%`);
    $('pause-progress').setAttribute('aria-valuenow',String(Math.floor(progress)));
  }
  $('course-progress').style.setProperty('--progress', `${progress}%`);
  $('course-progress').setAttribute('aria-valuenow', String(Math.round(progress)));
  $('boost-meter').setAttribute('aria-valuenow', String(Math.floor(race.boost.energy)));
  $('boost-fill').style.width = `${race.boost.energy}%`;
  $('pad-charge').style.strokeDasharray = `${race.boost.energy} 100`;
  for (const id of ['action-pad', 'boost-meter']) {
    $(id).classList.toggle('free', race.stripBoost);
    $(id).classList.toggle('boosting', race.boostActive);
    $(id).classList.toggle('braking', race.brakeTime > 0);
  }
  $('boost-label').textContent = race.stripBoost ? 'FREE TURBO' : race.boost.locked ? touch ? 'CENTER PAD' : 'REPRESS BOOST' : 'TURBO';
  $('jump-icon').textContent = race.state === 'crashed' ? '↻' : '↥';
  $('jump').setAttribute('aria-label', race.state === 'crashed' ? 'Retry checkpoint' : 'Jump');
  $('jump').classList.toggle('active', race.airborne);
  $('action-pad').dataset.phase = String(race.phase);
  $('thumbpad').classList.toggle('airborne', race.airborne);
  $('thumbpad').classList.toggle('braking', race.brakeTime > 0);
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
      touch ? 'CENTER · THEN PUSH UP' : 'REPRESS W / SHIFT' : touch ? 'RIGHT PAD ↑ · TURBO' : 'W · TURBO' :
      cue.ready || race.s > cue.latest ? touch ? 'LEFT PAD ↑ · JUMP' : 'SPACE · JUMP' : 'NEAR THE EDGE';
  }
  for (const b of document.querySelectorAll('[data-phase]')) b.setAttribute('aria-pressed', String(Number(b.dataset.phase) === race.phase));
  $('speed-wash').style.opacity = view?.reduced ? 0 : Math.min(1, race.thrustBlend + (race.stripBoost ? 0.45 : 0));
}

function loop(now) {
  const profiling = profiler.enabled;
  const began = profiling ? performance.now() : 0;
  const startedRunning = race.state === 'running' && !buffering;
  const timing = profiling ? {} : null;
  const dt = Math.min((now - last) / 1000, 0.06) * (constructionReview ? reviewTimeScale : 1); last = now;
  if (view) {
    view.prepareAssets(race.s, timing);
    prepareNextLevel();
    updateAssetReadiness();
    const assetsDone = profiling ? performance.now() : 0;
    accumulator += race.state === 'running' && !buffering ? dt : 0;
    while (accumulator >= 1 / 120) {
      const keyboardSteer = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
      const steer = Math.max(-1, Math.min(1, keyboardSteer + pad.steer));
      race.step(1 / 120, steer, boostCodes.some(code => keys.has(code)) || actionPad.boost, jumpQueued, brakeQueued, boostQueued);
      if(constructionCheckpoints&&!reviewCheckpointPassed&&race.s>=CHECKPOINT_REVIEW_AT){
        reviewCheckpointPassed=true;race.boost.reset();checkpointNoticeAt=race.time;
        checkpointNotice='CHECKPOINT · BOOST REFILLED';
      }
      jumpQueued = false; brakeQueued = false; boostQueued = false;
      accumulator -= 1 / 120;
      if (race.state === 'checkpoint') { advanceCheckpoint(); break; }
    }
    const simulated = profiling ? performance.now() : 0;
    sync(); updateHud();
    const hudDone = profiling ? performance.now() : 0;
    const preview=race.state==='ready'&&view?.menuDemo&&view.assetsReady(0);
    const renderPose=preview?view.menuDemo.update(document.hidden?0:dt,view):race;
    view?.render(renderPose, buffering ? 0 : dt, timing);
    if (profiling && view) {
      timing.simulationMs = simulated - assetsDone;
      timing.assetPumpMs = assetsDone - began;
      timing.hudMs = hudDone - simulated;
      timing.mainMs = performance.now() - began;
      profiler.record(now, view, { level: currentLevel, state: buffering ? 'buffering' : race.state, startedRunning,
        prefetchBytes:preparedLevel?.stream?.cacheBytes ?? 0, prefetchAssets:preparedLevel?.stream?.generated ?? 0,
        prefetchTotal:preparedLevel?.stream?.total ?? 0, prefetchLimited:preparedLevel?.stream?.prefetchLimited ?? false,
        preloadBytes:view.assetStream?.attachedBytes ?? 0,
        cachedActiveBytes:view.assetStream?.source ? view.assetStream.attachedBytes : 0,
        expandedLevelBytes:view.assetStream?.expandedBytes ?? 0,
        shaderWarmupState:view.shaderWarmup.state,shaderWarmupMs:view.shaderWarmup.durationMs,
        graphics:view.pipeline.quality,bloom:Boolean(view.pipeline.composer),
        distance: race.s, mode: race.mode, phase: race.phase, reviewTimeScale }, timing);
    }
  }
  requestAnimationFrame(loop);
}
try {
  view = createView();
  graphicsSelect.value=view.pipeline.quality;
  graphicsSelect.querySelector('[value="rich"]').disabled=!view.pipeline.hdrSupported;
}
catch (error) { $('start').disabled = true; $('loading-error').hidden = false; $('loading-error').textContent = `Could not initialize the racer: ${error.message}`; }
sync(); updateHud(); requestAnimationFrame(loop);





