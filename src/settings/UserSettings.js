import { getAudioManager } from "../audio/AudioManager.js";
import {
  getBool,
  getFloat,
  getInt,
  hasPref,
  setBool,
  setFloat,
  setInt,
} from "../core/PlayerPrefs.js";
import { emit, on } from "../core/EventBus.js";
import { isPhone } from "../platform/deviceProfile.js";
import { applyFullscreenPreference } from "./FullscreenManager.js";

const LEGACY_STORAGE_KEY = "zmey-user-settings";

const PREF_KEYS = Object.freeze({
  master: "audio.master",
  music: "audio.music",
  sfx: "audio.sfx",
  ambient: "audio.ambient",
  fullscreen: "screen.fullscreen",
  uiScaleTier: "screen.uiScaleTier",
  lobbyAnimated: "lobby.animated",
});

/** @type {readonly [1, 1.5, 2]} */
export const UI_SCALE_TIERS = Object.freeze([1, 1.5, 2]);

export const UserSettingsEvents = Object.freeze({
  CHANGED: "user-settings:changed",
});

/** @typedef {"master" | "music" | "sfx" | "ambient"} VolumeCategory */

/** @typedef {0 | 1 | 2} UiScaleTier */

/** UI scale 150% — дефолт для телефонов при первом запуске. */
const MOBILE_DEFAULT_UI_SCALE_TIER = /** @type {UiScaleTier} */ (1);

/** @typedef {{ master: number, music: number, sfx: number, ambient: number, fullscreen: boolean, uiScaleTier: UiScaleTier, lobbyAnimated: boolean }} UserSettingsState */

/** @type {UserSettingsState} */
const DEFAULTS = Object.freeze({
  master: 1,
  music: 0.7,
  sfx: 1,
  ambient: 0.5,
  fullscreen: false,
  uiScaleTier: 0,
  lobbyAnimated: true,
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
 * @param {unknown} value
 * @returns {UiScaleTier}
 */
function clampUiScaleTier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return /** @type {UiScaleTier} */ (Math.max(0, Math.min(2, Math.round(numeric))));
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
    uiScaleTier: clampUiScaleTier(
      /** @type {Record<string, unknown>} */ (source).uiScaleTier ?? DEFAULTS.uiScaleTier,
    ),
    lobbyAnimated: /** @type {Record<string, unknown>} */ (source).lobbyAnimated !== false,
  };
}

function persistVolume(category) {
  setFloat(PREF_KEYS[category], settings[category]);
}

function persistFullscreen() {
  setBool(PREF_KEYS.fullscreen, settings.fullscreen);
}

function persistLobbyAnimated() {
  setBool(PREF_KEYS.lobbyAnimated, settings.lobbyAnimated);
}

function persistUiScaleTier() {
  setInt(PREF_KEYS.uiScaleTier, settings.uiScaleTier);
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
  settings.uiScaleTier = clampUiScaleTier(getInt(PREF_KEYS.uiScaleTier, DEFAULTS.uiScaleTier));
  settings.lobbyAnimated = getBool(PREF_KEYS.lobbyAnimated, DEFAULTS.lobbyAnimated);
}

function applyDeviceDefaults() {
  if (isPhone() && !hasPref(PREF_KEYS.uiScaleTier)) {
    settings.uiScaleTier = MOBILE_DEFAULT_UI_SCALE_TIER;
    persistUiScaleTier();
  }
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
    if (!hasPref(PREF_KEYS.lobbyAnimated)) {
      setBool(PREF_KEYS.lobbyAnimated, legacy.lobbyAnimated);
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

/**
 * @returns {number}
 */
export function getUiScale() {
  return UI_SCALE_TIERS[settings.uiScaleTier] ?? UI_SCALE_TIERS[0];
}

export function loadUserSettings() {
  migrateLegacySettings();
  loadFromPrefs();
  applyDeviceDefaults();
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
  settings.uiScaleTier = isPhone() ? MOBILE_DEFAULT_UI_SCALE_TIER : DEFAULTS.uiScaleTier;
  settings.lobbyAnimated = DEFAULTS.lobbyAnimated;

  persistVolume("master");
  persistVolume("music");
  persistVolume("sfx");
  persistVolume("ambient");
  persistFullscreen();
  persistUiScaleTier();
  persistLobbyAnimated();
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
 * @param {boolean} enabled
 */
export function setUserLobbyAnimated(enabled) {
  if (settings.lobbyAnimated === enabled) {
    return;
  }

  settings.lobbyAnimated = enabled;
  persistLobbyAnimated();
  emitChanged();
}

/**
 * @param {number} tier
 */
export function setUserUiScaleTier(tier) {
  const next = clampUiScaleTier(tier);
  if (settings.uiScaleTier === next) {
    return;
  }

  settings.uiScaleTier = next;
  persistUiScaleTier();
  emitChanged();
}

/**
 * @param {(detail: UserSettingsState) => void} handler
 * @returns {() => void}
 */
export function onUserSettingsChanged(handler) {
  return on(UserSettingsEvents.CHANGED, handler);
}
