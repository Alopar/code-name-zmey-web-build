import { getAudioManager } from "../audio/AudioManager.js";
import {
  getBool,
  getFloat,
  hasPref,
  setBool,
  setFloat,
} from "../core/PlayerPrefs.js";
import { emit, on } from "../core/EventBus.js";
import { applyFullscreenPreference } from "./FullscreenManager.js";

const LEGACY_STORAGE_KEY = "zmey-user-settings";

const PREF_KEYS = Object.freeze({
  master: "audio.master",
  music: "audio.music",
  sfx: "audio.sfx",
  ambient: "audio.ambient",
  fullscreen: "screen.fullscreen",
});

export const UserSettingsEvents = Object.freeze({
  CHANGED: "user-settings:changed",
});

/** @typedef {"master" | "music" | "sfx" | "ambient"} VolumeCategory */

/** @typedef {{ master: number, music: number, sfx: number, ambient: number, fullscreen: boolean }} UserSettingsState */

/** @type {UserSettingsState} */
const DEFAULTS = Object.freeze({
  master: 1,
  music: 0.7,
  sfx: 1,
  ambient: 0.5,
  fullscreen: false,
});

/** @type {UserSettingsState} */
const settings = { ...DEFAULTS };

/**
 * @param {unknown} value
 * @returns {number}
 */
function clampVolume(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

/**
 * @param {unknown} raw
 * @returns {UserSettingsState}
 */
function normalizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  return {
    master: clampVolume(/** @type {Record<string, unknown>} */ (source).master ?? DEFAULTS.master),
    music: clampVolume(/** @type {Record<string, unknown>} */ (source).music ?? DEFAULTS.music),
    sfx: clampVolume(/** @type {Record<string, unknown>} */ (source).sfx ?? DEFAULTS.sfx),
    ambient: clampVolume(/** @type {Record<string, unknown>} */ (source).ambient ?? DEFAULTS.ambient),
    fullscreen: Boolean(/** @type {Record<string, unknown>} */ (source).fullscreen),
  };
}

function persistVolume(category) {
  setFloat(PREF_KEYS[category], settings[category]);
}

function persistFullscreen() {
  setBool(PREF_KEYS.fullscreen, settings.fullscreen);
}

function emitChanged() {
  emit(UserSettingsEvents.CHANGED, { ...settings });
}

function loadFromPrefs() {
  settings.master = clampVolume(getFloat(PREF_KEYS.master, DEFAULTS.master));
  settings.music = clampVolume(getFloat(PREF_KEYS.music, DEFAULTS.music));
  settings.sfx = clampVolume(getFloat(PREF_KEYS.sfx, DEFAULTS.sfx));
  settings.ambient = clampVolume(getFloat(PREF_KEYS.ambient, DEFAULTS.ambient));
  settings.fullscreen = getBool(PREF_KEYS.fullscreen, DEFAULTS.fullscreen);
}

function migrateLegacySettings() {
  if (!storageAvailableLegacy()) {
    return;
  }

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const legacy = normalizeSettings(JSON.parse(raw));

    if (!hasPref(PREF_KEYS.master)) {
      setFloat(PREF_KEYS.master, legacy.master);
    }
    if (!hasPref(PREF_KEYS.music)) {
      setFloat(PREF_KEYS.music, legacy.music);
    }
    if (!hasPref(PREF_KEYS.sfx)) {
      setFloat(PREF_KEYS.sfx, legacy.sfx);
    }
    if (!hasPref(PREF_KEYS.ambient)) {
      setFloat(PREF_KEYS.ambient, legacy.ambient);
    }
    if (!hasPref(PREF_KEYS.fullscreen)) {
      setBool(PREF_KEYS.fullscreen, legacy.fullscreen);
    }

    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.warn("[UserSettings] Не удалось мигрировать старые настройки:", error);
  }
}

/**
 * @returns {boolean}
 */
function storageAvailableLegacy() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

/**
 * @returns {UserSettingsState}
 */
export function getUserSettings() {
  return { ...settings };
}

export function loadUserSettings() {
  migrateLegacySettings();
  loadFromPrefs();
}

export function applyUserSettings() {
  const audio = getAudioManager();
  if (audio) {
    audio.setVolume("master", settings.master);
    audio.setVolume("music", settings.music);
    audio.setVolume("sfx", settings.sfx);
    audio.setVolume("ambient", settings.ambient);
  }

  applyFullscreenPreference(settings.fullscreen);
  emitChanged();
}

export function resetUserSettings() {
  settings.master = DEFAULTS.master;
  settings.music = DEFAULTS.music;
  settings.sfx = DEFAULTS.sfx;
  settings.ambient = DEFAULTS.ambient;
  settings.fullscreen = DEFAULTS.fullscreen;

  persistVolume("master");
  persistVolume("music");
  persistVolume("sfx");
  persistVolume("ambient");
  persistFullscreen();
  applyUserSettings();
}

/**
 * @param {VolumeCategory} category
 * @param {number} value
 */
export function setUserVolume(category, value) {
  const next = clampVolume(value);
  if (settings[category] === next) {
    return;
  }

  settings[category] = next;
  getAudioManager()?.setVolume(category, next);
  persistVolume(category);
  emitChanged();
}

/**
 * @param {boolean} enabled
 */
export function setUserFullscreen(enabled) {
  if (settings.fullscreen === enabled) {
    return;
  }

  settings.fullscreen = enabled;
  persistFullscreen();
  emitChanged();
}

/**
 * @param {(detail: UserSettingsState) => void} handler
 * @returns {() => void}
 */
export function onUserSettingsChanged(handler) {
  return on(UserSettingsEvents.CHANGED, handler);
}
