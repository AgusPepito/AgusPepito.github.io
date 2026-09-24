import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import generate from '../../public/assets/track/flat-foundation-r1.js';
import { point, STRIPS } from './track.js';
import { addPipeBays } from './pipe-kit.js';
import { addSurfaceBays } from './surface-kits.js';
import { constructionCategory, constructionRevision } from './levels.js';
import { addRaisedBays } from './raised-kit.js';
import { addDetailedBays } from './detailed-kit.js';
import { addMixedBays } from './mixed-kit.js';
import { addPhaseLanes } from './lane-kit.js';

// Adapt the standalone recipe asset to the actual collision surface, then batch by material.
export function foundationChunk(start) {
  const asset = generate(THREE), grouped = new Map();
  const mixed = ['05','06'].includes(constructionCategory);
  // Deliberate service-bay termination, quiet stretch and restart on both sides.
  if (mixed || (start >= 550 && start < 750) || ['R2', 'R3'].includes(constructionRevision)) {
    for (const child of [...asset.children]) if (child.name === 'service-bays') {
      child.traverse(node => node.geometry?.dispose()); asset.remove(child);
    }
  }
  if (mixed) {
    addMixedBays(THREE, asset, Math.round((start + 50) / 100));
    if (constructionCategory === '06') addPhaseLanes(THREE, asset, start, STRIPS);
  } else if (!(start >= 550 && start < 750)) {
    const index = Math.round((start + 50) / 100);
    if (constructionRevision === 'R3') addDetailedBays(THREE, asset, constructionCategory, index);
    else if (constructionRevision === 'R2') addRaisedBays(THREE, asset, constructionCategory, index);
    else if (constructionCategory === '02') addPipeBays(THREE, asset, index);
    else if (['03', '04'].includes(constructionCategory)) addSurfaceBays(THREE, asset, constructionCategory, index, true);
  }
  const sharedMaterials = new Map();
  asset.traverse(node => {
    if (!node.isMesh) return;
    const key = node.material.name;
    if (!sharedMaterials.has(key)) sharedMaterials.set(key, node.material);
    else if (node.material !== sharedMaterials.get(key)) { node.material.dispose(); node.material = sharedMaterials.get(key); }
  });
  asset.updateMatrixWorld(true);
  asset.traverse(node => {
    if (!node.isMesh) return;
    // Extruded end cheeks are non-indexed; normalize all parts before material batching.
    const geometry = (node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()).applyMatrix4(node.matrixWorld);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const p = point(start + 50 - positions.getZ(i), positions.getX(i) / 18);
      positions.setXYZ(i, p.x, p.y + positions.getY(i) - asset.userData.driveHeight, p.z);
    }
    geometry.computeVertexNormals();
    if (!grouped.has(node.material)) grouped.set(node.material, []);
    grouped.get(node.material).push(geometry);
    node.geometry.dispose();
  });
  const result = new THREE.Group();
  for (const [material, pieces] of grouped) {
    const mesh = new THREE.Mesh(mergeGeometries(pieces), material);
    // Draw the biased inset surfaces after the opaque road, retaining normal
    // depth occlusion by the ship and housings.
    if (material.name.startsWith('lane-r1-') || material.name.startsWith('neutral-marker-')) mesh.renderOrder = 1;
    result.add(mesh);
    pieces.forEach(g => g.dispose());
  }
  return result;
}
