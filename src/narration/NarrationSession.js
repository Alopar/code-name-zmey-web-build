/** @typedef {import("./config/storyRegistry.js").StoryConfig} StoryConfig */

/**
 * @typedef {object} NarrationSessionPayload
 * @property {string} storyId
 * @property {string} returnSpace
 * @property {string | null} exitSpaceOverride
 * @property {"return" | null} exitModeOverride
 */

/** @type {NarrationSessionPayload | null} */
let pendingPayload = null;

/** @type {NarrationSessionPayload | null} */
let activePayload = null;

/**
 * @param {string} storyId
 * @param {{ returnSpace: string, exitSpace?: string | null, exit?: "return" | null }} options
 */
export function begin(storyId, options) {
  pendingPayload = {
    storyId,
    returnSpace: options.returnSpace,
    exitSpaceOverride: options.exitSpace ?? null,
    exitModeOverride: options.exit === "return" ? "return" : null,
  };
}

/**
 * @returns {NarrationSessionPayload | null}
 */
export function consume() {
  activePayload = pendingPayload;
  pendingPayload = null;
  return activePayload;
}

/**
 * @returns {NarrationSessionPayload | null}
 */
export function getActive() {
  return activePayload;
}

export function clear() {
  pendingPayload = null;
  activePayload = null;
}
