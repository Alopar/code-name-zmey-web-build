import Phaser from "phaser";

export const FILTER_BLOOD_BURN_DISSOLVE = "FilterBloodBurnDissolve";

const FRAGMENT_SHADER = [
  "precision mediump float;",
  "uniform sampler2D uMainSampler;",
  "uniform float uProgress;",
  "uniform float uTime;",
  "varying vec2 outTexCoord;",
  "float hash(vec2 p) {",
  "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);",
  "}",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p);",
  "  vec2 f = fract(p);",
  "  float a = hash(i);",
  "  float b = hash(i + vec2(1.0, 0.0));",
  "  float c = hash(i + vec2(0.0, 1.0));",
  "  float d = hash(i + vec2(1.0, 1.0));",
  "  vec2 u = f * f * (3.0 - 2.0 * f);",
  "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;",
  "}",
  "float fineGrain(vec2 uv, float time) {",
  "  vec2 drift = vec2(time * 0.22, time * 0.09);",
  "  float g = noise(uv * 24.0 + drift);",
  "  g += noise(uv * 46.0 - drift * 1.4) * 0.42;",
  "  g += noise(uv * 76.0 + drift * 0.6) * 0.18;",
  "  return g / 1.6;",
  "}",
  "void main() {",
  "  vec4 tex = texture2D(uMainSampler, outTexCoord);",
  "  if (tex.a < 0.01) {",
  "    gl_FragColor = tex;",
  "    return;",
  "  }",
  "  float edge = 0.042;",
  "  float n = fineGrain(outTexCoord, uTime);",
  "  float visibility = (uProgress < 0.001)",
  "    ? 1.0",
  "    : smoothstep(uProgress, uProgress + edge, n);",
  "  float dissolveAmt = 1.0 - visibility;",
  "  float burnBand = smoothstep(uProgress - edge * 1.15, uProgress - 0.006, n)",
  "    * (1.0 - smoothstep(uProgress, uProgress + edge * 0.85, n));",
  "  float bloodTrail = smoothstep(uProgress - edge * 3.6, uProgress + edge * 0.35, n)",
  "    * (1.0 - smoothstep(uProgress + edge * 0.5, uProgress + edge * 2.8, n));",
  "  vec3 bloodDeep = vec3(0.48, 0.0, 0.04);",
  "  vec3 bloodCore = vec3(0.88, 0.01, 0.06);",
  "  vec3 bloodRim = vec3(1.0, 0.04, 0.08);",
  "  vec3 bloodMist = vec3(0.14, 0.0, 0.02);",
  "  vec3 col = tex.rgb;",
  "  col = mix(col, bloodCore, dissolveAmt * 0.78);",
  "  col = mix(col, bloodDeep, dissolveAmt * 0.35);",
  "  col = mix(col, bloodCore, bloodTrail * 0.62);",
  "  col += bloodRim * burnBand * 1.55;",
  "  col += bloodRim * bloodTrail * 1.05;",
  "  col = mix(col, bloodMist, dissolveAmt * 0.18);",
  "  float alpha = tex.a * max(visibility, bloodTrail * 0.52);",
  "  gl_FragColor = vec4(col, alpha);",
  "}",
].join("\n");

export class BloodBurnDissolveController extends Phaser.Filters.Controller {
  /**
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   */
  constructor(camera) {
    super(camera, FILTER_BLOOD_BURN_DISSOLVE);
    /** @type {number} */
    this.progress = 0;
    /** @type {number} */
    this.time = 0;
  }
}

class FilterBloodBurnDissolveNode extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
  /**
   * @param {Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager} manager
   */
  constructor(manager) {
    super(FILTER_BLOOD_BURN_DISSOLVE, manager, null, FRAGMENT_SHADER);
  }

  /**
   * @param {BloodBurnDissolveController} controller
   * @param {Phaser.Renderer.WebGL.DrawingContext} drawingContext
   */
  setupUniforms(controller, drawingContext) {
    const programManager = this.programManager;
    programManager.setUniform("uProgress", controller.progress);
    programManager.setUniform("uTime", controller.time);
  }
}

/**
 * @param {Phaser.Renderer.WebGL.WebGLRenderer} renderer
 */
export function registerBloodBurnDissolveFilter(renderer) {
  if (!renderer?.renderNodes) {
    return false;
  }

  if (renderer.renderNodes.hasNode(FILTER_BLOOD_BURN_DISSOLVE)) {
    return true;
  }

  renderer.renderNodes.addNodeConstructor(FILTER_BLOOD_BURN_DISSOLVE, FilterBloodBurnDissolveNode);
  return true;
}

/**
 * @param {Phaser.GameObjects.Sprite} sprite
 * @returns {BloodBurnDissolveController | null}
 */
export function attachBloodBurnDissolveFilter(sprite) {
  if (!sprite?.scene?.game?.renderer) {
    return null;
  }

  const renderer = sprite.scene.game.renderer;
  if (renderer.type !== Phaser.WEBGL) {
    return null;
  }

  registerBloodBurnDissolveFilter(renderer);

  sprite.enableFilters?.();
  if (!sprite.filters?.internal) {
    return null;
  }

  const controller = new BloodBurnDissolveController(sprite.filterCamera);
  sprite.filters.internal.add(controller);
  return controller;
}

/**
 * @param {Phaser.GameObjects.Sprite} sprite
 * @param {BloodBurnDissolveController | null} controller
 */
export function detachBloodBurnDissolveFilter(sprite, controller) {
  if (!sprite?.filters?.internal || !controller) {
    return;
  }

  sprite.filters.internal.remove(controller, true);
}
