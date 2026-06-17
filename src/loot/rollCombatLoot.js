import { getResourceConfig } from "../party/config/resources.js";
import { COMBAT_VICTORY_LOOT } from "./config/combatLoot.js";

/**
 * @param {{ amount?: number, amountMin?: number, amountMax?: number }} drop
 * @returns {number}
 */
function rollDropAmount(drop) {
  if (typeof drop.amountMin === "number" && typeof drop.amountMax === "number") {
    const { amountMin, amountMax } = drop;
    if (amountMin === amountMax) {
      return amountMin;
    }
    return Math.floor(Math.random() * (amountMax - amountMin + 1)) + amountMin;
  }

  return drop.amount ?? 1;
}

/**
 * @param {typeof COMBAT_VICTORY_LOOT} [lootTable]
 * @returns {Array<{ resourceId: string, amount: number }>}
 */
export function rollCombatLoot(lootTable = COMBAT_VICTORY_LOOT) {
  const drops = [];

  for (const drop of lootTable.drops) {
    getResourceConfig(drop.resourceId);

    if (Math.random() < drop.chance) {
      drops.push({ resourceId: drop.resourceId, amount: rollDropAmount(drop) });
    }
  }

  return drops;
}
