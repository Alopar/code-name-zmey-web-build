import { GameSpace } from "../core/GameSpace.js";
import { navigateTo } from "../game/GameController.js";
import { getLocationActionConfig } from "./config/locationActions.js";

/**
 * @param {string} actionId
 * @param {{ engine?: import("../combat/CombatEngine.js").CombatEngine | null }} context
 * @returns {boolean}
 */
export function executeCombatLocationAction(actionId, context = {}) {
  getLocationActionConfig(actionId);

  switch (actionId) {
    case "retreat": {
      if (!context.engine?.requestRetreat()) {
        return false;
      }
      navigateTo(GameSpace.WORLD_MAP);
      return true;
    }
    case "leave": {
      navigateTo(GameSpace.WORLD_MAP);
      return true;
    }
    default:
      return false;
  }
}
