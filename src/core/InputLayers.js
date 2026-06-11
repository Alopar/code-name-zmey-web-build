/**
 * Политика ввода на странице:
 *
 * - Letterbox и фон: pointer-events отключены (CSS + capture-блок в blockBrowserDefaults).
 * - #app-load-curtain (вне viewport): только bootstrap; ввод блокируется в JS.
 * - #scene-load-overlay (z-index 10, внутри viewport): in-game загрузка сцен;
 *   перекрывает world-view и screen-view, блокирует ввод при переходах.
 * - #modal-root (z-index 8, внутри viewport): модальные окна поверх HUD;
 *   блокирует world-view и Phaser input (game.input.enabled), пока is-active.
 * - #app-viewport: единственная игровая зона pointer-ввода после bootstrap.
 * - world-view (canvas / Phaser): ЛКМ, ПКМ, колесо, drag.
 * - screen-view: только интерактивные DOM-элементы (.ui-hit); пустые зоны — в world-view.
 * - Выделение текста, контекстное меню и HTML-drag отключены на всей странице.
 */

/**
 * Проверяет, что слои настроены для игрового ввода (dev-assert).
 */
export function assertInputLayersReady() {
  const worldView = document.getElementById("world-view");
  const screenView = document.getElementById("screen-view");
  const appRoot = document.getElementById("app-root");
  const viewport = document.getElementById("app-viewport");
  const sceneLoadOverlay = document.getElementById("scene-load-overlay");

  if (!worldView || !screenView) {
    console.warn("[InputLayers] Не найдены #world-view или #screen-view");
    return;
  }

  if (appRoot && getComputedStyle(appRoot).pointerEvents !== "none") {
    console.warn("[InputLayers] #app-root должен иметь pointer-events: none");
  }

  if (viewport && getComputedStyle(viewport).pointerEvents !== "auto") {
    console.warn("[InputLayers] #app-viewport должен иметь pointer-events: auto");
  }

  if (sceneLoadOverlay && getComputedStyle(sceneLoadOverlay).pointerEvents !== "none") {
    const active = sceneLoadOverlay.classList.contains("is-active");
    if (!active) {
      console.warn("[InputLayers] #scene-load-overlay должен иметь pointer-events: none в покое");
    }
  }

  const canvas = worldView.querySelector("canvas");
  if (canvas) {
    const style = getComputedStyle(canvas);
    if (style.pointerEvents === "none") {
      console.warn("[InputLayers] Canvas world-view не принимает pointer-events");
    }
  }
}
