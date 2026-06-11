import { getCombatAbilityConfig } from "./config/combatAbilities.js";

/**
 * @param {import("../entities/Combatant.js").Combatant} player
 * @returns {{ success: boolean, reason?: string, healAmount?: number }}
 */
export function executeStimulator(player) {
  const ability = getCombatAbilityConfig("stimulator");

  if (player.hp >= player.maxHp) {
    return { success: false, reason: "full_hp" };
  }

  if (player.getResourceCount(ability.resourceId) < ability.resourceCost) {
    return { success: false, reason: "no_resource" };
  }

  const consumed = player.consumeResource(ability.resourceId, ability.resourceCost);
  if (!consumed) {
    return { success: false, reason: "no_resource" };
  }

  const hpBefore = player.hp;
  player.heal(ability.healAmount);

  return {
    success: true,
    healAmount: player.hp - hpBefore,
  };
}
