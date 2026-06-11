import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";

const GRADIENT_KEY = "map_gradient_bg";

/**
 * Радиальный градиент как в scene-load-overlay.css.
 * @param {Phaser.Scene} scene
 */
export function addMapGradientBackground(scene) {
  if (!scene.textures.exists(GRADIENT_KEY)) {
    const canvas = document.createElement("canvas");
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    const centerX = VIEWPORT_WIDTH * 0.5;
    const centerY = VIEWPORT_HEIGHT * 0.3;
    const radius = Math.max(VIEWPORT_WIDTH, VIEWPORT_HEIGHT) * 0.75;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

    gradient.addColorStop(0, "#2f3a1e");
    gradient.addColorStop(0.55, "#0c1008");
    gradient.addColorStop(1, "#060804");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    scene.textures.addCanvas(GRADIENT_KEY, canvas);
  }

  const bg = scene.add.image(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, GRADIENT_KEY);
  bg.setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  bg.setDepth(0);
  return bg;
}
