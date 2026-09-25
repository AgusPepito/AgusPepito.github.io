import { GATES, STRIPS, setTrackProfile } from './track.js';
import { OBSTACLES } from './obstacles.js';
import { GAPS } from './jumps.js';
import { PHASE_CHAINS } from './sequences.js';
import { PHASE_REVIEW_STRIPS } from './lane-kit.js';
import { tubeReviewStrips } from './tube-kit.js';
import { slabReviewStrips } from './slab-kit.js';
import {TRANSITION_COURSES} from './transition-profile.js';
import {transitionStrips} from './transition-kit.js';
import {GAP_REVIEW_LENGTH,gapReviewGaps} from './gap-kit.js';
import {WALL_REVIEW_LENGTH,wallReviewObstacles} from './wall-kit.js';
import {passageReviewObstacles} from './passage-kit.js';
import {EMITTER_REVIEW_LENGTH,emitterReviewGates} from './phase-emitter-kit.js';
import {OBSTACLE_REVIEW_LENGTH,obstacleReviewSequence} from './obstacle-kit.js';
import {CHECKPOINT_REVIEW_LENGTH} from './checkpoint-kit.js';

const reviewParams = new URLSearchParams(globalThis.location?.search || '');
export const constructionCategory = reviewParams.get('review');
export const constructionRevision = ['05','06','07','08','09','10','11','12','13'].includes(constructionCategory) ? 'R1' : {r2:'R2',r3:'R3'}[reviewParams.get('revision')] || 'R1';
export const constructionReview = ['01', '02', '03', '04', '05', '06', '07', '08','09','10','11','12','13'].includes(constructionCategory);
export const constructionGap = constructionCategory==='11';
export const constructionWalls = constructionCategory==='12';
export const constructionPassages = constructionWalls&&reviewParams.get('element')==='passages';
export const constructionEmitters = constructionWalls&&reviewParams.get('element')==='gates';
export const constructionObstacles = constructionWalls&&reviewParams.get('element')==='obstacles';
export const constructionCheckpoints = constructionCategory==='13';
export const constructionSurfaceCycle = constructionEmitters||constructionObstacles||constructionCheckpoints;
export let constructionWallShape = ['outside','inside'].includes(reviewParams.get('shape'))?reviewParams.get('shape'):'flat';
const emitterShapes=['flat','outside','inside'];
const emitterStartShape=emitterShapes.indexOf(constructionWallShape);
export const emitterShapeFor=index=>emitterShapes[(emitterStartShape+index)%emitterShapes.length];
export const constructionGapShape = ['outside','inside'].includes(reviewParams.get('shape'))?reviewParams.get('shape'):'flat';
export const constructionTransition = ['09','10'].includes(constructionCategory);
export const constructionTubeVariations = ['07','08'].includes(constructionCategory) && reviewParams.get('detail') === 'variations';
export const constructionTubeDetail = ['07','08'].includes(constructionCategory) && ['service','variations'].includes(reviewParams.get('detail'));
export const constructionSlabDetail = ['01','07','08'].includes(constructionCategory) && reviewParams.get('detail') === 'slabs';
export const constructionBaseline = constructionReview && reviewParams.get('surface') === 'original';

