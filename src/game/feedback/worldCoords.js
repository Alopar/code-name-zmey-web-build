import Phaser from "phaser";

const DEFAULT_TEXT_FEEDBACK_ANCHOR = Object.freeze({
  spawnOffsetX: 0,
  spawnOffsetY: 520,
});

/**
 * @param {Phaser.GameObjects.Container} container
 * @param {number} localX
 * @param {number} localY
 * @returns {Phaser.Math.Vector2}
 */
export function containerLocalToWorld(container, localX, localY) {
  const matrix = container.getWorldTransformMatrix();
  const out = new Phaser.Math.Vector2();
  matrix.transformPoint(localX, localY, out);
  return out;
}

/**
 * Мировая позиция якоря текстового фидбека относительно спрайта цели.
 * @param {{
 *   sprite: Phaser.GameObjects.Sprite,
 *   pivot: Phaser.GameObjects.Container,
 *   view?: Phaser.GameObjects.Container,
 * }} ctx
 * @param {{ spawnOffsetX?: number, spawnOffsetY?: number }} [anchor]
 * @returns {Phaser.Math.Vector2 | null}
 */
export function resolveTextFeedbackWorldPosition(ctx, anchor = DEFAULT_TEXT_FEEDBACK_ANCHOR) {
  const { sprite, pivot, view } = ctx;

  if (!sprite?.active || !pivot?.active) {
    return null;
  }

  const spawnOffsetX = anchor.spawnOffsetX ?? DEFAULT_TEXT_FEEDBACK_ANCHOR.spawnOffsetX;
  const spawnOffsetY = anchor.spawnOffsetY ?? DEFAULT_TEXT_FEEDBACK_ANCHOR.spawnOffsetY;
  const baseScale = sprite.scaleX;
  const localX = (view?.x ?? 0) + spawnOffsetX * baseScale;
  const localY = (view?.y ?? 0) - spawnOffsetY * baseScale;

  return containerLocalToWorld(pivot, localX, localY);
}
