const PHONE_MAX_SHORT_EDGE = 768;
const TABLET_MIN_SHORT_EDGE = 600;

/** @returns {boolean} */
export function isCoarsePointerDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** @returns {boolean} */
export function hasFineHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** @returns {boolean} */
export function isUaMobile() {
  const uaData = navigator.userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") {
    return uaData.mobile;
  }

  return /Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
    navigator.userAgent,
  );
}

/**
 * Эвристика «телефон»: coarse pointer или mobile UA, без fine hover desktop,
 * короткая сторона экрана и соотношение сторон (отсекаем планшеты).
 *
 * @returns {boolean}
 */
export function isPhone() {
  if (hasFineHover() && !isUaMobile()) {
    return false;
  }

  const shortEdge = Math.min(window.innerWidth, window.innerHeight);
  const longEdge = Math.max(window.innerWidth, window.innerHeight);

  if (shortEdge > PHONE_MAX_SHORT_EDGE) {
    return false;
  }

  if (longEdge / shortEdge < 1.45 && shortEdge >= TABLET_MIN_SHORT_EDGE) {
    return false;
  }

  return isCoarsePointerDevice() || isUaMobile();
}

/** @returns {boolean} */
export function isMobileWrapperTarget() {
  return isPhone();
}
