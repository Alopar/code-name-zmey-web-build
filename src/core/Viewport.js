/** Логическое разрешение приложения (Full HD, 16:9). */
export const VIEWPORT_WIDTH = 1920;
export const VIEWPORT_HEIGHT = 1080;
export const VIEWPORT_ASPECT = VIEWPORT_WIDTH / VIEWPORT_HEIGHT;

/**
 * Масштабирует #app-viewport под окно без искажения пропорций (letterbox внутри #app-root).
 */
export function updateViewportScale() {
  const viewport = document.getElementById("app-viewport");
  if (!viewport) {
    return;
  }

  const layoutWidth = window.visualViewport?.width ?? window.innerWidth;
  const layoutHeight = window.visualViewport?.height ?? window.innerHeight;

  const scale = Math.min(layoutWidth / VIEWPORT_WIDTH, layoutHeight / VIEWPORT_HEIGHT);

  viewport.style.transform = `scale(${scale})`;
}

/** @type {(() => void) | null} */
let removeViewportListeners = null;

/**
 * Подписывает пересчёт масштаба на resize, orientationchange и visualViewport.
 */
export function initViewportScaleListeners() {
  if (removeViewportListeners) {
    return;
  }

  const handler = () => {
    updateViewportScale();
  };

  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  window.visualViewport?.addEventListener("resize", handler);

  removeViewportListeners = () => {
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
    window.visualViewport?.removeEventListener("resize", handler);
    removeViewportListeners = null;
  };
}
