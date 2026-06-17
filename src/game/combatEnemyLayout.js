import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "../core/Viewport.js";

const COMBAT_CENTER_X = VIEWPORT_WIDTH / 2;
const COMBAT_BASE_Y = VIEWPORT_HEIGHT * 0.68;

/** Случайное смещение pivot по Y (глубина на сцене) при старте боя, px. */
const DEPTH_OFFSET_Y_MAX = 5;

function randomDepthOffsetY() {
  return Math.round(Math.random() * DEPTH_OFFSET_Y_MAX * 2) - DEPTH_OFFSET_Y_MAX;
}

/**
 * @param {Phaser.Scene} scene
 * @param {import("../combat/entities/Enemy.js").Enemy} enemy
 * @param {number} displayHeight
 * @returns {number}
 */
export function getEnemySpriteDisplayWidth(scene, enemy, displayHeight) {
  const { assetKey, idle } = enemy.visual;
  if (!scene.textures.exists(assetKey)) {
    return 200;
  }

  const frame = scene.textures.getFrame(assetKey, idle);
  if (!frame || frame.height <= 0) {
    return 200;
  }

  const baseScale = displayHeight / frame.height;
  return frame.width * baseScale;
}

/**
 * Позиции врагов: по X — ровная сетка с шагом = ширина спрайта, по Y — лёгкий разброс.
 * @param {number} count
 * @param {number} spriteDisplayWidth — дистанция между центрами соседних врагов
 * @param {number} [baseY]
 * @returns {{ x: number, y: number }[]}
 */
export function layoutEnemyPositions(count, spriteDisplayWidth, baseY = COMBAT_BASE_Y) {
  if (count <= 0) {
    return [];
  }

  const step = Math.max(spriteDisplayWidth, 1);

  if (count === 1) {
    return [{ x: COMBAT_CENTER_X, y: COMBAT_BASE_Y + randomDepthOffsetY() }];
  }

  const span = (count - 1) * step;
  const startX = COMBAT_CENTER_X - span / 2;

  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * step,
    y: COMBAT_BASE_Y + randomDepthOffsetY(),
  }));
}

export { COMBAT_CENTER_X, COMBAT_BASE_Y };
