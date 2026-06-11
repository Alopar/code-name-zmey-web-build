/** Браузерные действия, не относящиеся к игровому вводу. */
const BLOCKED_DOCUMENT_EVENTS = ["dragstart", "selectstart", "copy", "cut", "paste"];

/** Pointer/mouse вне #app-viewport (letterbox, curtain, фон страницы). */
const BLOCKED_OUTSIDE_GAME_EVENTS = [
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
  "dblclick",
  "auxclick",
];

function preventBrowserAction(event) {
  event.preventDefault();
}

/** @param {EventTarget | null} target */
function isGameViewportTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  const viewport = document.getElementById("app-viewport");
  return Boolean(viewport?.contains(target));
}

function blockOutsideGamePointer(event) {
  if (isGameViewportTarget(event.target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

/**
 * Отключает браузерные действия и pointer-ввод вне #app-viewport.
 * ЛКМ, ПКМ и drag — только в игре (Phaser + .ui-hit).
 *
 * pointer-events: none на body не отключает детей с pointer-events: auto
 * (например #app-load-curtain блокирует passthrough к игре во время bootstrap).
 */
export function blockBrowserDefaultsOnPage() {
  document.addEventListener("contextmenu", preventBrowserAction, { capture: true });

  for (const type of BLOCKED_DOCUMENT_EVENTS) {
    document.addEventListener(type, preventBrowserAction);
  }

  for (const type of BLOCKED_OUTSIDE_GAME_EVENTS) {
    document.addEventListener(type, blockOutsideGamePointer, { capture: true });
  }
  const viewport = document.getElementById("app-viewport");
  if (!viewport) {
    return;
  }

  viewport.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
    if (!img.hasAttribute("alt")) {
      img.setAttribute("alt", "");
    }
  });

  viewport.querySelectorAll("[title]").forEach((el) => {
    el.removeAttribute("title");
  });
}
