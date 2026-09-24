import { detailedKit } from './detailed-kit.js';

export const BAY_PITCH = 12.5;
// Authored in whole bays, independent of the renderer's 100 m chunks.
// null is exposed road; frame is an empty housing with a continuous roof.
const runs = [
  [['pipe',11],['grille',7],['cover',16],['frame',3],['pipe',12],[null,6],['cover',18],['grille',9],['frame',4],['pipe',13],['cover',21],[null,8],['grille',12],['cover',4]],
  [['cover',17],['pipe',8],['frame',4],['grille',14],[null,5],['pipe',19],['cover',11],['grille',6],['frame',3],['cover',22],[null,7],['pipe',16],['grille',12]],
];
export const expandRuns = entries => entries.flatMap(([family, count]) => Array(count).fill(family));
export const MIXED_LAYOUT = runs.map(expandRuns);
const variants = {
  frame: ['middle'],
  pipe: ['straight','straight','coupling','straight','valve','straight','offset','straight'],
  grille: ['lattice','lattice','louver','louver','reinforced','lattice'],
  cover: ['plain','plain','plain','segmented','plain','hatch','plain','vented'],
};

export function mixedBayAt(layout, index) {
  const family = layout[index];
  if (!family) return null;
  const previous = layout[index - 1], next = layout[index + 1];
  let runStart = index;
  while (runStart > 0 && layout[runStart - 1] === family) runStart--;
  let kind = variants[family][(index - runStart) % variants[family].length];
  if (!previous) kind = 'ramp-start';
  else if (!next) kind = 'ramp-end';
  else if (previous !== family) kind = 'start';
  else if (next !== family) kind = 'end';
  return { family, kind };
}

export function mountDetailedBay(THREE, parent, family, kind, side, z) {
  // Mirroring the mounting direction must also reverse the source cap names.
  const sourceKind = side > 0 ? kind.replace('start','TEMP').replace('end','start').replace('TEMP','end') : kind;
  const module = detailedKit[family][sourceKind](THREE);
  module.scale.x = BAY_PITCH / 12;
  module.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  module.position.set(side * 20, 0.6, z);
  parent.add(module);
  return module;
}

export function addMixedBays(THREE, foundation, chunkIndex = 0, layouts = MIXED_LAYOUT) {
  for (const [sideIndex, side] of [-1, 1].entries()) {
    for (let i = 0; i < 8; i++) {
      const bay = mixedBayAt(layouts[sideIndex], chunkIndex * 8 + i);
      if (bay) mountDetailedBay(THREE, foundation, bay.family, bay.kind, side, 43.75 - i * BAY_PITCH);
    }
  }
}
