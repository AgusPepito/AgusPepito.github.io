import * as THREE from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { SUN_DIRECTION, PLANET_DIRECTION } from './visual-settings.js';

// Independent world-oriented layers across the existing backdrop surface.
export function spaceSky(renderer) {
  const textureState={ready:false,error:null};
  const loader=new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}vendor/basis/`)
    .setWorkerLimit(1).detectSupport(renderer);
  const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,fog:false,
    uniforms:{planetMap:{value:null},galaxyMap:{value:null},sunDirection:{value:SUN_DIRECTION.clone()},planetDirection:{value:PLANET_DIRECTION.clone()}},
    vertexShader:`varying vec3 vSkyRay;
      void main(){vec4 world=modelMatrix*vec4(position,1.0);vSkyRay=world.xyz-cameraPosition;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`
      uniform sampler2D planetMap,galaxyMap;
      uniform vec3 sunDirection,planetDirection;
      varying vec3 vSkyRay;
      void main(){
        vec3 ray=normalize(vSkyRay);
        vec3 right=normalize(cross(planetDirection,vec3(0,1,0)));
        vec3 up=normalize(cross(right,planetDirection));
        float facing=dot(ray,planetDirection),horizontal=dot(ray,right);
        float vertical=clamp(dot(ray,up),-1.0,1.0);
        // Restore the authored galaxy, dust lanes and varied stars. Center its
        // small baked planet behind the larger independent planet layer.
        float longitude=length(vec2(horizontal,facing))>0.000001?atan(horizontal,facing):0.0;
        vec2 galaxyUv=vec2(.5+longitude/6.28318530718,.5+asin(vertical)/3.14159265359);
        vec3 galaxy=texture2D(galaxyMap,galaxyUv).rgb;
        // The source artwork is not seamless: soften its rear join and poles.
        float seam=.5*(1.0-smoothstep(0.0,.04,min(galaxyUv.x,1.0-galaxyUv.x)));
        galaxy=mix(galaxy,texture2D(galaxyMap,vec2(1.0-galaxyUv.x,galaxyUv.y)).rgb,seam);
        float poles=smoothstep(0.0,.055,min(galaxyUv.y,1.0-galaxyUv.y));
        vec3 color=vec3(.0015,.0025,.006)+galaxy*1.8*poles;
        float solar=clamp(dot(ray,sunDirection),-1.0,1.0);
        float halo=exp(-(1.0-solar)*650.0)*.22;
        float disk=smoothstep(cos(.010),cos(.004),solar);
        color+=vec3(1,.68,.36)*(halo+disk*5.0);
        vec2 p=vec2(horizontal,vertical)/max(facing,.001)/tan(.43);
        float radius=length(p),edge=max(fwidth(radius),.0015);
        float planet=step(0.0,facing)*(1.0-smoothstep(1.0-edge,1.0+edge,radius));
        // Reuse the planet pixels in the original 1536 x 1024 artwork.
        vec2 uv=vec2(1158.0/1536.0,1.0-399.0/1024.0)+p*vec2(188.0/1536.0,188.0/1024.0);
        if(planet>0.0)color=mix(color,texture2D(planetMap,uv).rgb*1.35,planet);
        float sunSide=.35+.65*max(dot(normalize(vec3(p,.45)),normalize(vec3(-.8,.65,.4))),0.0);
        float atmosphere=exp(-abs(radius-1.0)*85.0)*step(0.0,facing)*sunSide;
        color+=vec3(.11,.46,1.1)*atmosphere*.7;
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  let disposed=false;
  material.addEventListener('dispose',()=>{disposed=true;});
  // Encoded with Y flipped to match TextureLoader's original upload orientation.
  // Wait for both jobs before releasing the worker, including when one fails.
  Promise.allSettled(['planet-backdrop-r1','planet-stars-r2'].map(name=>
    loader.loadAsync(`${import.meta.env.BASE_URL}assets/space/${name}.ktx2`))).then(results=>{
    loader.dispose();
    const failed=results.find(result=>result.status==='rejected');
    if(disposed||failed){
      for(const result of results)if(result.status==='fulfilled')result.value.dispose();
      if(failed)textureState.error=`Could not load sky textures: ${failed.reason?.message??failed.reason}`;
      return;
    }
    const [texture,galaxyTexture]=results.map(result=>result.value);
    texture.colorSpace=THREE.SRGBColorSpace;galaxyTexture.colorSpace=THREE.SRGBColorSpace;
    material.uniforms.planetMap.value=texture;material.uniforms.galaxyMap.value=galaxyTexture;
    material.userData.planetTexture=texture;material.userData.galaxyTexture=galaxyTexture;
    textureState.ready=true;
  });
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2,32,24),material);
  sky.name='layered-orbital-backdrop';sky.renderOrder=-1000;sky.frustumCulled=false;
  sky.userData.imageAspect=1.5;
  sky.userData.textureState=textureState;
  return sky;
}

export function resizeSpaceSky(sky,aspect) {
  sky.userData.viewAspect=aspect;
  // Racer FOV reaches 102 degrees under boost. Keep a small shake margin.
  const imageAspect=sky.userData.imageAspect;
  const halfHeight=Math.tan(THREE.MathUtils.degToRad(102/2))*1.08*Math.max(1,aspect/imageAspect);
  const halfWidth=halfHeight*imageAspect;
  const position=sky.geometry.attributes.position,uv=sky.geometry.attributes.uv;
  for(let i=0;i<position.count;i++){
    const x=(uv.getX(i)*2-1)*halfWidth,y=(uv.getY(i)*2-1)*halfHeight;
    // Bend a perspective plane radially onto a cap. UV rays keep their original
    // proportions from the center, so the planet does not need panorama warping.
    const scale=700/Math.sqrt(x*x+y*y+1);
    position.setXYZ(i,x*scale,y*scale,-scale);
  }
  position.needsUpdate=true;sky.geometry.computeBoundingSphere();
}
