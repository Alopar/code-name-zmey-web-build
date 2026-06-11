import { getBool, setBool } from "../core/PlayerPrefs.js";
import { emit, on } from "../core/EventBus.js";

const PREF_KEY = "debug.enabled";

export const DebugEvents = Object.freeze({
  SETTINGS_CHANGED: "debug:settings-changed",
});

/** @type {{ enabled: boolean }} */
const settings = {
  enabled: false,
};

export function loadDebugSettings() {
  settings.enabled = getBool(PREF_KEY, false);
}

export function getDebugSettings() {
  return settings;
}

export function isDebugEnabled() {
  return settings.enabled;
}

/**
 * @param {boolean} enabled
 */
export function setDebugEnabled(enabled) {
  if (settings.enabled === enabled) {
    return;
  }

  settings.enabled = enabled;
  setBool(PREF_KEY, enabled);
  emit(DebugEvents.SETTINGS_CHANGED, { ...settings });
}

/**
 * @param {(detail: typeof settings) => void} handler
 * @returns {() => void}
 */
export function onDebugSettingsChanged(handler) {
  return on(DebugEvents.SETTINGS_CHANGED, handler);
}
