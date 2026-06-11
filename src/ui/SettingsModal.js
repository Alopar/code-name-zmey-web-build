import {
  onFullscreenChange,
  requestAppFullscreen,
  exitAppFullscreen,
} from "../settings/FullscreenManager.js";
import { on } from "../core/EventBus.js";
import {
  getUserSettings,
  onUserSettingsChanged,
  resetUserSettings,
  setUserFullscreen,
  setUserVolume,
} from "../settings/UserSettings.js";
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

function syncFullscreenControl() {
  const checkbox = document.getElementById("settings-fullscreen");
  if (!(checkbox instanceof HTMLInputElement)) {
    return;
  }

  checkbox.checked = getUserSettings().fullscreen;
}

function syncAllControls() {
  syncVolumeControls();
  syncFullscreenControl();
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

export function initSettingsModal() {
  for (const category of Object.keys(VOLUME_CONTROLS)) {
    bindVolumeControl(/** @type {VolumeCategory} */ (category));
  }

  const fullscreenCheckbox = document.getElementById("settings-fullscreen");
  fullscreenCheckbox?.addEventListener("change", () => {
    if (!(fullscreenCheckbox instanceof HTMLInputElement)) {
      return;
    }

    const enabled = fullscreenCheckbox.checked;
    if (enabled) {
      void requestAppFullscreen().then((ok) => {
        if (!ok) {
          setUserFullscreen(false);
          fullscreenCheckbox.checked = false;
        }
      });
      return;
    }

    void exitAppFullscreen();
  });

  on(ModalEvents.STACK_CHANGED, syncFooterButtons);
  onUserSettingsChanged(syncAllControls);

  onFullscreenChange((enabled) => {
    setUserFullscreen(enabled);
  });

  document.getElementById("btn-settings-reset")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetUserSettings();
  });

  syncAllControls();
}
