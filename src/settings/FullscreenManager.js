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
    void requestAppFullscreen();
    return;
  }

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
