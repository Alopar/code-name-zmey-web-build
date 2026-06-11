const target = new EventTarget();

export const GameEvents = Object.freeze({
  SPACE_CHANGED: "game:space-changed",
  NAVIGATE: "game:navigate",
  COMBAT_STARTED: "combat:started",
  COMBAT_STATE: "combat:state",
  COMBAT_ANIM_REQUEST: "combat:anim-request",
  COMBAT_FEEDBACK_REQUEST: "combat:feedback-request",
  COMBAT_SCREEN_FEEDBACK_REQUEST: "combat:screen-feedback-request",
  COMBAT_ENDED: "combat:ended",
  COMBAT_OUTCOME: "combat:outcome",
  MAP_NODE_SELECTED: "map:node-selected",
  MAP_STATE_CHANGED: "map:state-changed",
  HERO_STATE_CHANGED: "hero:state-changed",
  PARTY_STATE_CHANGED: "party:state-changed",
  NARRATION_ENDED: "narration:ended",
  SCENE_LOAD_OVERLAY_HIDDEN: "scene:load-overlay-hidden",
  INFO_TOAST: "ui:info-toast",
});

/**
 * @param {string} type
 * @param {unknown} [detail]
 */
export function emit(type, detail) {
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * @param {string} type
 * @param {(detail: unknown) => void} handler
 * @returns {() => void}
 */
export function on(type, handler) {
  const listener = (event) => handler(event.detail);
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
