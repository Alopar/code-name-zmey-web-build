import {
  tryLockLandscapeOrientation,
  tryUnlockOrientation,
} from "../wrapper/orientationLock.js";

/** @type {(() => void) | null} */
let removeDeferredFullscreenListeners = null;

function clearDeferredFullscreen() {
  removeDeferredFullscreenListeners?.();
  removeDeferredFullscreenListeners = null;
}

/**
 * Браузер разрешает fullscreen только после жеста пользователя.
 */
function bindDeferredFullscreen() {
  if (removeDeferredFullscreenListeners) {
    return;
  }

  const tryEnter = () => {
    clearDeferredFullscreen();
    void requestAppFullscreen();
  };

  const options = { capture: true, once: true };
  window.addEventListener("pointerdown", tryEnter, options);
  window.addEventListener("keydown", tryEnter, options);

  removeDeferredFullscreenListeners = () => {
    window.removeEventListener("pointerdown", tryEnter, options);
    window.removeEventListener("keydown", tryEnter, options);
  };
}

/** @returns {boolean} */
export function isAppFullscreen() {
  return Boolean(document.fullscreenElement);
}

/**
 * @returns {Promise<boolean>}
 */
export async function requestAppFullscreen() {
  if (isAppFullscreen()) {
    return true;
  }

  try {
    await document.documentElement.requestFullscreen();
    await tryLockLandscapeOrientation();
    return true;
  } catch (error) {
    console.warn("[FullscreenManager] Не удалось включить полноэкранный режим:", error);
    return false;
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function exitAppFullscreen() {
  if (!isAppFullscreen()) {
    return true;
  }

  try {
    await document.exitFullscreen();
    await tryUnlockOrientation();
    return true;
  } catch (error) {
    console.warn("[FullscreenManager] Не удалось выйти из полноэкранного режима:", error);
    return false;
  }
}

/**
 * @param {boolean} enabled
 */
export function applyFullscreenPreference(enabled) {
  if (enabled) {
    void requestAppFullscreen().then((ok) => {
      if (!ok) {
        bindDeferredFullscreen();
      }
    });
    return;
  }

  clearDeferredFullscreen();
  void exitAppFullscreen();
}

/**
 * @param {(enabled: boolean) => void} handler
 * @returns {() => void}
 */
export function onFullscreenChange(handler) {
  const listener = () => {
    handler(isAppFullscreen());
  };

  document.addEventListener("fullscreenchange", listener);
  return () => document.removeEventListener("fullscreenchange", listener);
}
