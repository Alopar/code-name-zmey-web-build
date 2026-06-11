/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

const SHAKE_OFFSET_X = 11;
const SHAKE_OFFSET_Y = 0;
const SHAKE_DURATION = 42;
const SHAKE_REPEATS = 4;

/**
 * Лёгкий шейк view-группы (по умолчанию — горизонтальный). Pivot не двигается.
 * @param {FeedbackContext} ctx
 * @param {{ offsetX?: number, offsetY?: number, duration?: number, repeats?: number }} [options]
 * @returns {(done: () => void) => void}
 */
export function createShakeEffect(ctx, options = {}) {
  const offsetX = options.offsetX ?? SHAKE_OFFSET_X;
  const offsetY = options.offsetY ?? SHAKE_OFFSET_Y;
  const duration = options.duration ?? SHAKE_DURATION;
  const repeats = options.repeats ?? SHAKE_REPEATS;
  const { scene, view } = ctx;

  return (done) => {
    if (!view?.active) {
      done();
      return;
    }

    const originX = view.x;
    const originY = view.y;

    scene.tweens.add({
      targets: view,
      x: originX + offsetX,
      y: originY + offsetY,
      duration,
      yoyo: true,
      repeat: repeats,
      ease: "Sine.easeInOut",
      onComplete: () => {
        view.x = originX;
        view.y = originY;
        done();
      },
    });
  };
}
