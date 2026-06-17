import { updateViewportScale } from "../core/Viewport.js";
import { isPhone } from "../platform/deviceProfile.js";
import { onOrientationLayoutChange } from "../platform/orientationState.js";
import {
  initPortraitOrientationOverlay,
  syncPortraitOverlay,
} from "./portraitOrientationOverlay.js";

function handleMobileLayoutChange() {
  updateViewportScale();
  syncPortraitOverlay();
}

/**
 * Мобильная обёртка приложения: портретный оверлей и пересчёт viewport при смене ориентации.
 * Вызывается после снятия app load curtain.
 */
export function initMobileAppWrapper() {
  if (!isPhone()) {
    return;
  }

  initPortraitOrientationOverlay();
  handleMobileLayoutChange();
  onOrientationLayoutChange(handleMobileLayoutChange);
}
