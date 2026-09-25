// Procedural alpha artwork: navigation, hazard and lift symbols, never text.
// Runtime uniforms are restored after worker transfer rather than serialized.
const states=new WeakMap();

export function edgeFieldMaterial(THREE,start,end){
  const material=new THREE.MeshBasicMaterial({color:0x9dd9ef,transparent:true,opacity:.72,
    depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  material.name='road-containment-field-r1';
  material.forceSinglePass=true;
  material.userData.edgeField={start,end};
  installEdgeField(THREE,material);
  return material;
}

export function installEdgeField(THREE,material){
  if(!material.userData.edgeField)return null;
  if(states.has(material))return states.get(material);
  const uniforms={edgeTime:{value:0},edgeReduced:{value:0},edgeDetail:{value:1},
    edgeShip:{value:new THREE.Vector3(0,0,0)},edgeImpact:{value:new THREE.Vector3(0,0,-1000)}};
  const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='attribute vec4 edgeCoord;\nattribute vec2 edgeStyle;\nvarying vec4 vEdgeCoord;\nvarying vec2 vEdgeStyle;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvEdgeCoord = edgeCoord;\nvEdgeStyle = edgeStyle;');
    shader.fragmentShader=`
      varying vec4 vEdgeCoord;
      varying vec2 vEdgeStyle;
      uniform float edgeTime,edgeReduced,edgeDetail;
      uniform vec3 edgeShip,edgeImpact;
      float edgeLine(vec2 p,vec2 a,vec2 b){
        vec2 ab=b-a;return length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0));
      }
      float edgeStroke(float d,float width,float aa){return 1.0-smoothstep(width,width+aa,d);}
      float edgeChevron(vec2 p,float aa){
        float d=min(edgeLine(p,vec2(-.55,-.62),vec2(.3,0.0)),edgeLine(p,vec2(.3,0.0),vec2(-.55,.62)));
        return edgeStroke(d,.075,aa);
      }
      float edgeWarning(vec2 p,float aa){
        float d=edgeLine(p,vec2(-1.05,-.78),vec2(0.0,1.0));
        d=min(d,edgeLine(p,vec2(0.0,1.0),vec2(1.05,-.78)));
        d=min(d,edgeLine(p,vec2(1.05,-.78),vec2(-1.05,-.78)));
        float bar=edgeStroke(edgeLine(p,vec2(0.0,-.10),vec2(0.0,.38)),.075,aa);
        float dotMark=edgeStroke(length(p-vec2(0.0,-.46)),.075,aa);
        return max(edgeStroke(d,.065,aa),max(bar,dotMark));
      }
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float s=vEdgeCoord.x,h=vEdgeCoord.y;
      float t=edgeTime*(1.0-edgeReduced);
      float aa=max(.024,max(fwidth(s),fwidth(h)));
      float cell=mod(s,24.0);
      float marks=max(edgeChevron(vec2(cell-5.0,h-1.45),aa),
        max(edgeChevron(vec2(cell-7.0,h-1.45),aa),edgeChevron(vec2(cell-9.0,h-1.45),aa)));
      vec2 icon=vec2(cell-17.5,h-1.45);
      float shield=edgeLine(icon,vec2(-.72,.67),vec2(.72,.67));
      shield=min(shield,edgeLine(icon,vec2(-.72,.67),vec2(-.61,-.12)));
      shield=min(shield,edgeLine(icon,vec2(.72,.67),vec2(.61,-.12)));
      shield=min(shield,edgeLine(icon,vec2(-.61,-.12),vec2(0.0,-.82)));
      shield=min(shield,edgeLine(icon,vec2(.61,-.12),vec2(0.0,-.82)));
      marks=max(marks,edgeStroke(shield,.055,aa));
      float danger=clamp(vEdgeStyle.x,0.0,1.0);
      float lift=clamp(vEdgeStyle.y,0.0,1.0-danger);
      float guide=1.0-danger-lift;
      float panel=mod(s,12.0)-6.0;
      float warning=edgeWarning(vec2(panel,h-1.55),aa);
      float liftMarks=max(edgeChevron(vec2(h-1.1,-panel),aa),edgeChevron(vec2(h-2.0,-panel),aa));
      // Diagonal warning bands remain recognizable when the small icons recede.
      float stripe=1.0-smoothstep(.22,.36+min(aa,.2),abs(fract((s+h*1.4)/1.8)-.5));
      float bands=edgeStroke(abs(h-.56),.12,aa)+edgeStroke(abs(h-2.88),.06,aa);
      marks=marks*guide+warning*danger+liftMarks*lift;
      // Keep small details from turning into solid bright strips at a distance.
      marks*=min(1.0,.32/aa);
      float rail=edgeStroke(abs(h-.16),.042,aa*.45);
      float upperRail=edgeStroke(abs(h-2.85),.016,aa*.4)*.22;
      float packet=pow(.5+.5*sin(s*.48-t*3.0),10.0)*(1.0-edgeReduced);
      float mesh=0.0;
      if(edgeDetail>.5){
        vec2 lattice=abs(fract(vec2(s*.65+h*.8,h*1.65))-.5);
        mesh=(1.0-smoothstep(.025,.08+aa,lattice.x))*.018;
        mesh+=(1.0-smoothstep(.025,.08+aa,lattice.y))*.012;
        mesh*=1.0-smoothstep(.18,.65,aa);
      }
      float nearSide=1.0-step(.5,abs(vEdgeCoord.z-edgeShip.y));
      float proximity=exp(-abs(s-edgeShip.x)*.065)*edgeShip.z*nearSide;
      float energy=.042+mesh+exp(-h*2.0)*.2+rail*(2.0+packet*.55)+upperRail;
      energy+=bands*stripe*danger*.85;
      energy+=marks*(1.9+proximity*.75)+proximity*.12;
      vec3 tint=diffuseColor.rgb*guide+vec3(1.35,.045,.018)*danger+vec3(1.2,.46,.035)*lift;
      vec3 light=tint*energy;
      float age=edgeTime-edgeImpact.z;
      if(age>=0.0&&age<.55&&edgeReduced<.5&&abs(vEdgeCoord.z-edgeImpact.y)<.5){
        float d=length(vec2((s-edgeImpact.x)*.6,h-1.15));
        float ripple=edgeStroke(abs(d-(.2+age*15.0)),.10,aa);
        float fade=1.0-smoothstep(.08,.55,age);
        light+=vec3(2.6,1.2,.32)*(ripple*.8+exp(-d*1.4)*.8)*fade;
      }
      outgoingLight=light;
      diffuseColor.a*=vEdgeCoord.w*smoothstep(0.0,.06,h)*(1.0-smoothstep(2.9,6.4,h));
      #include <opaque_fragment>
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float edgeFog=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
        #else
          float edgeFog=smoothstep(fogNear,fogFar,vFogDepth);
        #endif
        gl_FragColor.rgb*=1.0-edgeFog;
      #endif
    `);
  };
  material.customProgramCacheKey=()=>`${cacheKey}|road-edge-field-r2`;
  material.needsUpdate=true;states.set(material,uniforms);return uniforms;
}
