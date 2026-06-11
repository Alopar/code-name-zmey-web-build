/** @typedef {import("../feedbackContext.js").FeedbackContext} FeedbackContext */

import Phaser from "phaser";
import { combatEntityFeedbackDepth } from "../../combatWorldDepth.js";
import { FEEDBACK_TEXTURE_KEYS, registerFeedbackTextures } from "../particles/registerFeedbackTextures.js";
import { containerLocalToWorld } from "../worldCoords.js";

const DEFAULT_COUNT = 12;
const DEFAULT_SPAWN_OFFSET_X = 0;
const DEFAULT_SPAWN_OFFSET_Y = 280;
const DEFAULT_JITTER_RADIUS = 36;
const MAX_LIFESPAN_MS = 520;

/**
 * Кровавые капли — burst в мировых координатах, поверх врага.
 * @param {FeedbackContext} ctx
 * @param {{
 *   count?: number,
 *   spawnOffsetX?: number,
 *   spawnOffsetY?: number,
 *   jitterRadius?: number,
 * }} [options]
 * @returns {(done: () => void) => void}
 */
export function createBloodSplashEffect(ctx, options = {}) {
  const count = options.count ?? DEFAULT_COUNT;
  const spawnOffsetX = options.spawnOffsetX ?? DEFAULT_SPAWN_OFFSET_X;
  const spawnOffsetY = options.spawnOffsetY ?? DEFAULT_SPAWN_OFFSET_Y;
  const jitterRadius = options.jitterRadius ?? DEFAULT_JITTER_RADIUS;

  return (done) => {
    const { scene, sprite, pivot, view } = ctx;

    if (!sprite?.active || !pivot?.active) {
      done();
      return;
    }

    registerFeedbackTextures(scene);

    const textureKey = FEEDBACK_TEXTURE_KEYS.BLOOD_DROP;
    if (!scene.textures.exists(textureKey)) {
      done();
      return;
    }

    const baseScale = sprite.scaleX;
    const centerLocalX = spawnOffsetX * baseScale;
    const centerLocalY = -spawnOffsetY * baseScale;
    const jitterScaled = jitterRadius * baseScale;

    const localX = centerLocalX + Phaser.Math.Between(-jitterScaled, jitterScaled);
    const localY =
      centerLocalY + Phaser.Math.Between(-jitterScaled * 0.55, jitterScaled * 0.35);
    const world = containerLocalToWorld(pivot, (view?.x ?? 0) + localX, (view?.y ?? 0) + localY);

    const emitter = scene.add.particles(world.x, world.y, textureKey, {
      lifespan: { min: 220, max: MAX_LIFESPAN_MS },
      speed: { min: 120, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0.25, random: true },
      alpha: { start: 1, end: 0 },
      gravityY: 420,
      tint: 0xff3333,
      emitting: false,
      particleBringToTop: true,
      blendMode: Phaser.BlendModes.NORMAL,
    });

    emitter.setDepth(combatEntityFeedbackDepth(pivot));

    emitter.explode(count);

    scene.time.delayedCall(MAX_LIFESPAN_MS + 120, () => {
      if (emitter.active) {
        emitter.destroy();
      }
      done();
    });
  };
}
