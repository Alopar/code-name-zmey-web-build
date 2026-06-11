/** @type {Readonly<Record<string, object>>} */
export const STRATEGIC_ABILITIES = Object.freeze({
  heal: Object.freeze({
    id: "heal",
    name: "Лечить",
    resourceId: "medkit",
    resourceCost: 1,
  }),
});

/**
 * @param {string} abilityId
 * @returns {typeof STRATEGIC_ABILITIES[string]}
 */
export function getStrategicAbilityConfig(abilityId) {
  const config = STRATEGIC_ABILITIES[abilityId];
  if (!config) {
    throw new Error(`[Party] Конфиг стратегической абилки «${abilityId}» не найден`);
  }
  return config;
}
