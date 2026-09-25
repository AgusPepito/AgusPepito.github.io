// Exact vertex sharing: compare every Float32 attribute bit, including normals,
// UVs and colors. No position quantization, smoothing or triangle removal.
export function indexGeometry(THREE, geometry) {
  if (geometry.index) return geometry;
  const entries = Object.entries(geometry.attributes), count = geometry.attributes.position?.count ?? 0;
  if (!count || entries.some(([, a]) => a.isInterleavedBufferAttribute || !(a.array instanceof Float32Array))) {
    geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from({ length: count }, (_, i) => i), 1));
    return geometry;
  }
  let capacity = 1;
  while (capacity < count * 2) capacity *= 2;
  const slots = new Uint32Array(capacity), sourceIds = new Uint32Array(count), indices = new Uint32Array(count);
  const words = entries.map(([, a]) => ({ size: a.itemSize, data: new Uint32Array(a.array.buffer, a.array.byteOffset, a.array.length) }));
  let unique = 0;
  for (let i = 0; i < count; i++) {
    let hash = 2166136261;
    for (const a of words) for (let c = 0; c < a.size; c++) {
      const word = a.data[i * a.size + c];
      hash = Math.imul(hash ^ word ^ (word >>> 16), 16777619);
      hash ^= hash >>> 13;
    }
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash ^= hash >>> 16;
    let slot = hash & (capacity - 1);
    while (slots[slot]) {
      const candidate = sourceIds[slots[slot] - 1];
      let equal = true;
      for (const a of words) {
        for (let c = 0; c < a.size; c++) if (a.data[i * a.size + c] !== a.data[candidate * a.size + c]) { equal = false; break; }
        if (!equal) break;
      }
      if (equal) break;
      slot = (slot + 1) & (capacity - 1);
    }
    if (!slots[slot]) { sourceIds[unique] = i; slots[slot] = ++unique; }
    indices[i] = slots[slot] - 1;
  }
  for (const [name, attribute] of entries) {
    const array = new Float32Array(unique * attribute.itemSize);
    for (let i = 0; i < unique; i++) for (let c = 0; c < attribute.itemSize; c++) {
      array[i * attribute.itemSize + c] = attribute.array[sourceIds[i] * attribute.itemSize + c];
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized).setUsage(attribute.usage));
  }
  geometry.setIndex(new THREE.BufferAttribute(unique <= 65535 ? new Uint16Array(indices) : indices, 1));
  return geometry;
}

// Campaign batches already have one material each and ordinary attributes.
// Write final indices directly to a typed array; Three's general merge helper
// first builds a large JavaScript number array and then copies it again.
export function mergeIndexedGeometries(THREE, pieces) {
  const first = pieces[0], names = Object.keys(first.attributes);
  let vertices = 0, indexCount = 0;
  for (const piece of pieces) { vertices += piece.attributes.position.count; indexCount += piece.index.count; }
  const merged = new THREE.BufferGeometry();
  for (const name of names) {
    const source = first.attributes[name];
    const values = new source.array.constructor(vertices * source.itemSize);
    let offset = 0;
    for (const piece of pieces) {
      const attr = piece.attributes[name];
      if (!attr || attr.itemSize !== source.itemSize || attr.normalized !== source.normalized || attr.array.constructor !== source.array.constructor) {
        throw new Error(`Incompatible campaign attribute: ${name}`);
      }
      values.set(attr.array,offset); offset += attr.array.length;
    }
    merged.setAttribute(name,new THREE.BufferAttribute(values,source.itemSize,source.normalized).setUsage(source.usage));
  }
  const indices = vertices <= 65535 ? new Uint16Array(indexCount) : new Uint32Array(indexCount);
  let at = 0, base = 0;
  for (const piece of pieces) {
    if (Object.keys(piece.attributes).length !== names.length) throw new Error('Incompatible campaign attribute sets');
    for (const index of piece.index.array) indices[at++] = index + base;
    base += piece.attributes.position.count;
  }
  merged.setIndex(new THREE.BufferAttribute(indices,1));
  return merged;
}
