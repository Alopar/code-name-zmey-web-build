const KEY_PREFIX = "zmey.pref.";

/** @type {Map<string, string> | null} */
let memoryFallback = null;

/**
 * @returns {boolean}
 */
function canUseLocalStorage() {
  try {
    const probe = `${KEY_PREFIX}__probe__`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = canUseLocalStorage();

/**
 * @returns {Map<string, string>}
 */
function getMemoryFallback() {
  if (!memoryFallback) {
    memoryFallback = new Map();
  }
  return memoryFallback;
}

/**
 * @param {string} key
 * @returns {string}
 */
function storageKey(key) {
  return `${KEY_PREFIX}${key}`;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function hasPref(key) {
  const fullKey = storageKey(key);
  if (storageAvailable) {
    return localStorage.getItem(fullKey) !== null;
  }
  return getMemoryFallback().has(fullKey);
}

/**
 * @param {string} key
 */
export function deletePref(key) {
  const fullKey = storageKey(key);
  if (storageAvailable) {
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn(`[PlayerPrefs] Не удалось удалить «${key}»:`, error);
    }
    return;
  }
  getMemoryFallback().delete(fullKey);
}

/**
 * @param {string} key
 * @param {string} value
 */
export function setString(key, value) {
  const fullKey = storageKey(key);
  if (storageAvailable) {
    try {
      localStorage.setItem(fullKey, value);
    } catch (error) {
      console.warn(`[PlayerPrefs] Не удалось сохранить «${key}»:`, error);
    }
    return;
  }
  getMemoryFallback().set(fullKey, value);
}

/**
 * @param {string} key
 * @param {string} [defaultValue]
 * @returns {string}
 */
export function getString(key, defaultValue = "") {
  const fullKey = storageKey(key);
  const raw = storageAvailable
    ? localStorage.getItem(fullKey)
    : getMemoryFallback().get(fullKey);

  return raw === null || raw === undefined ? defaultValue : raw;
}

/**
 * @param {string} key
 * @param {number} value
 */
export function setFloat(key, value) {
  setString(key, String(value));
}

/**
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getFloat(key, defaultValue) {
  const raw = getString(key, "");
  if (raw === "") {
    return defaultValue;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : defaultValue;
}

/**
 * @param {string} key
 * @param {number} value
 */
export function setInt(key, value) {
  setString(key, String(Math.trunc(value)));
}

/**
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getInt(key, defaultValue) {
  const raw = getString(key, "");
  if (raw === "") {
    return defaultValue;
  }

  const numeric = Number.parseInt(raw, 10);
  return Number.isFinite(numeric) ? numeric : defaultValue;
}

/**
 * @param {string} key
 * @param {boolean} value
 */
export function setBool(key, value) {
  setString(key, value ? "1" : "0");
}

/**
 * @param {string} key
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
export function getBool(key, defaultValue) {
  const raw = getString(key, "");
  if (raw === "") {
    return defaultValue;
  }
  return raw === "1" || raw === "true";
}
