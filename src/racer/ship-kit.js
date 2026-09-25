import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import generateShip from '../../public/assets/ships/reference-reconstruction.js';
import {indexGeometry} from './compact-geometry.js';

export function racingShip() {
  const source=generateShip(THREE), model=new THREE.Group(), ship=new THREE.Group();
  const buckets=new Map(), phaseMaterials=new Set();
  source.updateMatrixWorld(true);
  const finishes=new Map([[0xe6e1d2,'ship-ivory'],[0x232832,'ship-graphite'],[0x56616b,'ship-alloy'],
    [0x101b24,'ship-canopy'],[0xf87922,'ship-accent']]);
  // Split multi-material hull faces too; batch all fixed parts into six materials.
  source.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const ranges=materials.length>1?geometry.groups:[{start:0,count:geometry.attributes.position.count,materialIndex:0}];
    for(const range of ranges){
      const material=materials[range.materialIndex], part=new THREE.BufferGeometry();
      if(!material.name)material.name=finishes.get(material.color.getHex())||'ship-hull';
      // This asset uses untextured materials; retain its authored face normals.
      for(const name of ['position','normal']){
        const attribute=geometry.attributes[name];
        part.setAttribute(name,new THREE.BufferAttribute(attribute.array.slice(range.start*attribute.itemSize,(range.start+range.count)*attribute.itemSize),attribute.itemSize));
      }
      if(!buckets.has(material))buckets.set(material,[]);
      buckets.get(material).push(part);
      if(material.name==='phase-energy')phaseMaterials.add(material);
    }
    geometry.dispose();mesh.geometry.dispose();
  });
  for(const [material,parts] of buckets){
    const geometry=indexGeometry(THREE,mergeGeometries(parts));
    parts.forEach(part=>part.dispose());
    model.add(new THREE.Mesh(geometry,material));
  }
  // The authored nose is +Z; the race's moving frame points forward along -Z.
  // Center its 0.95 m height on the existing hover/collision anchor.
  model.rotation.y=Math.PI;model.position.y=-.475;ship.add(model);
  ship.name='reference-reconstruction-racer';
  const exhaustMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{phaseColor:{value:new THREE.Color(0x4de1ff)},clock:{value:0},thrust:{value:0}},
    vertexShader:`varying vec2 vPlumeUv;void main(){vPlumeUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 phaseColor;uniform float clock,thrust;varying vec2 vPlumeUv;
      void main(){
        float tail=clamp(1.0-vPlumeUv.y,0.0,1.0);
        float flow=.9+.1*sin(vPlumeUv.y*38.0-clock*24.0);
        float core=pow(tail,3.0);
        vec3 light=mix(phaseColor*1.8,vec3(2.7,2.9,3.0),core*.65);
        gl_FragColor=vec4(light*(1.0+thrust*.55),pow(tail,.65)*flow*.72);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  exhaustMaterial.color=exhaustMaterial.uniforms.phaseColor.value;
  const exhaustGeometry=new THREE.ConeGeometry(.16,1,8);
  // Unit cone starts at its nozzle and extends backwards; scaling keeps it attached.
  exhaustGeometry.rotateX(Math.PI/2);exhaustGeometry.translate(0,0,.5);
  const exhausts=source.userData.exhausts.map(([x,y,z])=>{
    const exhaust=new THREE.Mesh(exhaustGeometry,exhaustMaterial);
    exhaust.position.set(-x,y-.475,-z);ship.add(exhaust);return exhaust;
  });
  // Small additive halos give the ship a local glow without full-screen blur passes.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'), gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,0.65)');
  gradient.addColorStop(.2,'rgba(255,255,255,0.35)');
  gradient.addColorStop(.55,'rgba(255,255,255,0.10)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const glowTexture=new THREE.CanvasTexture(canvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
  const shipGlowMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0x00cfff,
    transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,toneMapped:false});
  const addGlow=([x,y,z],size,rearOffset=0)=>{
    const glow=new THREE.Sprite(shipGlowMaterial);
    glow.position.set(-x,y-.475,-z+rearOffset);glow.scale.set(size,size,1);ship.add(glow);
  };
  addGlow(source.userData.reactorGlow,1.25);
  source.userData.exhausts.forEach(exit=>addGlow(exit,.9,.06));
  // The studio preview uses much stronger HDR emission; gameplay stays restrained.
  phaseMaterials.forEach(material=>{material.emissiveIntensity=3;});
  return {ship,phaseMaterials:[...phaseMaterials],exhaustMaterial,exhausts,shipGlowMaterial};
}
