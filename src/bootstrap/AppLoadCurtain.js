const CURTAIN_ID = "app-load-curtain";

/** @returns {HTMLElement | null} */
function getElement() {
  return document.getElementById(CURTAIN_ID);
}

/**
 * Снимает шторку загрузки приложения. Вызывается один раз после bootstrap.
 * Повторный показ не предусмотрен — curtain только для старта приложения.
 */
export function dismissAppLoadCurtain() {
  const el = getElement();
  if (!el || el.classList.contains("is-dismissed")) {
    return;
  }

  el.classList.add("is-dismissed");
  el.setAttribute("aria-busy", "false");
  el.setAttribute("aria-hidden", "true");
}
