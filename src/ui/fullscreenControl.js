import {
  onFullscreenChange,
  requestAppFullscreen,
  exitAppFullscreen,
} from "../settings/FullscreenManager.js";
import { getUserSettings, onUserSettingsChanged, setUserFullscreen } from "../settings/UserSettings.js";

const CHECKBOX_ID = "settings-fullscreen";
const LOBBY_BUTTON_ID = "btn-lobby-fullscreen";

/**
 * @param {boolean} enabled
 */
export function applyFullscreenUserChoice(enabled) {
  if (enabled) {
    void requestAppFullscreen().then((ok) => {
      if (!ok) {
        setUserFullscreen(false);
        syncFullscreenControls();
      }
    });
    return;
  }

  void exitAppFullscreen();
}

export function toggleFullscreenUserChoice() {
  applyFullscreenUserChoice(!getUserSettings().fullscreen);
}

export function syncFullscreenControls() {
  const enabled = getUserSettings().fullscreen;

  const checkbox = document.getElementById(CHECKBOX_ID);
  if (checkbox instanceof HTMLInputElement) {
    checkbox.checked = enabled;
  }

  const lobbyBtn = document.getElementById(LOBBY_BUTTON_ID);
  if (lobbyBtn instanceof HTMLButtonElement) {
    lobbyBtn.setAttribute("aria-pressed", String(enabled));
    lobbyBtn.setAttribute(
      "aria-label",
      enabled ? "Выйти из полноэкранного режима" : "На весь экран",
    );
  }
}

export function initFullscreenControls() {
  const checkbox = document.getElementById(CHECKBOX_ID);
  checkbox?.addEventListener("change", () => {
    if (!(checkbox instanceof HTMLInputElement)) {
      return;
    }

    applyFullscreenUserChoice(checkbox.checked);
  });

  document.getElementById(LOBBY_BUTTON_ID)?.addEventListener("click", () => {
    toggleFullscreenUserChoice();
  });

  onFullscreenChange((enabled) => {
    setUserFullscreen(enabled);
  });

  onUserSettingsChanged(syncFullscreenControls);
  syncFullscreenControls();
}
