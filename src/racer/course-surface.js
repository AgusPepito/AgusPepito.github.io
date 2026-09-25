import { frame, section } from './track.js';

// Split broad source faces before deformation, retaining curtain vertex colors
// as well as UVs. This also handles the longitudinal bends in campaign courses.
function subdivide(THREE, geometry, axis, step) {
  const p = geometry.attributes.position, index = geometry.index;
  const coord = i => p.array[i * 3 + axis];
  let needed = false;
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const v = [0, 1, 2].map(j => coord(index ? index.getX(i + j) : i + j));
    if (Math.max(...v) - Math.min(...v) > step) { needed = true; break; }
  }
  if (!needed) return geometry;
  const input = index ? geometry.toNonIndexed() : geometry;
  const entries = Object.entries(input.attributes).filter(([name]) => name !== 'normal');
  let stride = 0;
  const attributes = entries.map(([name, attr]) => {
    const entry = { name, attr, offset: stride, values: [] }; stride += attr.itemSize; return entry;
  });
  const position = attributes.find(a => a.name === 'position').offset + axis;
  const read = i => attributes.flatMap(({attr}) => Array.from({length: attr.itemSize}, (_, j) => attr.array[i * attr.itemSize + j]));
  function clip(poly, bound, sign) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = (a[position] - bound) * sign, db = (b[position] - bound) * sign;
      if (da >= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db); out.push(a.map((v, j) => v + (b[j] - v) * t));
      }
    }
    return out;
  }
  function emit(poly) {
    for (let j = 1; j < poly.length - 1; j++) for (const v of [poly[0], poly[j], poly[j + 1]]) {
      for (const a of attributes) a.values.push(...v.slice(a.offset, a.offset + a.attr.itemSize));
    }
  }
  for (let i = 0; i < input.attributes.position.count; i += 3) {
    const tri = [read(i), read(i + 1), read(i + 2)];
    const low = Math.min(...tri.map(v => v[position])), high = Math.max(...tri.map(v => v[position]));
    if (high - low <= step) emit(tri);
    else for (let n = Math.floor(low / step); n < Math.ceil(high / step); n++) emit(clip(clip(tri, n * step, 1), (n + 1) * step, -1));
  }
  const result = new THREE.BufferGeometry();
  for (const a of attributes) result.setAttribute(a.name, new THREE.Float32BufferAttribute(a.values, a.attr.itemSize));
  if (input !== geometry) input.dispose(); geometry.dispose();
  return result;
}

// All inputs are unwrapped source metres: +Y is height, -Z is travel.
// Physics, camera and these meshes share the exact same point/frame sampler.
export function mountCourseSurface(THREE, root, station, half, { center = () => 0, physicalWidth = false, prepare } = {}) {
  root.updateMatrixWorld(true);
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    if (prepare) prepare(mesh.geometry);
    const rigid = mesh.userData.wallRigid || /fastener|captive-hex|door-lock|door-handle/.test(mesh.name);
    let anchor, pose;
    if (rigid) {
      mesh.geometry.computeBoundingBox(); anchor = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
      const s = station - anchor.z;
      pose = frame(s, anchor.x / (physicalWidth ? section(s).halfWidth : half) + center(s));
    } else {
      const curved = [station - 15, station, station + 15].some(s => Math.abs(section(s).curl) > 0);
      mesh.geometry = subdivide(THREE, mesh.geometry, 0, curved ? .4 : 3);
      mesh.geometry = subdivide(THREE, mesh.geometry, 2, 2);
    }
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = station - z;
      const f = pose || frame(s, x / (physicalWidth ? section(s).halfWidth : half) + center(s));
      const v = f.p.clone().addScaledVector(f.normal, y);
      if (pose) v.addScaledVector(f.right, x - anchor.x).addScaledVector(f.forward, anchor.z - z);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    mesh.geometry.computeVertexNormals();
  });
  root.traverse(n => { n.position.set(0, 0, 0); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1); });
  return root;
}
