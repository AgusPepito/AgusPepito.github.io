import * as THREE from 'three';
import { surfaceMaps } from './recipe-surface-maps.js';
import {installGateShader} from './gate-shader.js';
import {installPhaseField} from '../../public/assets/track/phase-field-r1.js';
import {installObstacleLight} from '../../public/assets/track/obstacle-lights-r1.js';
import {installEdgeField} from '../../public/assets/track/edge-field-r1.js';

// These packets exist only in memory after runtime procedural generation.
// Transfer geometry ArrayBuffers, not JSON vertex lists or copies of large arrays.
export function packAsset(root) {
  const transfer = new Set(), geometries = [], materials = [], meshes = [];
  const geometryIds = new Map(), materialIds = new Map(), energyMeshes = new Set();
  root.userData.energyGroup?.traverse(m => { if (m.isMesh) energyMeshes.add(m); });
  function attribute(a) {
    if (a.isInterleavedBufferAttribute) throw new Error('Interleaved campaign attributes need an explicit transfer layout');
    transfer.add(a.array.buffer);
    return { array: a.array, itemSize: a.itemSize, normalized: a.normalized, usage: a.usage };
  }
  function geometry(g) {
    if (geometryIds.has(g)) return geometryIds.get(g);
    const id = geometries.length; geometryIds.set(g, id);
    // Three otherwise scans every position on the main thread on first render.
    g.computeBoundingSphere();
    geometries.push({ attributes: Object.fromEntries(Object.entries(g.attributes).map(([name, a]) => [name, attribute(a)])),
      index: g.index ? attribute(g.index) : null, groups: g.groups, drawRange: g.drawRange,
      sphere: { center: g.boundingSphere.center.toArray(), radius: g.boundingSphere.radius } });
    return id;
  }
  function material(m) {
    if (materialIds.has(m)) return materialIds.get(m);
    const id = materials.length; materialIds.set(m, id);
    const copy = m.clone(), maps = [];
    // The only campaign texture maps are the shared, procedurally generated
    // slab grain maps. Reuse those on the receiving thread instead of copying them.
    for (const key of Object.keys(copy)) if (copy[key]?.isTexture) {
      if (!['normalMap', 'roughnessMap'].includes(key)) throw new Error(`Unsupported campaign texture slot: ${key}`);
      maps.push(key); copy[key] = null;
    }
    const json = copy.toJSON();
    // Three omits these when normalMap is absent from the serialized material.
    if (maps.includes('normalMap')) { json.normalScale = m.normalScale.toArray(); json.normalMapType = m.normalMapType; }
    materials.push({ json, maps }); copy.dispose();
    return id;
  }
  root.updateMatrixWorld(true);
  root.traverse(m => {
    if (!m.isMesh) return;
    let instances=null;
    if(m.isInstancedMesh){
      if(!m.boundingSphere)m.computeBoundingSphere();
      instances={count:m.count,matrix:attribute(m.instanceMatrix),box:m.boundingBox?{min:m.boundingBox.min.toArray(),max:m.boundingBox.max.toArray()}:null,
        sphere:{center:m.boundingSphere.center.toArray(),radius:m.boundingSphere.radius}};
    }
    meshes.push({ name: m.name, geometry: geometry(m.geometry),
      instances,
      material: Array.isArray(m.material) ? m.material.map(material) : material(m.material),
      matrix: m.matrixWorld.toArray(), renderOrder: m.renderOrder, visible: m.visible,
      castShadow: m.castShadow, receiveShadow: m.receiveShadow, frustumCulled: m.frustumCulled, energy: energyMeshes.has(m) });
  });
  const expandedBytes = meshes.reduce((sum,mesh) => {
    const g=geometries[mesh.geometry];
    const vertices = g.index ? g.index.array.length : g.attributes.position.array.length / g.attributes.position.itemSize;
    const stride = Object.values(g.attributes).reduce((bytes,a)=>bytes+a.itemSize*a.array.BYTES_PER_ELEMENT,0);
    return sum + vertices * stride * (mesh.instances?.count??1);
  },0);
  return { packet: { geometries, materials, meshes, hasEnergy: Boolean(root.userData.energyGroup),gateModules:root.userData.gateModules,optimization:root.userData.optimization }, transfer: [...transfer], expandedBytes };
}

export function unpackAsset(packet) {
  const loader = new THREE.MaterialLoader();
  const materials = packet.materials.map(({ json, maps }) => {
    const material = loader.parse(json);
    if (maps.length) for (const key of maps) material[key] = surfaceMaps(THREE)[key];
    installGateShader(THREE,material);
    installPhaseField(THREE,material);
    installObstacleLight(THREE,material);
    installEdgeField(THREE,material);
    return material;
  });
  const attribute = a => new THREE.BufferAttribute(a.array, a.itemSize, a.normalized).setUsage(a.usage);
  const geometries = packet.geometries.map(data => {
    const g = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(data.attributes)) g.setAttribute(name, attribute(a));
    if (data.index) g.setIndex(attribute(data.index));
    g.groups = data.groups; g.setDrawRange(data.drawRange.start, data.drawRange.count);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3().fromArray(data.sphere.center), data.sphere.radius);
    return g;
  });
  const root = new THREE.Group(), energy = new THREE.Group();
  if(packet.gateModules)root.userData.gateModules=packet.gateModules;
  if(packet.optimization)root.userData.optimization=packet.optimization;
  if (packet.hasEnergy) { root.add(energy); root.userData.energyGroup = energy; }
  for (const data of packet.meshes) {
    const geometry=geometries[data.geometry],material=Array.isArray(data.material)?data.material.map(id=>materials[id]):materials[data.material];
    // Start at zero to avoid allocating/filling a second matrix array. The
    // transferred instance buffer and worker-computed bounds are ready to use.
    const mesh = data.instances?new THREE.InstancedMesh(geometry,material,0):new THREE.Mesh(geometry,material);
    if(data.instances){
      const a=data.instances.matrix;
      mesh.instanceMatrix=new THREE.InstancedBufferAttribute(a.array,a.itemSize,a.normalized).setUsage(a.usage);
      mesh.count=data.instances.count;
      mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3().fromArray(data.instances.sphere.center),data.instances.sphere.radius);
      if(data.instances.box)mesh.boundingBox=new THREE.Box3(new THREE.Vector3().fromArray(data.instances.box.min),new THREE.Vector3().fromArray(data.instances.box.max));
    }
    mesh.name = data.name; mesh.matrix.fromArray(data.matrix); mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.renderOrder = data.renderOrder; mesh.visible = data.visible;
    mesh.castShadow = data.castShadow; mesh.receiveShadow = data.receiveShadow; mesh.frustumCulled = data.frustumCulled;
    (data.energy ? energy : root).add(mesh);
  }
  return root;
}
