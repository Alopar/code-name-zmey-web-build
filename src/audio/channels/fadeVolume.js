import { delay } from "../../combat/delay.js";

/**
 * @param {Phaser.Sound.BaseSound | null | undefined} sound
 * @param {number} from
 * @param {number} to
 * @param {number} durationMs
 */
export async function fadeSoundVolume(sound, from, to, durationMs) {
  if (!sound || durationMs <= 0) {
    if (sound) {
      sound.setVolume(to);
    }
    return;
  }

  const steps = Math.max(1, Math.ceil(durationMs / 40));
  const stepMs = durationMs / steps;

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    sound.setVolume(from + (to - from) * t);
    if (step < steps) {
      await delay(stepMs);
    }
  }
}
