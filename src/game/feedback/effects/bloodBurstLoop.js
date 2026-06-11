/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

import { createBloodSplashEffect } from "./bloodSplash.js";

const DEFAULT_DURATION_MS = 920;
const DEFAULT_INTERVAL_MS = 140;

/**
 * Повторяющиеся вспышки крови на протяжении смерти врага.
 * @param {FeedbackContext} ctx
 * @param {{
 *   durationMs?: number,
 *   intervalMs?: number,
 *   bloodSplash?: object,
 * }} [options]
 * @returns {(done: () => void) => void}
 */
export function createBloodBurstLoopEffect(ctx, options = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const splashOptions = options.bloodSplash ?? {};

  return (done) => {
    const { scene } = ctx;

    if (!ctx.sprite?.active) {
      done();
      return;
    }

    const runSplash = createBloodSplashEffect(ctx, splashOptions);
    runSplash(() => {});

    const timer = scene.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => {
        if (!ctx.sprite?.active) {
          return;
        }
        const burst = createBloodSplashEffect(ctx, splashOptions);
        burst(() => {});
      },
    });

    scene.time.delayedCall(durationMs, () => {
      timer.destroy();
      done();
    });
  };
}
