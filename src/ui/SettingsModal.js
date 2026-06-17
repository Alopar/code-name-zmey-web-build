import { on } from "../core/EventBus.js";
import {
  getUserSettings,
  onUserSettingsChanged,
  resetUserSettings,
  setUserLobbyAnimated,
  setUserUiScaleTier,
  setUserVolume,
} from "../settings/UserSettings.js";
import { UI_SCALE_LABELS } from "./uiScale.js";
import { getModalStackDepth, ModalEvents } from "./ModalManager.js";

/** @typedef {"master" | "music" | "sfx" | "ambient"} VolumeCategory */

/** @type {Record<VolumeCategory, { inputId: string, valueId: string }>} */
const VOLUME_CONTROLS = {
  master: { inputId: "settings-volume-master", valueId: "settings-volume-master-value" },
  music: { inputId: "settings-volume-music", valueId: "settings-volume-music-value" },
  sfx: { inputId: "settings-volume-sfx", valueId: "settings-volume-sfx-value" },
  ambient: { inputId: "settings-volume-ambient", valueId: "settings-volume-ambient-value" },
};

/**
 * @param {number} volume
 * @returns {number}
 */
function volumeToPercent(volume) {
  return Math.round(volume * 100);
}

/**
 * @param {number} percent
 * @returns {number}
 */
function percentToVolume(percent) {
  return percent / 100;
}

function syncFooterButtons() {
  const backBtn = document.getElementById("btn-settings-back");
  const closeBtn = document.getElementById("btn-settings-close");
  const stacked = getModalStackDepth() > 1;

  if (backBtn) {
    backBtn.hidden = !stacked;
  }
  if (closeBtn) {
    closeBtn.hidden = stacked;
  }
}

function syncVolumeControls() {
  const userSettings = getUserSettings();

  for (const [category, ids] of Object.entries(VOLUME_CONTROLS)) {
    const input = document.getElementById(ids.inputId);
    const valueEl = document.getElementById(ids.valueId);
    const percent = volumeToPercent(userSettings[/** @type {VolumeCategory} */ (category)]);

    if (input instanceof HTMLInputElement) {
      input.value = String(percent);
    }
    if (valueEl) {
      valueEl.textContent = `${percent}%`;
    }
  }
}

function syncLobbyAnimatedControl() {
  const checkbox = document.getElementById("settings-lobby-animated");
  if (!(checkbox instanceof HTMLInputElement)) {
    return;
  }

  checkbox.checked = getUserSettings().lobbyAnimated;
}

function syncUiScaleControl() {
  const input = document.getElementById("settings-ui-scale");
  const valueEl = document.getElementById("settings-ui-scale-value");
  const tier = getUserSettings().uiScaleTier;

  if (input instanceof HTMLInputElement) {
    input.value = String(tier);
  }
  if (valueEl) {
    valueEl.textContent = UI_SCALE_LABELS[tier] ?? UI_SCALE_LABELS[0];
  }
}

function syncAllControls() {
  syncVolumeControls();
  syncUiScaleControl();
  syncLobbyAnimatedControl();
  syncFooterButtons();
}

function bindVolumeControl(category) {
  const ids = VOLUME_CONTROLS[category];
  const input = document.getElementById(ids.inputId);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  input.addEventListener("input", () => {
    const percent = Number(input.value);
    const valueEl = document.getElementById(ids.valueId);
    if (valueEl) {
      valueEl.textContent = `${percent}%`;
    }
    setUserVolume(category, percentToVolume(percent));
  });
}

function bindUiScaleControl() {
  const input = document.getElementById("settings-ui-scale");
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  input.addEventListener("input", () => {
    const tier = Number(input.value);
    const valueEl = document.getElementById("settings-ui-scale-value");
    if (valueEl) {
      valueEl.textContent = UI_SCALE_LABELS[tier] ?? UI_SCALE_LABELS[0];
    }
    setUserUiScaleTier(tier);
  });
}

export function initSettingsModal() {
  for (const category of Object.keys(VOLUME_CONTROLS)) {
    bindVolumeControl(/** @type {VolumeCategory} */ (category));
  }

  bindUiScaleControl();

  const lobbyAnimatedCheckbox = document.getElementById("settings-lobby-animated");
  lobbyAnimatedCheckbox?.addEventListener("change", () => {
    if (!(lobbyAnimatedCheckbox instanceof HTMLInputElement)) {
      return;
    }

    setUserLobbyAnimated(lobbyAnimatedCheckbox.checked);
  });

  on(ModalEvents.STACK_CHANGED, syncFooterButtons);
  onUserSettingsChanged(syncAllControls);

  document.getElementById("btn-settings-reset")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetUserSettings();
  });

  syncAllControls();
}
