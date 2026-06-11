/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

const DEFAULT_PULSES = 3;
const PULSE_ON_MS = 55;
const PULSE_OFF_MS = 50;
const HIT_TINT = 0xff4444;

/**
 * Красный блинк по tint спрайта.
 * @param {FeedbackContext} ctx
 * @param {{ pulses?: number }} [options]
 * @returns {(done: () => void) => void}
 */
export function createRedBlinkEffect(ctx, options = {}) {
  const pulses = options.pulses ?? DEFAULT_PULSES;
  const { scene, sprite } = ctx;

  return (done) => {
    if (!sprite?.active) {
      done();
      return;
    }

    let step = 0;
    const totalSteps = pulses * 2;

    const tick = () => {
      if (!sprite.active) {
        sprite.clearTint();
        done();
        return;
      }

      if (step >= totalSteps) {
        sprite.clearTint();
        done();
        return;
      }

      sprite.setTint(step % 2 === 0 ? HIT_TINT : 0xffffff);
      step += 1;
      scene.time.delayedCall(step % 2 === 1 ? PULSE_ON_MS : PULSE_OFF_MS, tick);
    };

    tick();
  };
}
