import * as THREE from 'three';
import {frame,section,clamp} from './track.js';
import {gapAt,JUMP} from './jumps.js';

const additive={transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,toneMapped:false};
const liftNozzles=[new THREE.Vector3(-1.12,-.40,.55),new THREE.Vector3(1.12,-.40,.55)];

// Crossed, feathered sheets give the lift exhaust volume without visible cone
// rims. UV.y runs from the nozzle to the tail, opposite the road normal.
function liftGeometry(){
  const positions=[],uvs=[],indices=[];
  for(let sheet=0;sheet<2;sheet++){
    const base=positions.length/3;
    for(const v of [0,1])for(const side of [-1,1]){
      positions.push(sheet===0?side:0,-v,v*.32+(sheet===1?side:0));
      uvs.push((side+1)/2,v);
    }
    indices.push(base,base+1,base+2,base+1,base+3,base+2);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  return geometry;
}

// Accepted jump events own all effects. Flight is carried by the engine wake;
// launch and contact have short, distinct envelopes instead of a floating hoop.
export class JumpVfx{
  constructor(parent,ship,glowTexture){
    this.ship=ship;this.group=new THREE.Group();this.group.name='jump-feedback';parent.add(this.group);
    this.rig=new THREE.Group();this.rig.name='jump-lift-rig';this.group.add(this.rig);
    this.scratch=new THREE.Vector3();this.axis=new THREE.Vector3();this.eye=new THREE.Vector3();this.side=new THREE.Vector3();
    this.jetMaterial=new THREE.ShaderMaterial({...additive,
      uniforms:{jumpClock:{value:0},jumpPower:{value:0}},
      vertexShader:`varying vec2 vJumpUv;
        void main(){vJumpUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vJumpUv;uniform float jumpClock,jumpPower;
        void main(){
          float tail=vJumpUv.y;
          float across=abs(vJumpUv.x*2.0-1.0);
          float radius=mix(.26,.92,smoothstep(0.0,1.0,tail));
          float feather=1.0-smoothstep(0.0,radius,across);
          float core=exp(-across*across/(.012+tail*.015));
          float envelope=pow(1.0-tail,1.65)*smoothstep(0.0,.025,tail);
          float flow=.94+.06*sin(tail*27.0-jumpClock*21.0);
          vec3 light=mix(vec3(.08,.72,1.7),vec3(2.4,2.8,3.0),core*(1.0-tail*.7));
          gl_FragColor=vec4(light,(feather*.48+core*.34)*envelope*flow*jumpPower);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.jetMaterial.forceSinglePass=true;
    const geometry=liftGeometry();
    this.jets=liftNozzles.map(position=>{
      const jet=new THREE.Mesh(geometry,this.jetMaterial);jet.position.copy(position);
      jet.renderOrder=3;this.rig.add(jet);return jet;
    });
    this.flareMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xa0eaff,opacity:0,
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    this.flares=liftNozzles.map(position=>{
      const flare=new THREE.Sprite(this.flareMaterial);flare.position.copy(position);
      flare.position.y-=.08;flare.renderOrder=4;this.rig.add(flare);return flare;
    });
    this.waves=Array.from({length:3},()=>{
      const count=48,positions=new Float32Array((count+1)*6),colors=new Float32Array((count+1)*6);
      const uvs=new Float32Array((count+1)*4),indices=[];
      for(let i=0;i<count;i++){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2).setUsage(THREE.DynamicDrawUsage));geometry.setIndex(indices);
      const material=new THREE.ShaderMaterial({...additive,vertexColors:true,
        uniforms:{waveOpacity:{value:0}},
        vertexShader:`varying vec2 vWaveUv;varying float vSupported;
          void main(){vWaveUv=uv;vSupported=color.r;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`varying vec2 vWaveUv;varying float vSupported;uniform float waveOpacity;
          void main(){
            float band=pow(max(0.0,sin(vWaveUv.y*3.14159265)),2.0);
            float rimDistance=(vWaveUv.y-.64)*9.0;
            float rim=exp(-rimDistance*rimDistance);
            vec3 light=mix(vec3(.08,.6,1.4),vec3(1.55,2.1,2.4),rim);
            gl_FragColor=vec4(light,(band*.32+rim*.45)*vSupported*waveOpacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      material.forceSinglePass=true;
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=3;this.group.add(mesh);
      return {mesh,positions,colors,uvs,age:0,life:0,s:0,u:0,radius:0,metric:1,landing:false};
    });
    // A single pool of narrow, velocity-aligned streaks replaces round confetti.
    const capacity=32,streakGeometry=new THREE.BufferGeometry(),indices=[],uvs=[];
    this.positions=new Float32Array(capacity*12);this.colors=new Float32Array(capacity*12);
    for(let i=0;i<capacity;i++){
      const n=i*4;indices.push(n,n+1,n+2,n+1,n+3,n+2);uvs.push(0,0,1,0,0,1,1,1);
    }
    streakGeometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
    streakGeometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3).setUsage(THREE.DynamicDrawUsage));
    streakGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));streakGeometry.setIndex(indices);
    const streakMaterial=new THREE.ShaderMaterial({...additive,vertexColors:true,
      vertexShader:`varying vec2 vStreakUv;varying vec3 vStreakColor;
        void main(){vStreakUv=uv;vStreakColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vStreakUv;varying vec3 vStreakColor;
        void main(){
          float feather=pow(max(0.0,1.0-abs(vStreakUv.x*2.0-1.0)),2.0);
          float taper=sin(vStreakUv.y*3.14159265);
          gl_FragColor=vec4(vStreakColor,feather*taper*.7);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    streakMaterial.forceSinglePass=true;
    this.streaks=new THREE.Mesh(streakGeometry,streakMaterial);
    this.streaks.frustumCulled=false;this.streaks.renderOrder=3;this.group.add(this.streaks);
    this.particles=Array.from({length:capacity},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),
      normal:new THREE.Vector3(),age:0,life:0,length:0,width:0}));
    this.next=0;this.reset();
  }
  reset(){
    this.rig.visible=false;
    for(const wave of this.waves){wave.life=0;wave.mesh.visible=false;}
    for(const particle of this.particles)particle.life=0;
    this.colors.fill(0);this.streaks.visible=false;
  }
  wave(race,f,landing){
    if(gapAt(race.s,race.u))return;
    const wave=this.waves.find(entry=>!entry.life)||this.waves[0];
    Object.assign(wave,{s:race.s,u:race.u,metric:f.metric,radius:landing?5.8:3.6,
      age:0,life:landing ? .34 : .24,landing});
  }
  burst(race,f,landing,quality){
    const count=quality==='rich'?(landing?14:10):6;
    for(let i=0;i<count;i++){
      const particle=this.particles[this.next++%this.particles.length],side=i%2?1:-1;
      const angle=i/count*Math.PI*2,jitter=.8+Math.random()*.4;
      if(landing)particle.p.copy(f.p).addScaledVector(f.normal,.16).addScaledVector(f.right,side*.9);
      else particle.p.copy(liftNozzles[i%2]).applyMatrix4(this.ship.matrixWorld);
      particle.v.copy(f.forward).multiplyScalar(race.speed*(landing ? .48 : .72))
        .addScaledVector(f.right,landing?Math.cos(angle)*10*jitter:side*(2+Math.random()*3))
        .addScaledVector(f.normal,landing?1.5+Math.random()*2:-5-Math.random()*5);
      particle.normal.copy(f.normal);particle.age=0;particle.life=.18+Math.random()*.14;
      particle.length=landing ? .7+Math.random()*.7 : 1.1+Math.random()*.7;particle.width=.035+Math.random()*.025;
    }
  }
  update(race,f,previous,dt,reset,reduced,quality,camera){
    if(reset)this.reset();
    const active=!race.demo&&race.airborne&&race.jumpTime>=0&&(race.state==='running'||race.state==='paused');
    const moving=dt>0&&!reset&&race.state==='running'&&!race.demo;
    const launched=moving&&active&&(!previous.airborne||previous.jumpTime<0);
    const landed=moving&&previous.airborne&&previous.jumpTime>=0&&!race.airborne&&race.landing>0;
    if(!reduced){
      if(launched){this.wave(race,f,false);this.burst(race,f,false,quality);}
      if(landed){this.wave(race,f,true);this.burst(race,f,true,quality);}
    }
    const contact=!race.demo&&!race.airborne?clamp(race.landing/.18,0,1):0;
    this.rig.visible=active||(!reduced&&contact>0);
    if(this.rig.visible){
      const launch=active?Math.pow(1-clamp(race.jumpTime/JUMP.rise,0,1),2):0;
      const brake=active?clamp((race.jumpTime-(JUMP.duration-.28))/.28,0,1):0;
      // Same hull pose as the visible craft, including steering bank/pitch.
      this.rig.position.copy(this.ship.position);this.rig.quaternion.copy(this.ship.quaternion);
      const power=reduced?0:.055+launch*1.3+brake*.34+contact*.45;
      this.jetMaterial.uniforms.jumpClock.value=race.time;
      this.jetMaterial.uniforms.jumpPower.value=power;
      this.flareMaterial.opacity=reduced ? .16 : .16+launch*.65+brake*.14+contact*.36;
      const flash=reduced?0:launch;
      this.flareMaterial.color.setRGB(.75+flash*.9,1.4+flash*.9,1.9+flash*.6);
      for(let i=0;i<this.jets.length;i++){
        this.jets[i].visible=!reduced;
        const width=.34+launch*.26+contact*.14,length=.65+launch*2.8+brake*.6;
        this.jets[i].scale.set(width,length,width);
        const size=reduced ? .8 : 1.05+launch*.9+contact*.6;this.flares[i].scale.set(size,size,1);
      }
    }
    for(const wave of this.waves){
      wave.age+=dt;
      if(reduced||!wave.life||wave.age>=wave.life){wave.life=0;wave.mesh.visible=false;continue;}
      const t=wave.age/wave.life,radius=.8+wave.radius*(1-Math.pow(1-t,2.5));
      const count=quality==='rich'?48:24,width=.20+.16*(1-t);
      const half=section(wave.s).halfWidth;
      for(let i=0;i<=count;i++)for(let edge=0;edge<2;edge++){
        const angle=i/count*Math.PI*2,r=radius+(edge?width:-width);
        const s=wave.s+Math.sin(angle)*r*.72/wave.metric,u=wave.u+Math.cos(angle)*r/half;
        const pose=frame(s,u),road=section(s);
        this.scratch.copy(pose.p).addScaledVector(pose.normal,.085);
        const at=i*6+edge*3;this.scratch.toArray(wave.positions,at);
        const onRoad=(road.closed||Math.abs(u)<=1)&&!gapAt(s,u)?1:0;
        wave.colors.set([onRoad,onRoad,onRoad],at);wave.uvs.set([i/count,edge],i*4+edge*2);
      }
      wave.mesh.geometry.setDrawRange(0,count*6);
      for(const name of ['position','color','uv'])wave.mesh.geometry.attributes[name].needsUpdate=true;
      wave.mesh.material.uniforms.waveOpacity.value=Math.pow(1-t,1.8)*(wave.landing ? .85 : .65);
      wave.mesh.visible=true;
    }
    let streaks=0;
    for(let i=0;i<this.particles.length;i++){
      const particle=this.particles[i];particle.age+=dt;
      const live=!reduced&&particle.life>0&&particle.age<particle.life;
      if(!live){this.colors.fill(0,i*12,i*12+12);continue;}
      particle.v.addScaledVector(particle.normal,-8*dt);particle.p.addScaledVector(particle.v,dt);streaks++;
      const fade=Math.pow(1-particle.age/particle.life,1.4);
      this.axis.copy(particle.v).normalize();this.eye.copy(camera.position).sub(particle.p).normalize();
      this.side.crossVectors(this.axis,this.eye);
      if(this.side.lengthSq()<.001)this.side.copy(f.right);
      this.side.normalize().multiplyScalar(particle.width);
      for(let corner=0;corner<4;corner++){
        const tail=corner<2;
        this.scratch.copy(particle.p).addScaledVector(this.axis,tail?-particle.length*(.4+fade*.6):0)
          .addScaledVector(this.side,(corner%2?1:-1)*(tail ? .2 : 1));
        this.scratch.toArray(this.positions,i*12+corner*3);
        this.colors.set([fade*.8,fade*1.65,fade*2.3],i*12+corner*3);
      }
    }
    this.streaks.visible=streaks>0;
    this.streaks.geometry.attributes.position.needsUpdate=true;this.streaks.geometry.attributes.color.needsUpdate=true;
  }
}
