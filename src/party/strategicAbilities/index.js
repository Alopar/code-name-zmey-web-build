import { executeHeal } from "./executeHeal.js";

/** @type {Readonly<Record<string, (party: import("../entities/Party.js").Party, hero: import("../../hero/entities/Hero.js").Hero) => { success: boolean, reason?: string }>>} */
export const STRATEGIC_ABILITY_EXECUTORS = Object.freeze({
  heal: executeHeal,
});

/**
 * @param {string} abilityId
 * @param {import("../entities/Party.js").Party} party
 * @param {import("../../hero/entities/Hero.js").Hero} hero
 */
export function executeStrategicAbility(abilityId, party, hero) {
  const executor = STRATEGIC_ABILITY_EXECUTORS[abilityId];
  if (!executor) {
    throw new Error(`[Party] Исполнитель стратегической абилки «${abilityId}» не найден`);
  }

  return executor(party, hero);
}
