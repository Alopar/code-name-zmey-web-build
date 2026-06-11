import { getResourceConfig, RESOURCE_TYPES } from "../party/config/resources.js";
import * as CombatSession from "../combat/CombatSession.js";
import * as PartySession from "../party/PartySession.js";

/**
 * @param {Array<{ resourceId: string, amount: number }>} drops
 * @param {{ combatPlayer?: import("../combat/entities/Combatant.js").Combatant }} [options]
 */
export function grantLootDrops(drops, options = {}) {
  const { combatPlayer = null } = options;
  let combatPlayerChanged = false;

  for (const drop of drops) {
    const config = getResourceConfig(drop.resourceId);

    if (config.type === RESOURCE_TYPES.STRATEGIC) {
      PartySession.addResource(drop.resourceId, drop.amount);
      continue;
    }

    if (config.type === RESOURCE_TYPES.TACTICAL && combatPlayer?.resources) {
      combatPlayer.addResource(drop.resourceId, drop.amount);
      combatPlayerChanged = true;
      continue;
    }

    PartySession.addResource(drop.resourceId, drop.amount);
  }

  if (combatPlayerChanged) {
    CombatSession.refreshState();
  }
}
