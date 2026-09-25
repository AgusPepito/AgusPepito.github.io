// Analytic version of track.js point/frame for shared gate strips. Work in
// station-relative Z during derivatives to avoid subtracting large distances.
const deformationGLSL = `
attribute vec4 gateAnchor;
uniform vec4 gateTrack;
uniform float gateProfile;
vec3 gatePosition;
float gateEase(float v){float t=clamp(v,0.0,1.0);return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec3 gatePoint(float s,float u){
  float curl=0.0;
  if(gateProfile==2.0)curl=1.0;
  else if(gateProfile==3.0)curl=-1.0;
  else if(gateProfile==0.0){
    if(s>=850.0&&s<1300.0)curl=-gateEase((s-850.0)/450.0);
    else if(s>=1300.0&&s<2500.0)curl=-1.0;
    else if(s>=2500.0&&s<2950.0)curl=-1.0+gateEase((s-2500.0)/450.0);
    else if(s>=3500.0&&s<3950.0)curl=gateEase((s-3500.0)/450.0);
    else if(s>=3950.0&&s<5400.0)curl=1.0;
    else if(s>=5400.0&&s<5850.0)curl=1.0-gateEase((s-5400.0)/450.0);
  }
  float halfWidth=18.0+(3.141592653589793*18.0-18.0)*abs(curl);
  float lateral=u*halfWidth,k=curl/18.0;
  float x=lateral,y=0.0;
  if(abs(k)>=0.0000001){x=sin(k*lateral)/k;float h=sin(k*lateral*.5);y=2.0*h*h/k;}
  if(gateProfile==0.0){
    x+=95.0*gateEase((s-300.0)/550.0)-170.0*gateEase((s-1450.0)/750.0)
      +210.0*gateEase((s-2950.0)/500.0)-180.0*gateEase((s-4050.0)/900.0)+45.0*gateEase((s-5900.0)/450.0);
    y+=24.0*gateEase((s-1500.0)/800.0)-40.0*gateEase((s-4150.0)/900.0);
  }else if(gateProfile==1.0){
    x+=18.0*gateEase((s/gateTrack.w-.15)/.2)-36.0*gateEase((s/gateTrack.w-.4)/.2)+18.0*gateEase((s/gateTrack.w-.7)/.2);
  }
  return vec3(x,y,gateTrack.x-s);
}
void gateFrame(float s,float u,out vec3 p,out vec3 right,out vec3 up,out vec3 forward){
  p=gatePoint(s,u);
  forward=normalize(gatePoint(s+.1,u)-gatePoint(s-.1,u));
  right=normalize(gatePoint(s,u+.0001)-gatePoint(s,u-.0001));
  up=normalize(cross(right,forward));right=normalize(cross(forward,up));
}
vec3 gateSurfaceWithNormal(vec3 v,out vec3 n){
  vec3 p,r,f;gateFrame(gateTrack.x-v.z,v.x/gateTrack.y+gateTrack.z,p,r,n,f);
  return p+n*v.y;
}
vec3 gateSurface(vec3 v){vec3 n;return gateSurfaceWithNormal(v,n);}
void gateDeform(vec3 v,vec3 sourceNormal,vec4 anchor,out vec3 p,out vec3 n){
  if(anchor.w>.5){
    vec3 base,r,up,f;gateFrame(gateTrack.x-anchor.z,anchor.x/gateTrack.y+gateTrack.z,base,r,up,f);
    p=base+up*v.y+r*(v.x-anchor.x)+f*(anchor.z-v.z);
    n=normalize(r*sourceNormal.x+up*sourceNormal.y-f*sourceNormal.z);
  }else{
    vec3 dy;p=gateSurfaceWithNormal(v,dy);
    // Inverse-transpose Jacobian transports normals through the same mapping.
    float e=.02;
    vec3 dx=(gateSurface(v+vec3(e,0,0))-gateSurface(v-vec3(e,0,0)))/(2.0*e);
    vec3 dz=(gateSurface(v+vec3(0,0,e))-gateSurface(v-vec3(0,0,e)))/(2.0*e);
    n=normalize(sourceNormal.x*cross(dy,dz)+sourceNormal.y*cross(dz,dx)+sourceNormal.z*cross(dx,dy));
  }
  p.z-=gateTrack.x;
}
`;

export function installGateShader(THREE,material){
  const data=material.userData.trackDeform;if(!data)return;
  material.onBeforeCompile=shader=>{
    shader.uniforms.gateTrack={value:new THREE.Vector4(data.station,data.half,data.center,data.length)};
    shader.uniforms.gateProfile={value:{mixed:0,flat:1,inside:2,outside:3,'gap-flat':4}[data.profile]};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+deformationGLSL)
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        vec3 gateOffset=vec3(instanceMatrix[3].x,0.0,0.0);
        vec4 gatePivot=gateAnchor;gatePivot.xyz+=gateOffset;
        gateDeform(position+gateOffset,normal,gatePivot,gatePosition,objectNormal);`)
      .replace('#include <begin_vertex>','vec3 transformed=gatePosition-gateOffset;');
  };
  material.customProgramCacheKey=()=> 'track-deformed-gate-v8';
}
