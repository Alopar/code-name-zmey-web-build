import Phaser from "phaser";

/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

const DEFAULT_PULSES = 1;
const PULSE_ON_MS = 80;
const PULSE_OFF_MS = 60;
/** Пиковая сила белой подсветки (0–1) в режиме TintModes.ADD. */
const PEAK_INTENSITY = 0.35;

/**
 * @param {Phaser.GameObjects.Sprite} sprite
 * @param {number} intensity 0–1
 */
function applySoftWhiteTint(sprite, intensity) {
  if (intensity <= 0.001) {
    sprite.clearTint();
    return;
  }

  const channel = Math.round(255 * intensity);
  sprite
    .setTint(Phaser.Display.Color.GetColor(channel, channel, channel))
    .setTintMode(Phaser.TintModes.ADD);
}

/**
 * Мягкая белая подсветка спрайта (подсказка взаимодействия, не урон).
 * @param {FeedbackContext} ctx
 * @param {{ pulses?: number }} [options]
 * @returns {(done: () => void) => void}
 */
export function createSoftWhiteBlinkEffect(ctx, options = {}) {
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

      const intensity = step % 2 === 0 ? PEAK_INTENSITY : 0;
      applySoftWhiteTint(sprite, intensity);
      step += 1;
      scene.time.delayedCall(step % 2 === 1 ? PULSE_ON_MS : PULSE_OFF_MS, tick);
    };

    tick();
  };
}
