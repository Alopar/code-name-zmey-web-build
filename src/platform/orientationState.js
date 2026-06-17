/** @typedef {"portrait" | "landscape"} ScreenOrientationMode */

/**
 * @returns {ScreenOrientationMode}
 */
export function getScreenOrientationMode() {
  if (window.matchMedia("(orientation: portrait)").matches) {
    return "portrait";
  }

  if (window.matchMedia("(orientation: landscape)").matches) {
    return "landscape";
  }

  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
}

/** @returns {boolean} */
export function isPortraitOrientation() {
  return getScreenOrientationMode() === "portrait";
}

/** @returns {boolean} */
export function isLandscapeOrientation() {
  return getScreenOrientationMode() === "landscape";
}

/**
 * @param {() => void} handler
 * @returns {() => void}
 */
export function onOrientationLayoutChange(handler) {
  const wrapped = () => {
    handler();
  };

  window.addEventListener("resize", wrapped);
  window.addEventListener("orientationchange", wrapped);
  window.visualViewport?.addEventListener("resize", wrapped);

  return () => {
    window.removeEventListener("resize", wrapped);
    window.removeEventListener("orientationchange", wrapped);
    window.visualViewport?.removeEventListener("resize", wrapped);
  };
}
