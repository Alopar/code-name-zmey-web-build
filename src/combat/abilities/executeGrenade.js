import { getCombatAbilityConfig } from "./config/combatAbilities.js";

/**
 * @param {import("../entities/Combatant.js").Combatant} player
 * @returns {{ success: boolean, reason?: string }}
 */
export function executeGrenade(player) {
  const ability = getCombatAbilityConfig("grenade");

  if (player.getResourceCount(ability.resourceId) < ability.resourceCost) {
    return { success: false, reason: "no_resource" };
  }

  const consumed = player.consumeResource(ability.resourceId, ability.resourceCost);
  if (!consumed) {
    return { success: false, reason: "no_resource" };
  }

  return { success: true };
}
