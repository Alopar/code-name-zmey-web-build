import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../core/Viewport.js";

/**
 * Фон world-view на весь логический viewport (1920×1080).
 * @param {Phaser.Scene} scene
 * @param {string} textureKey
 * @returns {Phaser.GameObjects.Image}
 */
export function addWorldBackground(scene, textureKey) {
  const bg = scene.add.image(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, textureKey);
  bg.setDisplaySize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  bg.setDepth(0);
  return bg;
}
