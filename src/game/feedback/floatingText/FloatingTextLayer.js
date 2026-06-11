import { FLOATING_TEXT_DEPTH } from "./depth.js";

/** @type {WeakMap<Phaser.Scene, Phaser.GameObjects.Container>} */
const layerByScene = new WeakMap();

/** @type {WeakSet<Phaser.Scene>} */
const shutdownBound = new WeakSet();

/**
 * @param {Phaser.Scene} scene
 * @returns {Phaser.GameObjects.Container}
 */
export function ensureFloatingTextLayer(scene) {
  const existing = layerByScene.get(scene);
  if (existing?.active) {
    return existing;
  }

  const layer = scene.add.container(0, 0);
  layer.setDepth(FLOATING_TEXT_DEPTH);
  layerByScene.set(scene, layer);

  if (!shutdownBound.has(scene)) {
    shutdownBound.add(scene);
    scene.events.once("shutdown", () => {
      layerByScene.delete(scene);
      shutdownBound.delete(scene);
    });
  }

  return layer;
}
