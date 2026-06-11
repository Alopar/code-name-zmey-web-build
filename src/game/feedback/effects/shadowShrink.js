/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

const DEFAULT_DURATION_MS = 920;

/**
 * Плавное сжатие и затухание тени врага во время смерти.
 * @param {FeedbackContext} ctx
 * @param {{ durationMs?: number }} [options]
 * @returns {(done: () => void) => void}
 */
export function createShadowShrinkEffect(ctx, options = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  return (done) => {
    const { scene, shadow } = ctx;

    if (!shadow?.active) {
      done();
      return;
    }

    const startScaleX = shadow.scaleX;
    const startScaleY = shadow.scaleY;
    const startAlpha = shadow.alpha;

    scene.tweens.add({
      targets: shadow,
      scaleX: startScaleX * 0.15,
      scaleY: startScaleY * 0.15,
      alpha: 0,
      duration: durationMs,
      ease: "Cubic.easeIn",
      onComplete: () => {
        done();
      },
    });
  };
}
