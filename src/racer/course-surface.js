import { frame, section, createFrameSampler } from './track.js';
import { collectRigidInstances, isRigidPart } from './rigid-instances.js';

// Split broad source faces before deformation, retaining curtain vertex colors
// as well as UVs. This also handles the longitudinal bends in campaign courses.
export function subdivide(THREE, geometry, axis, step) {
  const p = geometry.attributes.position, index = geometry.index;
  const coord = i => p.array[i * 3 + axis];
  const count = index?.count ?? p.count;
  const vertexId = index ? i => index.array[i] : i => i;
  let needed = false;
  for (let i = 0; i < count; i += 3) {
    const a=coord(vertexId(i)),b=coord(vertexId(i+1)),c=coord(vertexId(i+2));
    if (Math.max(a,b,c) - Math.min(a,b,c) > step) { needed = true; break; }
  }
  if (!needed) return geometry;
  // Read source indices directly. Expanding the complete geometry first makes
  // an unnecessary copy, especially when only a few faces cross a split plane.
  const entries = Object.entries(geometry.attributes).filter(([name]) => name !== 'normal');
  let stride = 0;
  const attributes = entries.map(([name, attr]) => {
    const entry = { name, attr, offset: stride, values: [] }; stride += attr.itemSize; return entry;
  });
  const position = attributes.find(a => a.name === 'position').offset + axis;
  const read = i => {
    const values = new Array(stride);
    for (const a of attributes) for (let c = 0; c < a.attr.itemSize; c++) values[a.offset + c] = a.attr.array[i * a.attr.itemSize + c];
    return values;
  };
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
      for (const a of attributes) for (let c = 0; c < a.attr.itemSize; c++) a.values.push(v[a.offset + c]);
    }
  }
  const copyVertex = id => {
    for (const a of attributes) for (let c=0;c<a.attr.itemSize;c++) a.values.push(a.attr.array[id*a.attr.itemSize+c]);
  };
  for (let i = 0; i < count; i += 3) {
    const a=vertexId(i),b=vertexId(i+1),c=vertexId(i+2);
    const low = Math.min(coord(a),coord(b),coord(c)), high = Math.max(coord(a),coord(b),coord(c));
    if (high - low <= step) { copyVertex(a);copyVertex(b);copyVertex(c); }
    else {
      const tri = [read(a),read(b),read(c)];
      for (let n = Math.floor(low / step); n < Math.ceil(high / step); n++) emit(clip(clip(tri, n * step, 1), (n + 1) * step, -1));
    }
  }
  const result = new THREE.BufferGeometry();
  for (const a of attributes) result.setAttribute(a.name, new THREE.Float32BufferAttribute(a.values, a.attr.itemSize));
  geometry.dispose();
  return result;
}

// All inputs are unwrapped source metres: +Y is height, -Z is travel.
// Physics, camera and these meshes share the exact same point/frame sampler.
export function mountCourseSurface(THREE, root, station, half, { center = () => 0, physicalWidth = false, prepare, timings = null, cacheFrames = false, instanceRigid = false } = {}) {
  const sampleFrame = createFrameSampler(), vertex = new THREE.Vector3();
  const frames = new Map();
  let cachedFrames = 0, frameSamples = 0, frameCacheHits = 0;
  const sampleSurface = (s,u,y,target) => {
    if (!cacheFrames) { const f=sampleFrame(s,u); return target.copy(f.p).addScaledVector(f.normal,y); }
    if (cachedFrames >= 16384) { frames.clear(); cachedFrames=0; }
    let row=frames.get(s);
    if (!row) { row=new Map(); frames.set(s,row); }
    let value=row.get(u);
    if (!value) {
      const f=sampleFrame(s,u);
      value=[f.p.x,f.p.y,f.p.z,f.normal.x,f.normal.y,f.normal.z]; row.set(u,value); cachedFrames++; frameSamples++;
    } else frameCacheHits++;
    return target.set(value[0]+value[3]*y,value[1]+value[4]*y,value[2]+value[5]*y);
  };
  root.updateMatrixWorld(true);
  // Custom geometry preparation can change a part's shape; retain its baked
  // path rather than grouping the original shape under an incompatible matrix.
  const groupBegan=timings?performance.now():0;
  const instances=instanceRigid&&!prepare?collectRigidInstances(THREE,root):null;
  if(timings)timings.rigidGroupingMs=performance.now()-groupBegan;
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const began = timings ? performance.now() : 0;
    const before = mesh.geometry.attributes.position.count;
    if(instances?.has(mesh)){
      const anchor=instances.anchor(mesh),s=station-anchor.z;
      const pose=frame(s,anchor.x/(physicalWidth?section(s).halfWidth:half)+center(s));
      instances.add(mesh,pose,anchor);
      if(timings){
        timings.rigidInstances=(timings.rigidInstances??0)+1;
        timings.rigidPlacementMs=(timings.rigidPlacementMs??0)+performance.now()-began;
      }
      return;
    }
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    if (prepare) prepare(mesh.geometry);
    const rigid = isRigidPart(mesh);
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
    const split = timings ? performance.now() : 0;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = station - z;
      const v = pose ? vertex.copy(pose.p).addScaledVector(pose.normal,y)
        : sampleSurface(s,x/(physicalWidth?section(s).halfWidth:half)+center(s),y,vertex);
      if (pose) v.addScaledVector(pose.right, x - anchor.x).addScaledVector(pose.forward, anchor.z - z);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    const sampled = timings ? performance.now() : 0;
    mesh.geometry.computeVertexNormals();
    if (timings) {
      const finished = performance.now();
      timings.families ??= {};
      const stats = timings.families[mesh.name] ??= {meshes:0,verticesBefore:0,verticesAfter:0,prepareSplitMs:0,sampleMs:0,normalsMs:0};
      stats.meshes++; stats.verticesBefore += before; stats.verticesAfter += p.count;
      stats.prepareSplitMs += split-began; stats.sampleMs += sampled-split; stats.normalsMs += finished-sampled;
    }
  });
  root.traverse(n => { n.position.set(0, 0, 0); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1); });
  const batchBegan=timings?performance.now():0,batches=instances?.finish()??[];
  if(timings){timings.rigidBatches=batches.length;timings.rigidBatchMs=performance.now()-batchBegan;}
  if (timings) Object.assign(timings,{frameSamples,frameCacheHits});
  return root;
}