// Keep the developed course as the combinations level, then vary it for later rounds.
const original = structuredClone({ gates: GATES, strips: STRIPS, obstacles: OBSTACLES, gaps: GAPS, chains: PHASE_CHAINS });
const gate = (s, phase) => ({ s, phase, center: 0, width: 1, full: true });
const strip = (start, end, phase, u = 0) => ({ start, end, phase, from: u, to: u, width: 0.26 });
const wall = (s, center, width) => ({ s, kind: 'wall', center, width, depth: 5 });
const hole = (s, center, width, height = 9) => ({ s, kind: 'hole', center, width, depth: 5, height });
const jump = s => ({ s, kind: 'jump', center: 0, width: 1, depth: 5, height: 2.4 });
const gap = (start, end) => ({ start, end, center: 0, width: 1, full: true });
export function levelInfo(index) {
  if(constructionCheckpoints){
    const shape=emitterShapeFor(index);
    return {name:`CONSTRUCTION 13 · ${shape.toUpperCase()} CHECKPOINT`,length:CHECKPOINT_REVIEW_LENGTH,profile:shape==='flat'?'gap-flat':shape,lesson:'Thirty-metre checkered checkpoint at 350 m. Cross the white curtain in any phase; boost refills and the road continues. T slows; R retries; Next surface switches flat / outside / inside.'};
  }
  if(constructionObstacles){
    const shape=emitterShapeFor(index);
    return {name:`CONSTRUCTION 12 · ${shape.toUpperCase()} OBSTACLES`,length:OBSTACLE_REVIEW_LENGTH,profile:shape==='flat'?'gap-flat':shape,lesson:'350 m: opening only. 850 m: jump or opening. 1350 m: jump only. 1800 m: offset jump-or-opening. Space jumps. T slows; R retries; Next surface switches flat / outside / inside.'};
  }
  if(constructionEmitters){
    const shape=emitterShapeFor(index);
    return {name:`CONSTRUCTION 12 · ${shape.toUpperCase()} PHASE GATES`,length:EMITTER_REVIEW_LENGTH,profile:shape==='flat'?'gap-flat':shape,lesson:`${shape.toUpperCase()} sample. Match cyan, amber and violet at 350, 850 and 1350 m with 1, 2 and 3. The next sample shows ${emitterShapeFor(index+1)} gates. T slows; R retries; Next surface skips ahead.`};
  }
  if(constructionPassages)return {name:`CONSTRUCTION 12 · ${constructionWallShape.toUpperCase()} PASSAGES`,length:1900,profile:constructionWallShape==='flat'?'gap-flat':constructionWallShape,lesson:'P3 passages at 350, 850 and 1350 m. Steer through the lit opening; W4 walls block the remaining road. T toggles quarter speed; R retries.'};
  if(constructionWalls)return {name:`CONSTRUCTION 12 · ${constructionWallShape.toUpperCase()} WALLS`,length:WALL_REVIEW_LENGTH,profile:constructionWallShape==='flat'?'gap-flat':constructionWallShape,lesson:'Three W4 solid walls at 350, 800 and 1250 m. Steer around them. T toggles quarter speed; R retries.'};
  if(constructionGap)return {name:`CONSTRUCTION 11 · ${constructionGapShape.toUpperCase()} GAPS`,length:GAP_REVIEW_LENGTH,profile:constructionGapShape==='flat'?'gap-flat':constructionGapShape,lesson:'Full gap at 450 m; partial gap at 1050 m. Space jumps; steer around the partial opening. T slows review to quarter speed. R retries.'};
  if(constructionTransition)return {name:`CONSTRUCTION ${constructionCategory} · TRANSITIONS R1`,length:TRANSITION_COURSES[constructionCategory].length,profile:`transition-${constructionCategory}`,lesson:constructionCategory==='09'?'Flat → outside tube → flat. Cyan lane: press 1 to match. W boosts; R retries.':'Flat → inside tube → flat → outside tube → flat. Violet lane: press 3 to match. W boosts; R retries.'};
  if(constructionSlabDetail)return {name:`CONSTRUCTION ${constructionCategory} · METAL SLAB CANDIDATE`,length:600,profile:constructionCategory==='01'?'flat':constructionCategory==='08'?'inside':'outside',lesson:'Brushed metal slabs with shallow bevels and repair plates. Violet lane from 75 m: press 3 for matching-phase turbo. W boosts; R retries.'};
  if (['07','08'].includes(constructionCategory)) return { name: `CONSTRUCTION ${constructionCategory} · ${constructionTubeVariations?'R2 VARIATIONS':constructionTubeDetail?'R2 SERVICE SECTION':'R1'}`, length:constructionTubeDetail&&!constructionTubeVariations?400:1800, profile:constructionCategory==='08'?'inside':'outside', lesson:constructionTubeVariations?'Eight twelve-metre service sections: pipes, cooling, access and quiet armor. Steer around the tube. W boosts; R retries.':constructionTubeDetail?'One ivory service section at 100 m. Steer around it to inspect the pipe, cooling and access panels. R retries.':'Steer a full circle around the tube. Match lane colors with 1, 2 or 3 for turbo. Space jumps. W boosts. R retries.' };
  if (constructionReview) return { name: `CONSTRUCTION ${constructionCategory} · ${constructionRevision}`, length: 1800, profile: 'flat', lesson: constructionCategory === '06'
    ? 'Match cyan, amber or violet with 1, 2 or 3 for lane turbo. Space jumps. W boosts. R retries the sample.'
    : 'Inspect the side bays at cruise and turbo. The sample repeats; R or Pause → Retry restarts it.' };
  return [
    { name: 'FIRST SHIFT', length: 2400, profile: 'flat', lesson: 'Follow the colored line. Match each gate with 1, 2 or 3.' },
    { name: 'AROUND THE TUBE', length: 6600, profile: 'mixed', lesson: 'Steer around the surface and follow the line through wide openings.' },
    { name: 'TAKE FLIGHT', length: 3400, profile: 'flat', lesson: 'Space jumps. W boosts. Jump late and save turbo for longer gaps.' },
    { name: 'COMBINATIONS', length: 6600, profile: 'mixed', lesson: 'Read the whole sequence: phases, passage, then landing.' },
  ][index] || { name: `OVERLOAD ${index - 3}`, length: 6600, profile: 'mixed', lesson: 'Three-phase chains, tighter openings, and longer gaps. Read ahead.' };
}
export function configureLevel(index) {
  if(constructionSurfaceCycle)constructionWallShape=emitterShapeFor(index);
  const info = levelInfo(index);
  let data = { gates: [], strips: [], obstacles: [], gaps: [], chains: [] };
  if (constructionReview) {
    // Categories 06–08 use real lanes; category 11 exercises real gaps.
    if (constructionCategory === '06') data.strips = PHASE_REVIEW_STRIPS.map(strip => ({...strip}));
    if (['07','08'].includes(constructionCategory) && !constructionTubeDetail) data.strips = tubeReviewStrips(constructionCategory==='08');
    if(constructionSlabDetail)data.strips=slabReviewStrips(constructionCategory!=='01');
    if(constructionTransition)data.strips=transitionStrips(constructionCategory);
    if(constructionGap)data.gaps=gapReviewGaps(constructionGapShape);
    if(constructionEmitters)data.gates=emitterReviewGates();
    else if(constructionObstacles)data.obstacles=obstacleReviewSequence(constructionWallShape);
    else if(constructionWalls)data.obstacles=constructionPassages?passageReviewObstacles(constructionWallShape):wallReviewObstacles(constructionWallShape);
  } else if (index === 0) {
    data.gates = [gate(500, 0), gate(1100, 1), gate(1700, 2)];
    data.strips = [strip(180, 420, 0), strip(780, 1020, 1), strip(1400, 1620, 2)];
    data.obstacles = [wall(2100, 0, 0.3)];
  } else if (index === 1) {
    data.gates = [gate(700, 0), gate(1300, 1), gate(3400, 2), gate(3900, 0), gate(5700, 1)];
    data.strips = [strip(300, 550, 0), strip(1420, 1650, 1), strip(3650, 3820, 0), strip(5250, 5500, 1)];
    data.obstacles = [wall(1770, 0, 0.2), hole(2320, 0.5, 0.27), wall(4400, 0.1, 0.24), hole(5000, -0.45, 0.27)];
  } else if (index === 2) {
    data.gates = [gate(1750, 1)];
    data.strips = [strip(750, 1100, 0), strip(2300, 2550, 1)];
    data.obstacles = [jump(600), hole(2100, 0.3, 0.3, 4.2)];
    data.gaps = [gap(1250, 1350), gap(2750, 2930)];
  } else {
    data = structuredClone(original);
    if (index >= 4) {
      const round = index - 4, intensity = Math.min(round, 5), mirror = round % 2 ? -1 : 1;
      const spacing = 170 - intensity * 6; // Never less than 140 m between phase switches.
      data.chains = data.chains.map((chain, n) => ({ ...chain, id: `${chain.id}-${round}`, name: `OVERLOAD / ${n + 1}`,
        gates: [0, 1, 2].map(i => ({ s: chain.obstacleS - 210 - (2 - i) * spacing, phase: (i + n + round) % 3 })) }));
      data.gates = data.chains.flatMap(chain => chain.gates.map(g => ({ ...gate(g.s, g.phase), chainId: chain.id })));
      data.obstacles = data.obstacles.map(o => ({ ...o, center: o.center * mirror,
        width: o.kind === 'hole' ? Math.max(0.115, o.width - 0.015 - intensity * 0.005) : o.width }));
      data.gaps = data.gaps.map(g => ({ ...g, center: g.center * mirror, end: g.end + (g.full ? 5 + intensity * 3 : 0) }));
      data.strips = data.strips.map(s => ({ ...s, phase: (s.phase + round) % 3, from: s.from * mirror, to: s.to * mirror }));
    }
  }
  setTrackProfile(info.length, info.profile);
  // Preserve array identities for the simulation, renderer and guidance imports.
  GATES.splice(0, GATES.length, ...data.gates.sort((a, b) => a.s - b.s));
  STRIPS.splice(0, STRIPS.length, ...data.strips);
  OBSTACLES.splice(0, OBSTACLES.length, ...data.obstacles.sort((a, b) => a.s - b.s));
  GAPS.splice(0, GAPS.length, ...data.gaps.sort((a, b) => a.start - b.start));
  PHASE_CHAINS.splice(0, PHASE_CHAINS.length, ...data.chains);
  return info;
}


