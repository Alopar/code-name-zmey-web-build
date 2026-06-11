import { INFO_TOAST_CONFIG } from "./config/infoToast.js";

/** @typedef {{ id: number, el: HTMLElement, dismissTimer: number, exitTimer: number }} ToastEntry */

/** @type {HTMLElement | null} */
let root = null;

/** @type {ToastEntry[]} */
const activeToasts = [];

let nextId = 0;

/**
 * @param {HTMLElement | null} container
 */
export function bindInfoToastRoot(container) {
  root = container;
}

/**
 * @param {string} message
 */
export function pushInfoToast(message) {
  if (!root || !message) {
    return;
  }

  while (activeToasts.length >= INFO_TOAST_CONFIG.maxVisible) {
    const oldest = activeToasts[activeToasts.length - 1];
    dismissToast(oldest.id, true);
  }

  const id = ++nextId;
  const el = document.createElement("div");
  el.className = "info-toast";
  el.dataset.toastId = String(id);
  el.textContent = message;
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    dismissToast(id, false);
  });
  root.prepend(el);

  const dismissTimer = window.setTimeout(() => {
    dismissToast(id, false);
  }, INFO_TOAST_CONFIG.displayDurationMs);

  activeToasts.unshift({ id, el, dismissTimer, exitTimer: 0 });
}

/**
 * @param {number} id
 * @param {boolean} immediate
 */
function dismissToast(id, immediate) {
  const index = activeToasts.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return;
  }

  const [entry] = activeToasts.splice(index, 1);
  window.clearTimeout(entry.dismissTimer);
  window.clearTimeout(entry.exitTimer);

  if (!entry.el.isConnected) {
    return;
  }

  if (immediate) {
    entry.el.remove();
    return;
  }

  entry.el.classList.add("is-exiting");
  entry.exitTimer = window.setTimeout(() => {
    entry.el.remove();
  }, INFO_TOAST_CONFIG.exitDurationMs);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
