/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

import { spawnFloatingText } from "../floatingText/spawnFloatingText.js";
import { resolveTextFeedbackWorldPosition } from "../worldCoords.js";

const DEFAULT_PRESET = "damage";

/**
 * Плавающая подпись над целью (fire-and-forget).
 * @param {FeedbackContext} ctx
 * @param {{
 *   anchor?: { spawnOffsetX?: number, spawnOffsetY?: number },
 *   preset?: string,
 *   value?: number,
 *   damage?: number,
 *   text?: string,
 *   format?: string,
 *   color?: string,
 *   fontFamily?: string,
 *   fontSize?: number,
 *   fontStyle?: string,
 *   stroke?: string,
 *   strokeThickness?: number,
 *   floatDistance?: number,
 *   durationMs?: number,
 *   ease?: string,
 *   scaleFrom?: number,
 *   scaleTo?: number,
 * }} [options]
 * @returns {(done: () => void) => void}
 */
export function createFloatingTextEffect(ctx, options = {}) {
  const preset = options.preset ?? DEFAULT_PRESET;
  const value = options.value ?? options.damage;

  return (done) => {
    const world = resolveTextFeedbackWorldPosition(ctx, options.anchor);

    if (!world) {
      done();
      return;
    }

    spawnFloatingText(ctx.scene, {
      x: world.x,
      y: world.y,
      preset,
      value,
      text: options.text,
      format: options.format,
      color: options.color,
      fontFamily: options.fontFamily,
      fontSize: options.fontSize,
      fontStyle: options.fontStyle,
      stroke: options.stroke,
      strokeThickness: options.strokeThickness,
      floatDistance: options.floatDistance,
      durationMs: options.durationMs,
      ease: options.ease,
      scaleFrom: options.scaleFrom,
      scaleTo: options.scaleTo,
    });

    done();
  };
}
