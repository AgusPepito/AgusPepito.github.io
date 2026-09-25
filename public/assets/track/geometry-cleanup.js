// Authoring-time cleanup for single-material static meshes. Call before bending
// or rotating the geometry; directions refer to its original local coordinates.
// Remove only explicitly identified buried planar faces, not camera backfaces.
export function omitFaces(THREE, geometry, axis, sign) {
  const normal = geometry.attributes.normal;
  if (!normal) return geometry;
  const index = geometry.index, count = index?.count ?? normal.count;
  const ids = [], remap = new Int32Array(normal.count).fill(-1), vertices = [];
  for (let i = 0; i < count; i += 3) {
    const a = index ? index.array[i] : i;
    const b = index ? index.array[i + 1] : i + 1;
    const c = index ? index.array[i + 2] : i + 2;
    if ([a, b, c].every(v => normal.array[v * 3 + axis] * sign > .9999)) continue;
    for (const v of [a, b, c]) {
      if (remap[v] < 0) { remap[v] = vertices.length; vertices.push(v); }
      ids.push(remap[v]);
    }
  }
  if (ids.length === count) return geometry;
  // Compact attributes too: deleting just indices would retain the memory and
  // leave unused vertices for the later surface deformation to process.
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const values = new attr.array.constructor(vertices.length * attr.itemSize);
    vertices.forEach((v, i) => {
      for (let c = 0; c < attr.itemSize; c++) values[i * attr.itemSize + c] = attr.array[v * attr.itemSize + c];
    });
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attr.itemSize, attr.normalized));
  }
  // Keep nonindexed input nonindexed so the final exact-weld pass can still
  // share its vertices. An identity index here would bypass that compaction.
  geometry.setIndex(index ? ids : null);
  geometry.clearGroups();
  geometry.boundingBox = geometry.boundingSphere = null;
  return geometry;
}

// Keep the authored shading/UV seams; no position-only vertex welding.
export const openBottomBox = (THREE, w, h, d, ws = 1, hs = 1, ds = 1) =>
  omitFaces(THREE, new THREE.BoxGeometry(w, h, d, ws, hs, ds), 1, -1);

export const topCylinder = (THREE, radius, height, sides) =>
  omitFaces(THREE, new THREE.CylinderGeometry(radius, radius, height, sides), 1, -1);

// Surface-mounted details shared by the raised R3 bay variants. Structural
// supports, open grille bars and exposed end cheeks deliberately retain backs.
export const raisedPanelBacks = new Set([
  'support-inset-channel', 'support-bolt-seat', 'support-service-mark',
  'sloped-ceramic-panel', 'panel-captive-fastener', 'panel-lower-service-slot',
  'hatch-inset-door', 'hatch-handle-pocket', 'hatch-recess-handle', 'hatch-hinge',
  'hatch-lock', 'vent-inset-well', 'vent-frame-fastener', 'lower-recess-pocket',
  'lower-service-tab', 'interface-locking-tab',
]);

// Subtract panel footprints from a backing rectangle. A sweep creates only the
// exposed strips, instead of tessellating an entire second road below the road.
export function exposedBacking(width, length, covers, emit) {
  const left = -width / 2, right = width / 2, near = -length / 2, far = length / 2;
  const cuts = [...new Set([near, far, ...covers.flatMap(r => [Math.max(near, r[2]), Math.min(far, r[3])])])].sort((a,b) => a-b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], middle = (a + b) / 2;
    if (b <= a) continue;
    const occupied = covers.filter(r => r[2] < middle && r[3] > middle).sort((a,b) => a[0]-b[0]);
    let x = left;
    for (const r of occupied) {
      const end = Math.min(right, r[0]);
      if (end > x) emit((x+end)/2, middle, end-x, b-a);
      x = Math.max(x, Math.min(right, r[1]));
    }
    if (x < right) emit((x+right)/2, middle, right-x, b-a);
  }
}
