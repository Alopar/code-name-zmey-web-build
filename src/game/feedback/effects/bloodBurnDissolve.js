/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

import {
  attachBloodBurnDissolveFilter,
  detachBloodBurnDissolveFilter,
} from "../filters/bloodBurnDissolveFilter.js";

const DEFAULT_DURATION_MS = 920;

/**
 * Кровавое растворение врага (dissolve/burn через красный шейдер).
 * @param {FeedbackContext} ctx
 * @param {{ durationMs?: number }} [options]
 * @returns {(done: () => void) => void}
 */
export function createBloodBurnDissolveEffect(ctx, options = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  return (done) => {
    const { scene, sprite } = ctx;

    if (!sprite?.active) {
      done();
      return;
    }

    const controller = attachBloodBurnDissolveFilter(sprite);

    if (!controller) {
      runDissolveFallback(scene, sprite, durationMs, done);
      return;
    }

    controller.progress = 0;
    controller.time = 0;

    const state = { progress: 0, time: 0 };

    const tick = () => {
      if (!sprite.active) {
        return;
      }
      controller.progress = state.progress;
      controller.time = state.time;
    };

    scene.events.on("update", tick);

    scene.tweens.add({
      targets: state,
      progress: 1,
      time: durationMs / 1000 + 0.35,
      duration: durationMs,
      ease: "Power4.easeIn",
      onUpdate: tick,
      onComplete: () => {
        scene.events.off("update", tick);
        if (sprite.active) {
          sprite.alpha = 0;
          detachBloodBurnDissolveFilter(sprite, controller);
        }
        done();
      },
    });
  };
}

/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} sprite
 * @param {number} durationMs
 * @param {() => void} done
 */
function runDissolveFallback(scene, sprite, durationMs, done) {
  const startTint = sprite.tintTopLeft;

  scene.tweens.add({
    targets: sprite,
    alpha: 0,
    duration: durationMs,
    ease: "Power4.easeIn",
    onUpdate: () => {
      if (sprite.active) {
        sprite.setTint(0xff2208);
      }
    },
    onComplete: () => {
      if (sprite.active) {
        sprite.clearTint();
        sprite.setTint(startTint);
      }
      done();
    },
  });
}
