import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { GRAPHICS } from './visual-settings.js';

// The same pipeline survives checkpoint handoffs with the renderer.
export class RacePipeline {
  constructor(renderer, scene, camera, quality) {
    this.renderer = renderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;
    this.hdrSupported = renderer.extensions.has('EXT_color_buffer_float');
    this.scene = scene; this.camera = camera;
    this.setQuality(quality);
  }
  setScene(scene, camera) {
    this.scene = scene; this.camera = camera;
    if (this.renderPass) { this.renderPass.scene = scene; this.renderPass.camera = camera; }
  }
  setQuality(quality) {
    this.disposeComposer();
    this.quality = GRAPHICS[quality] && (quality !== 'rich' || this.hdrSupported) ? quality : 'light';
    const settings = GRAPHICS[this.quality];
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, settings.pixelRatio));
    if (settings.bloom && this.hdrSupported) {
      this.composer = new EffectComposer(this.renderer);
      this.renderPass = new RenderPass(this.scene, this.camera);
      // UnrealBloomPass already builds its blur chain at half resolution and below.
      this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .32, .42, 1.15);
      this.output = new OutputPass();
      this.fxaa = new ShaderPass(FXAAShader);
      for (const pass of [this.renderPass, this.bloom, this.output, this.fxaa]) this.composer.addPass(pass);
    }
    this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    if (!this.composer) return;
    const ratio = this.renderer.getPixelRatio();
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(innerWidth, innerHeight);
    this.fxaa.uniforms.resolution.value.set(1 / (innerWidth * ratio), 1 / (innerHeight * ratio));
  }
  async prepare() {
    if (!this.composer) return this.renderer.compileAsync(this.scene, this.camera);
    // Compile postprocessing programs before the first racing frame as well.
    // OutputPass normally installs these defines at its first render.
    this.output.material.defines = { SRGB_TRANSFER: '', ACES_FILMIC_TONE_MAPPING: '' };
    this.output.material.needsUpdate = true;
    const materials = [this.output.material, this.bloom.materialHighPassFilter,
      ...this.bloom.separableBlurMaterials, this.bloom.compositeMaterial, this.bloom.blendMaterial];
    const scene = new THREE.Scene(), geometry = new THREE.PlaneGeometry(2, 2);
    for (const material of materials) scene.add(new THREE.Mesh(geometry, material));
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),target=this.renderer.getRenderTarget();
    const jobs=[];
    try {
      // Compile with the actual target color space/tone-mapping variant. Rendering
      // the scene to HDR must not compile its materials for direct screen output.
      this.renderer.setRenderTarget(this.composer.readBuffer);
      jobs.push(this.renderer.compileAsync(this.scene,this.camera));
      jobs.push(this.renderer.compileAsync(scene,camera));
      const finalScene=new THREE.Scene();finalScene.add(new THREE.Mesh(geometry,this.fxaa.material));
      this.renderer.setRenderTarget(null);
      jobs.push(this.renderer.compileAsync(finalScene,camera));
    } finally { this.renderer.setRenderTarget(target); }
    try { await Promise.all(jobs); } finally { geometry.dispose(); }
  }
  render() {
    this.renderer.info.reset();
    if (this.composer) this.composer.render(0);
    else this.renderer.render(this.scene, this.camera);
  }
  disposeComposer() {
    if (!this.composer) return;
    for (const pass of this.composer.passes) pass.dispose();
    this.composer.dispose();
    this.composer = null; this.renderPass = null; this.bloom = null; this.output = null; this.fxaa = null;
  }
  dispose() { this.disposeComposer(); }
}
