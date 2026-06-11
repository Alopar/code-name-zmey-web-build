import { GameSpace } from "../core/GameSpace.js";
import { navigateTo } from "../game/GameController.js";
import * as CombatSession from "./CombatSession.js";

/**
 * @param {import("./CombatEncounter.js").CombatSetup} setup
 */
export function startCombat(setup) {
  CombatSession.begin(setup);
  navigateTo(GameSpace.COMBAT);
}
