// Texture-free projection, shared by the standalone asset and worker-built gates.
// Runtime uniforms stay outside userData so material JSON contains only settings.
const states = new WeakMap();
export const phaseFieldHeight = curl => 11 - 2 * Math.max(0, Math.min(1, curl));

export function installPhaseField(THREE, material) {
  const config = material.userData.phaseField;
  if (!config) return null;
  if (states.has(material)) return states.get(material);
  const uniforms = {
    fieldTime: {value: 0}, fieldStyle: {value: 0}, fieldReduced: {value: 0},
    fieldDetail: {value: 1}, fieldApproach: {value: 0}, fieldViewDistance: {value: 100},
    fieldSize: {value: new THREE.Vector2(config.width, config.height)},
    fieldPitch: {value: config.width / Math.max(1, Math.round(config.width / 6))},
    fieldClosed: {value: config.closed ? 1 : 0}, fieldCurl: {value: config.curl || 0},
    // Source-space metres across/above the emitter and the crossing time.
    fieldImpact: {value: new THREE.Vector3(0, 0, -1000)},
  };
  const previous = material.onBeforeCompile, cacheKey = material.customProgramCacheKey();
  material.onBeforeCompile = function(shader, renderer) {
    previous.call(this, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec2 vFieldUv;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvFieldUv = uv;');
    shader.fragmentShader = `
      varying vec2 vFieldUv;
      uniform float fieldTime, fieldStyle, fieldReduced, fieldDetail, fieldApproach, fieldViewDistance;
      uniform vec2 fieldSize;
      uniform float fieldPitch, fieldClosed, fieldCurl;
      uniform vec3 fieldImpact;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 fieldPoint = vFieldUv * fieldSize;
      float h = fieldPoint.y;
      float t = fieldTime * (1.0 - fieldReduced);
      // Five optical cartridges per six-metre module, including scaled tube wedges.
      float moduleX = fract(fieldPoint.x / fieldPitch) * 6.0 - 3.0;
      float cartridge = clamp(floor((moduleX + 2.06) / 1.03 + 0.5), 0.0, 4.0);
      float streamDistance = abs(moduleX - (-2.06 + cartridge * 1.03)) * fieldPitch / 6.0;
      float pixelX = max(fwidth(fieldPoint.x), 0.018);
      float pixelY = max(fwidth(h), 0.018);
      float stream = 1.0 - smoothstep(0.028, 0.065 + pixelX, streamDistance);
      // Fade subpixel cores instead of turning distant gates into striped glare.
      stream *= min(1.0, 0.14 / pixelX);
      float streamGlow = exp(-streamDistance * 9.0);
      float channel = floor(fieldPoint.x / fieldPitch) * 5.0 + cartridge;
      float flowSpeed = 0.55;
      float cadence = 1.0;
      if (fieldStyle > 0.5 && fieldStyle < 1.5) {
        flowSpeed = 0.38;
        cadence = 0.65 + 0.35 * pow(0.5 + 0.5 * sin(t * 3.0), 2.0);
      } else if (fieldStyle > 1.5) {
        flowSpeed = 0.46;
        cadence = 0.85 + 0.15 * sin(h * 1.4 - t * 2.0 + channel * 0.7);
      }
      float packetPhase = fract(h * 0.18 - t * flowSpeed + channel * 0.173);
      float packet = smoothstep(0.12, 0.3, packetPhase) * (1.0 - smoothstep(0.3, 0.65, packetPhase));
      packet = mix(packet, 0.3, fieldReduced);
      float interference = 0.0;
      if (fieldDetail > 0.5) {
        interference = sin(h * 2.4 - t * 0.8 + sin(fieldPoint.x * 0.55 + t * 0.35))
          * sin(fieldPoint.x * 0.8 - h * 0.6 + t * 0.5);
        interference *= 1.0 - smoothstep(0.35, 1.4, max(pixelX, pixelY));
      }
      // Fade every layer across the upper 40%, with no hard luminous cap.
      float topFade = 1.0 - smoothstep(0.6, 1.0, vFieldUv.y);
      float edgeDistance = min(fieldPoint.x, fieldSize.x - fieldPoint.x);
      float sideEdge = (1.0 - smoothstep(0.045, 0.13 + pixelX, edgeDistance)) * (1.0 - fieldClosed);
      sideEdge *= min(1.0, 0.22 / pixelX);
      float baseGlow = exp(-h * 2.2) * 0.26;
      float nearVeil = 0.4 + 0.6 * smoothstep(3.0, 18.0, abs(fieldViewDistance));
      float energy = (0.12 + interference * 0.025) * nearVeil;
      energy += (streamGlow * 0.12 + stream * (0.4 + packet * 2.0) * cadence) * (0.75 + 0.25 * nearVeil);
      energy += sideEdge * 2.3 + baseGlow;
      energy *= 1.0 + fieldApproach * 0.1;

      float age = fieldTime - fieldImpact.z;
      float opening = 0.0;
      if (age >= 0.0 && age < 0.75 && fieldReduced < 0.5) {
        float dx = abs(fieldPoint.x - fieldImpact.x);
        if (fieldClosed > 0.5) dx = min(dx, abs(fieldSize.x - dx));
        // Arc lengths shrink inside tubes and grow on the exterior skin.
        dx *= max(0.2, 1.0 - fieldCurl * (h + fieldImpact.y) * 0.5 / 18.0);
        float d = length(vec2(dx, h - fieldImpact.y));
        float radius = 0.6 + age * 20.0;
        float ring = 1.0 - smoothstep(0.12, 0.38 + max(pixelX, pixelY), abs(d - radius));
        float fade = 1.0 - smoothstep(0.15, 0.75, age);
        float recovery = smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(0.18, 0.6, age));
        opening = (1.0 - smoothstep(1.3, 2.5, d)) * recovery;
        energy = energy * (1.0 - opening * 0.92) + ring * fade * 3.0;
      }
      outgoingLight = diffuseColor.rgb * energy;
      diffuseColor.a *= 0.72 * smoothstep(0.0, 0.04, h) * topFade;
      #include <opaque_fragment>
    `);
    // Additive energy must fade to black, not add a fog-coloured rectangle.
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float fieldFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        #else
          float fieldFog = smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        gl_FragColor.rgb *= 1.0 - fieldFog;
      #endif
    `);
  };
  material.customProgramCacheKey = () => `${cacheKey}|phase-field-r2-soft-top`;
  material.needsUpdate = true;
  states.set(material, uniforms);
  return uniforms;
}

export function updatePhaseField(material, {time, phase, reduced = false, detail = true, approach = 0, viewDistance = 100}) {
  const uniforms = states.get(material);
  if (!uniforms) return;
  // The library also supports recolouring the existing material in place.
  const c = material.color;
  uniforms.fieldStyle.value = phase ?? (c.b < c.r * 0.7 ? 1 : c.r > c.g ? 2 : 0);
  uniforms.fieldTime.value = time;
  uniforms.fieldReduced.value = reduced ? 1 : 0;
  uniforms.fieldDetail.value = detail ? 1 : 0;
  uniforms.fieldApproach.value = approach;
  uniforms.fieldViewDistance.value = viewDistance;
}
