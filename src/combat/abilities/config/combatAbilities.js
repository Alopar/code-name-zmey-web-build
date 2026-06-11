/** @type {Readonly<Record<string, object>>} */
export const COMBAT_ABILITIES = Object.freeze({
  stimulator: Object.freeze({
    id: "stimulator",
    name: "Стимулятор",
    healAmount: 10,
    cooldownTurns: 3,
    resourceId: "stimulator",
    resourceCost: 1,
  }),
});

/**
 * @param {string} abilityId
 * @returns {typeof COMBAT_ABILITIES[string]}
 */
export function getCombatAbilityConfig(abilityId) {
  const config = COMBAT_ABILITIES[abilityId];
  if (!config) {
    throw new Error(`[Combat] Конфиг боевой абилки «${abilityId}» не найден`);
  }
  return config;
}
