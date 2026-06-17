import { executeGrenade } from "./executeGrenade.js";
import { executeStimulator } from "./executeStimulator.js";

export { getCombatAbilityConfig } from "./config/combatAbilities.js";

export const COMBAT_ABILITY_EXECUTORS = Object.freeze({
  stimulator: executeStimulator,
  grenade: executeGrenade,
});

/**
 * @param {string} abilityId
 * @param {import("../entities/Combatant.js").Combatant} player
 * @returns {{ success: boolean, reason?: string, healAmount?: number }}
 */
export function executeCombatAbility(abilityId, player) {
  const executor = COMBAT_ABILITY_EXECUTORS[abilityId];
  if (!executor) {
    throw new Error(`[Combat] Исполнитель боевой абилки «${abilityId}» не найден`);
  }
  return executor(player);
}
