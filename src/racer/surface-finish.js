// Main-thread shading only: no geometry, UV or worker-packet changes. The hook
// composes with the existing instanced gate deformation shader.
export function finishMaterial(material) {
  if (!material.isMeshStandardMaterial || material.userData.orbitalFinish) return;
  material.userData.orbitalFinish = true;
  const name = material.name.toLowerCase();
  const emission = material.emissive?.getHex() !== 0;
  const paint = /ivory|pale|paint|orange|accent|r3-armor/.test(name);
  const recess = /dark|shadow|joint|rubber|recess/.test(name);
  const alloy = /steel|alloy|brass|copper|fastener|trim/.test(name);
  const rock = /asteroid|rock/.test(name);
  if (paint) { material.metalness = .06; material.roughness = .46; }
  else if (recess) { material.metalness = .12; material.roughness = .82; }
  else if (alloy) { material.metalness = .88; material.roughness = .3; }
  if (/ship-canopy/.test(name)) { material.metalness = .12; material.roughness = .14; }
  // The grain map multiplies this value; keep the resulting road finish broad
  // and subdued at the chase camera's grazing angle.
  if (/slab-r1-(graphite|worn|replacement|edge)/.test(name)) material.roughness = Math.min(.78, Math.max(.62, material.roughness + .16));
  if (/lane-r1-light/.test(name)) material.emissiveIntensity = 2.1;
  if (/station-light/.test(name)) material.emissiveIntensity = 1.8;
  material.toneMapped = true;
  if (emission || rock || /canopy/.test(name)) return;

  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.onBeforeCompile = function(shader, renderer) {
    previousCompile.call(this, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFinishPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFinishPosition = position;');
    // Gate deformation replaces begin_vertex; assign independently at main entry.
    if (!shader.vertexShader.includes('vFinishPosition = position;')) {
      shader.vertexShader = shader.vertexShader.replace('void main() {', 'void main() {\nvFinishPosition = position;');
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vFinishPosition;
      float finishNoise(vec3 p) {
        vec3 cell=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        vec3 k=vec3(17.13,59.71,113.53); float n=dot(cell,k);
        return mix(mix(mix(fract(sin(n)*43758.5),fract(sin(n+k.x)*43758.5),f.x),
                       mix(fract(sin(n+k.y)*43758.5),fract(sin(n+k.x+k.y)*43758.5),f.x),f.y),
                   mix(mix(fract(sin(n+k.z)*43758.5),fract(sin(n+k.x+k.z)*43758.5),f.x),
                       mix(fract(sin(n+k.y+k.z)*43758.5),fract(sin(n+k.x+k.y+k.z)*43758.5),f.x),f.y),f.z);
      }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float wear=finishNoise(vFinishPosition*1.8);
        roughnessFactor=clamp(roughnessFactor+(wear-.5)*.12,.12,1.0);
        diffuseColor.rgb*=.96+.04*wear;`);
  };
  material.customProgramCacheKey = () => `${previousKey}|orbital-finish-v1`;
  material.needsUpdate = true;
}
