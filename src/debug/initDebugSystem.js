import { loadDebugSettings } from "./DebugSettings.js";
import { PivotOverlayController } from "./overlay/PivotOverlayController.js";
import { initDebugLobbyCheckbox } from "./ui/initDebugLobbyCheckbox.js";

/** @type {PivotOverlayController | null} */
let pivotOverlay = null;

/**
 * @param {Phaser.Game} game
 * @returns {() => void}
 */
export function initDebugSystem(game) {
  loadDebugSettings();
  const unsubCheckbox = initDebugLobbyCheckbox();

  pivotOverlay = new PivotOverlayController(game);
  pivotOverlay.start();

  return () => {
    unsubCheckbox();
    pivotOverlay?.destroy();
    pivotOverlay = null;
  };
}
