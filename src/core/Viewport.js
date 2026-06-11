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

  const scale = Math.min(
    window.innerWidth / VIEWPORT_WIDTH,
    window.innerHeight / VIEWPORT_HEIGHT,
  );

  viewport.style.transform = `scale(${scale})`;
}
