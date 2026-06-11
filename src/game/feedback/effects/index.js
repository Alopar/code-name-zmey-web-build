import { createBloodBurnDissolveEffect } from "./bloodBurnDissolve.js";
import { createBloodBurstLoopEffect } from "./bloodBurstLoop.js";
import { createBloodSplashEffect } from "./bloodSplash.js";
import { createFloatingTextEffect } from "./floatingText.js";
import { createRedBlinkEffect } from "./redBlink.js";
import { createShadowShrinkEffect } from "./shadowShrink.js";
import { createShakeEffect } from "./shake.js";
import { createSoftWhiteBlinkEffect } from "./softWhiteBlink.js";

/** @type {Readonly<Record<string, (ctx: import("../feedbackContext.js").FeedbackContext, options?: object) => (done: () => void) => void>>} */
export const FEEDBACK_EFFECTS = Object.freeze({
  redBlink: createRedBlinkEffect,
  softWhiteBlink: createSoftWhiteBlinkEffect,
  shake: createShakeEffect,
  bloodSplash: createBloodSplashEffect,
  floatingText: createFloatingTextEffect,
  bloodBurnDissolve: createBloodBurnDissolveEffect,
  shadowShrink: createShadowShrinkEffect,
  bloodBurstLoop: createBloodBurstLoopEffect,
});

/**
 * @param {string} name
 * @param {import("../feedbackContext.js").FeedbackContext} ctx
 * @param {Record<string, object>} [effectOptions]
 * @returns {((done: () => void) => void) | null}
 */
export function createEffectRunner(name, ctx, effectOptions = {}) {
  const factory = FEEDBACK_EFFECTS[name];
  if (!factory) {
    console.warn("[Feedback] Неизвестный эффект:", name);
    return null;
  }
  return factory(ctx, effectOptions[name] ?? {});
}
