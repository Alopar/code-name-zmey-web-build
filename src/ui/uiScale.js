import { getUiScale, onUserSettingsChanged } from "../settings/UserSettings.js";

/** @type {readonly ["100%", "150%", "200%"]} */
export const UI_SCALE_LABELS = Object.freeze(["100%", "150%", "200%"]);

/**
 * @param {number} scale
 */
export function applyDomUiScale(scale) {
  const viewport = document.getElementById("app-viewport");
  if (!viewport) {
    return;
  }

  viewport.style.setProperty("--ui-scale", String(scale));
}

function syncDomUiScale() {
  applyDomUiScale(getUiScale());
}

export function initUiScale() {
  onUserSettingsChanged(syncDomUiScale);
  syncDomUiScale();
}
