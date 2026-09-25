import * as THREE from 'three';
import { PHASES } from './track.js';
import { gapAt } from './jumps.js';
import { GRAPHICS } from './visual-settings.js';
import { JumpVfx } from './jump-vfx.js';

function radialTexture(ring = false) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,ring?'rgba(255,255,255,0)':'rgba(255,255,255,1)');
  gradient.addColorStop(ring ? .7 : .18,ring?'rgba(255,255,255,0)':'rgba(255,255,255,.7)');
  gradient.addColorStop(ring ? .82 : .5,'rgba(255,255,255,.3)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function ribbonTexture(){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=4;
  const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,64,0);
  for(const [at,alpha] of [[0,0],[.2,.08],[.42,.42],[.49,1],[.51,1],[.58,.42],[.8,.08],[1,0]])
    gradient.addColorStop(at,`rgba(255,255,255,${alpha})`);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,4);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export class RaceVfx {
  constructor(scene, ship, exhausts, quality) {
    this.group=new THREE.Group();this.group.name='race-feedback';scene.add(this.group);
    this.ship=ship;this.exhausts=exhausts;this.quality=quality;
    this.last=null;this.phasePulse=0;this.sparkWait=0;
    this.glowTexture=radialTexture();this.ringTexture=radialTexture(true);
    this.jump=new JumpVfx(this.group,ship,this.glowTexture);
    this.trailTexture=ribbonTexture();
    this.spill=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
      map:this.glowTexture,color:0x4de1ff,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));
    this.spill.renderOrder=3;this.group.add(this.spill);
    this.pulses=Array.from({length:6},()=>{
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
        map:this.ringTexture,color:0xffffff,transparent:true,opacity:0,depthWrite:false,
        side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
      mesh.visible=false;mesh.renderOrder=4;this.group.add(mesh);
      return {mesh,age:0,life:0,size:1,billboard:false};
    });
    this.trails=exhausts.map(()=>{
      const count=36,geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*6),colors=new Float32Array(count*6),uvs=[],indices=[];
      for(let i=0;i<count-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      for(let i=0;i<count;i++)uvs.push(0,.5,1,.5);
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));geometry.setIndex(indices);
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
      const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:this.trailTexture,vertexColors:true,transparent:true,
        opacity:.45,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));
      mesh.material.forceSinglePass=true;
      mesh.frustumCulled=false;mesh.visible=false;this.group.add(mesh);
      return {mesh,positions,colors,points:Array.from({length:count},()=>new THREE.Vector3()),times:new Float32Array(count),flight:new Float32Array(count),head:0,used:0};
    });
    const capacity=96,geometry=new THREE.BufferGeometry();
    this.sparkPositions=new Float32Array(capacity*3);this.sparkColors=new Float32Array(capacity*3);
    geometry.setAttribute('position',new THREE.BufferAttribute(this.sparkPositions,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color',new THREE.BufferAttribute(this.sparkColors,3).setUsage(THREE.DynamicDrawUsage));
    this.sparks=new THREE.Points(geometry,new THREE.PointsMaterial({map:this.glowTexture,size:.3,
      vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.sparks.frustumCulled=false;this.group.add(this.sparks);
    this.particles=Array.from({length:capacity},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),age:0,life:0}));
    this.nextSpark=0;
    this.scratch=new THREE.Vector3();this.side=new THREE.Vector3();this.color=new THREE.Color();
    this.axis=new THREE.Vector3(0,0,1);
  }
  setQuality(quality) { this.quality=quality; }
  reset() {
    for(const trail of this.trails){trail.used=0;trail.head=0;trail.mesh.visible=false;}
    for(const pulse of this.pulses){pulse.life=0;pulse.mesh.visible=false;}
    for(const particle of this.particles)particle.life=0;
    this.sparkColors.fill(0);this.phasePulse=0;this.sparkWait=0;
  }
  pulse(position, normal, color, size, life, billboard=false) {
    const pulse=this.pulses.find(p=>!p.life)||this.pulses[0];
    pulse.age=0;pulse.life=life;pulse.size=size;pulse.billboard=billboard;
    pulse.mesh.position.copy(position);pulse.mesh.quaternion.setFromUnitVectors(this.axis,normal);
    pulse.mesh.material.color.copy(color).multiplyScalar(1.5);pulse.mesh.visible=true;
  }
  burst(f, side, count) {
    const limit=GRAPHICS[this.quality].particles;
    for(let i=0;i<count;i++){
      const particle=this.particles[this.nextSpark++%limit];
      particle.p.copy(f.p).addScaledVector(f.normal,.25).addScaledVector(f.right,side*1.35);
      particle.v.copy(f.forward).multiplyScalar(-12-Math.random()*20)
        .addScaledVector(f.normal,2+Math.random()*5).addScaledVector(f.right,side*(2+Math.random()*5));
      particle.age=0;particle.life=.2+Math.random()*.2;
    }
  }
  update(race, f, camera, reduced) {
    const previous=this.last;
    const reset=!previous||race.time<previous.time||Math.abs(race.s-previous.s)>90||Boolean(race.demo)!==previous.demo||
      (race.state==='ready'&&!race.demo&&previous.state!=='ready');
    if(reset)this.reset();
    const dt=reset?0:Math.min(.08,Math.max(0,race.time-previous.time));
    const moving=dt>0&&(race.state==='running'||race.demo);
    this.color.setHex(PHASES[race.phase].hex);
    this.phasePulse=Math.max(0,this.phasePulse-dt);
    this.sparkWait=Math.max(0,this.sparkWait-dt);
    if(!reset&&!reduced&&!race.demo&&race.state==='running'){
      if(race.phase!==previous.phase){
        this.phasePulse=.3;
        this.pulse(this.ship.position,f.normal,this.color,2.8,.28,true);
      }
      if(race.boostActive&&!previous.boost){
        this.pulse(this.ship.position,f.forward,this.color,2.1,.22,true);
      }
      // Gate crossing feedback lives on the curved field in PhaseWallVfx.
      if(moving&&race.scrape>0&&this.sparkWait===0){this.burst(f,Math.sign(race.u)||1,6);this.sparkWait=.075;}
    }
    this.spill.visible=race.height>=0&&(race.mode==='drive'||!gapAt(race.s,race.u));
    this.spill.position.copy(f.p).addScaledVector(f.normal,.04);
    this.spill.quaternion.setFromUnitVectors(this.axis,f.normal);
    this.spill.scale.set(4.5,5.5+race.thrustBlend*2,1);
    this.spill.material.color.copy(this.color);
    this.spill.material.opacity=(.12+race.thrustBlend*.12+this.phasePulse*.35)/(1+Math.max(0,race.height)*.65);
    this.ship.updateMatrixWorld(true);
    this.jump.update(race,f,previous,dt,reset,reduced,this.quality,camera);
    camera.updateMatrixWorld(true);this.side.setFromMatrixColumn(camera.matrixWorld,0);
    for(let engine=0;engine<this.trails.length;engine++){
      const trail=this.trails[engine],count=trail.points.length;
      if(moving&&!reduced){
        const head=trail.head;this.exhausts[engine].getWorldPosition(trail.points[head]);trail.times[head]=race.time;
        trail.flight[head]=!race.demo&&race.airborne&&race.jumpTime>=0?1:0;
        trail.head=(head+1)%count;trail.used=Math.min(count,trail.used+1);
      }
      trail.mesh.visible=!reduced&&trail.used>1;
      const strength=.16+race.thrustBlend*.75+(race.stripBoost ? .22 : 0);
      for(let i=0;i<count;i++){
        const sample=Math.min(i,Math.max(0,trail.used-1)),index=(trail.head-1-sample+count)%count;
        const flight=trail.flight[index],age=Math.max(0,race.time-trail.times[index]);
        const fade=Math.max(0,1-age/(flight ? .40 : .16));
        const width=(.09+race.thrustBlend*.075+flight*.10)*Math.sqrt(fade);
        for(let edge=0;edge<2;edge++){
          this.scratch.copy(trail.points[index]).addScaledVector(this.side,edge?width:-width);
          this.scratch.toArray(trail.positions,i*6+edge*3);
          const value=fade*fade*(flight?3.1:strength);
          trail.colors.set([flight ? .72*value : this.color.r*value,flight ? .94*value : this.color.g*value,flight?value:this.color.b*value],i*6+edge*3);
        }
      }
      trail.mesh.geometry.attributes.position.needsUpdate=true;trail.mesh.geometry.attributes.color.needsUpdate=true;
    }
    for(const pulse of this.pulses){
      pulse.age+=dt;
      if(reduced||!pulse.life||pulse.age>=pulse.life){pulse.life=0;pulse.mesh.visible=false;continue;}
      const t=pulse.age/pulse.life;pulse.mesh.scale.setScalar(pulse.size*(.35+t));
      pulse.mesh.material.opacity=(1-t)*(1-t)*.4;
      if(pulse.billboard)pulse.mesh.quaternion.copy(camera.quaternion);
    }
    for(let i=0;i<this.particles.length;i++){
      const p=this.particles[i];p.age+=dt;
      const active=!reduced&&p.life>0&&p.age<p.life;
      if(active)p.p.addScaledVector(p.v,dt);
      p.p.toArray(this.sparkPositions,i*3);
      const fade=active?1-p.age/p.life:0;
      this.sparkColors.set([fade*2.5,fade*.95,fade*.25],i*3);
    }
    this.sparks.visible=!reduced;
    this.sparks.geometry.attributes.position.needsUpdate=true;this.sparks.geometry.attributes.color.needsUpdate=true;
    this.last={time:race.time,s:race.s,u:race.u,phase:race.phase,passed:race.passed,airborne:race.airborne,
      jumpTime:race.jumpTime,boost:race.boostActive,state:race.state,demo:Boolean(race.demo)};
  }
}

export function softenHoverShadow(shadow) {
  shadow.material.map=radialTexture();shadow.material.opacity=.32;shadow.material.needsUpdate=true;
}
