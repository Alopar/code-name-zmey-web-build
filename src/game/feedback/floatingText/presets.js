/** @typedef {import("./spawnFloatingText.js").FloatingTextStyle} FloatingTextStyle */

/** @type {Readonly<Record<string, FloatingTextStyle>>} */
export const FLOATING_TEXT_PRESETS = Object.freeze({
  damage: Object.freeze({
    format: "-{value} HP",
    color: "#ff4444",
    fontFamily: '"Russo One", "Arial Narrow", sans-serif',
    fontSize: 42,
    stroke: "#060804",
    strokeThickness: 4,
  }),
  heal: Object.freeze({
    format: "+{value} HP",
    color: "#6b8a42",
    fontFamily: '"Russo One", "Arial Narrow", sans-serif',
    fontSize: 42,
    stroke: "#060804",
    strokeThickness: 4,
  }),
  stun: Object.freeze({
    text: "Stun",
    color: "#e8d78a",
    fontFamily: '"Russo One", "Arial Narrow", sans-serif',
    fontSize: 38,
    stroke: "#060804",
    strokeThickness: 4,
  }),
});

/**
 * @param {string} presetName
 * @returns {FloatingTextStyle | null}
 */
export function getFloatingTextPreset(presetName) {
  return FLOATING_TEXT_PRESETS[presetName] ?? null;
}
