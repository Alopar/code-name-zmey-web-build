import { loadDebugSettings } from "./DebugSettings.js";
import { CombatDebugController } from "./overlay/CombatDebugController.js";
import { initDebugLobbyCheckbox } from "./ui/initDebugLobbyCheckbox.js";

/** @type {CombatDebugController | null} */
let combatDebug = null;

/**
 * @param {Phaser.Game} game
 * @returns {() => void}
 */
export function initDebugSystem(game) {
  loadDebugSettings();
  const unsubCheckbox = initDebugLobbyCheckbox();

  combatDebug = new CombatDebugController(game);
  combatDebug.start();

  return () => {
    unsubCheckbox();
    combatDebug?.destroy();
    combatDebug = null;
  };
}
