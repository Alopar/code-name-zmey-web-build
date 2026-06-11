import { emit, GameEvents } from "../core/EventBus.js";

const OVERLAY_ID = "scene-load-overlay";
const BACKDROP_SELECTOR = ".scene-load-overlay__backdrop";
export const SCENE_LOAD_OVERLAY_TRANSITION_MS = 350;

/** @returns {HTMLElement | null} */
function getElement() {
  return document.getElementById(OVERLAY_ID);
}

/** @returns {boolean} */
export function isSceneLoadOverlayVisible() {
  const el = getElement();
  return el?.classList.contains("is-visible") ?? false;
}

/**
 * @param {HTMLElement} overlay
 * @param {() => void} onDone
 */
function waitForBackdropFade(overlay, onDone) {
  const backdrop = overlay.querySelector(BACKDROP_SELECTOR);
  if (!backdrop) {
    onDone();
    return;
  }

  const finish = () => {
    backdrop.removeEventListener("transitionend", onTransitionEnd);
    onDone();
  };

  const onTransitionEnd = (event) => {
    if (event.target !== backdrop || event.propertyName !== "opacity") {
      return;
    }
    finish();
  };

  backdrop.addEventListener("transitionend", onTransitionEnd);
  window.setTimeout(finish, SCENE_LOAD_OVERLAY_TRANSITION_MS + 50);
}

/**
 * Fade-in: фон + scanlines + карточка (scale/slide). Смена сцены — после fade фона.
 * @returns {Promise<void>}
 */
export function showSceneLoadOverlay() {
  return new Promise((resolve) => {
    const el = getElement();
    if (!el) {
      resolve();
      return;
    }

    if (el.classList.contains("is-visible")) {
      resolve();
      return;
    }

    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
    el.setAttribute("aria-busy", "true");
    el.classList.add("is-active");

    void el.offsetWidth;
    el.classList.add("is-visible");
    waitForBackdropFade(el, resolve);
  });
}

/**
 * Fade-out после загрузки. По завершении эмитит SCENE_LOAD_OVERLAY_HIDDEN.
 * @returns {Promise<void>}
 */
export function hideSceneLoadOverlay() {
  return new Promise((resolve) => {
    const el = getElement();
    if (!el || !el.classList.contains("is-visible")) {
      emit(GameEvents.SCENE_LOAD_OVERLAY_HIDDEN);
      resolve();
      return;
    }

    el.classList.remove("is-visible");
    el.setAttribute("aria-busy", "false");
    el.setAttribute("aria-hidden", "true");

    waitForBackdropFade(el, () => {
      el.classList.remove("is-active");
      el.hidden = true;
      emit(GameEvents.SCENE_LOAD_OVERLAY_HIDDEN);
      resolve();
    });
  });
}
