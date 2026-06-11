import { getResourceConfig } from "../party/config/resources.js";
import { COMBAT_VICTORY_LOOT } from "./config/combatLoot.js";

/**
 * @param {typeof COMBAT_VICTORY_LOOT} [lootTable]
 * @returns {Array<{ resourceId: string, amount: number }>}
 */
export function rollCombatLoot(lootTable = COMBAT_VICTORY_LOOT) {
  const drops = [];

  for (const drop of lootTable.drops) {
    getResourceConfig(drop.resourceId);

    if (Math.random() < drop.chance) {
      drops.push({ resourceId: drop.resourceId, amount: drop.amount });
    }
  }

  return drops;
}
