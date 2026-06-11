import { emit, GameEvents, on } from "../../core/EventBus.js";
import { INFO_TOAST_TYPES } from "./config/infoToastTypes.js";
import { INFO_TOAST_CONFIG } from "./config/infoToast.js";
import { formatLootMessage } from "./formatLootMessage.js";
import { bindInfoToastRoot, delay, pushInfoToast } from "./InfoToastManager.js";

/** @typedef {{ type: string, drops?: Array<{ resourceId: string, amount: number }>, message?: string }} InfoToastPayload */

/**
 * @param {InfoToastPayload} payload
 */
export async function handleInfoToastPayload(payload) {
  if (!payload?.type) {
    return;
  }

  if (payload.type === INFO_TOAST_TYPES.LOOT) {
    const drops = payload.drops ?? [];
    for (let i = 0; i < drops.length; i += 1) {
      if (i > 0) {
        await delay(INFO_TOAST_CONFIG.staggerMs);
      }
      pushInfoToast(formatLootMessage(drops[i]));
    }
    return;
  }

  if (payload.type === INFO_TOAST_TYPES.CUSTOM && payload.message) {
    pushInfoToast(payload.message);
  }
}

/**
 * @param {InfoToastPayload} payload
 */
export function showInfoToast(payload) {
  emit(GameEvents.INFO_TOAST, payload);
}

/**
 * @returns {() => void}
 */
export function initInfoToastUI() {
  const root = document.getElementById("info-toast-root");
  if (!root) {
    console.warn("[InfoToast] Контейнер #info-toast-root не найден");
    return () => {};
  }

  root.style.setProperty("--info-toast-stack-gap", `${INFO_TOAST_CONFIG.stackGapPx}px`);
  root.style.setProperty("--info-toast-enter-duration", `${INFO_TOAST_CONFIG.enterDurationMs}ms`);
  root.style.setProperty("--info-toast-exit-duration", `${INFO_TOAST_CONFIG.exitDurationMs}ms`);
  root.style.setProperty("--info-toast-enter-offset", `${INFO_TOAST_CONFIG.enterOffsetPx}px`);
  root.style.setProperty("--info-toast-anchor-top", `${INFO_TOAST_CONFIG.anchorTopOffsetPx}px`);
  root.style.setProperty("--info-toast-width", `${INFO_TOAST_CONFIG.toastWidthPx}px`);
  root.style.zIndex = String(INFO_TOAST_CONFIG.zIndex);

  bindInfoToastRoot(root);

  const unsub = on(GameEvents.INFO_TOAST, (detail) => {
    void handleInfoToastPayload(detail);
  });

  return () => {
    unsub();
    bindInfoToastRoot(null);
  };
}
