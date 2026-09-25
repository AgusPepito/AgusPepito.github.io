import * as THREE from 'three';

// Perspective artwork covers only the forward view instead of an entire globe.
export function spaceSky() {
  const material=new THREE.MeshBasicMaterial({depthTest:false,depthWrite:false,
    fog:false,toneMapped:false});
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2,32,24),material);
  sky.name='planet-and-stars-curved-backdrop';sky.renderOrder=-1000;sky.frustumCulled=false;
  sky.visible=false;sky.userData.imageAspect=1.5;
  const texture=new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/space/planet-backdrop-r1.png`,
    loaded=>{
      sky.userData.imageAspect=loaded.image.width/loaded.image.height;
      resizeSpaceSky(sky,sky.userData.viewAspect??1.5);sky.visible=true;
    },undefined,error=>console.warn('Space backdrop could not load',error));
  texture.colorSpace=THREE.SRGBColorSpace;
  material.map=texture;
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
