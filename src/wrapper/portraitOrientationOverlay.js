import { isPhone } from "../platform/deviceProfile.js";
import { isPortraitOrientation } from "../platform/orientationState.js";
import { applyFullscreenUserChoice } from "../ui/fullscreenControl.js";

const OVERLAY_ID = "portrait-orientation-overlay";
const BUTTON_ID = "btn-portrait-fullscreen";

/** @returns {HTMLElement | null} */
function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

/**
 * @param {boolean} visible
 */
export function setPortraitOverlayVisible(visible) {
  const overlay = getOverlay();
  if (!overlay) {
    return;
  }

  overlay.hidden = !visible;
  overlay.setAttribute("aria-hidden", String(!visible));
}

export function syncPortraitOverlay() {
  if (!isPhone()) {
    setPortraitOverlayVisible(false);
    return;
  }

  setPortraitOverlayVisible(isPortraitOrientation());
}

export function initPortraitOrientationOverlay() {
  const overlay = getOverlay();
  if (!overlay) {
    return;
  }

  if (!isPhone()) {
    setPortraitOverlayVisible(false);
    return;
  }

  document.getElementById(BUTTON_ID)?.addEventListener("click", () => {
    applyFullscreenUserChoice(true);
  });

  syncPortraitOverlay();
}
