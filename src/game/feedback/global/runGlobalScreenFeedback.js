/** @typedef {import("./GlobalScreenFeedback.js").GlobalScreenFeedback} GlobalScreenFeedback */

/** @type {Readonly<Record<string, (feedback: GlobalScreenFeedback, options?: object) => void>>} */
export const GLOBAL_SCREEN_EFFECTS = Object.freeze({
  cameraShake: (feedback, options = {}) => {
    feedback.shake(options);
  },
  flash: (feedback, options = {}) => {
    feedback.flash(options);
  },
  darken: (feedback, options = {}) => {
    feedback.darken(options);
  },
  redVignette: (feedback, options = {}) => {
    const intensity = typeof options.intensity === "number" ? options.intensity : 0.5;
    const durationMs = typeof options.durationMs === "number" ? options.durationMs : 400;
    feedback.setRedVignetteIntensity(intensity, durationMs);
  },
});

/**
 * @param {GlobalScreenFeedback} feedback
 * @param {string[]} effectNames
 * @param {Record<string, object>} [effectOptions]
 */
export function runGlobalScreenFeedback(feedback, effectNames, effectOptions = {}) {
  if (!feedback) {
    return;
  }

  for (const name of effectNames) {
    const run = GLOBAL_SCREEN_EFFECTS[name];
    if (!run) {
      console.warn("[GlobalScreenFeedback] Неизвестный эффект:", name);
      continue;
    }
    run(feedback, effectOptions[name] ?? {});
  }
}
