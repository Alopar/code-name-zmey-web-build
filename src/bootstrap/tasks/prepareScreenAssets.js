const LOGO_SELECTOR = ".ui-lobby-logo";
const LOGO_SOURCE = "assets/images/logo.png";

/**
 * Подготовка DOM-ассетов screen-view для лобби (логотип и т.п.).
 * Chromakey отключён — PNG грузятся как есть (см. src/core/chromaKey.js).
 * @returns {Promise<void>}
 */
export async function prepareScreenAssets() {
  const img = document.querySelector(LOGO_SELECTOR);
  if (!img) {
    return;
  }

  img.src = LOGO_SOURCE;

  if (img.complete) {
    return;
  }

  await new Promise((resolve, reject) => {
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", () => reject(new Error(`Не удалось загрузить ${LOGO_SOURCE}`)), {
      once: true,
    });
  });
}
