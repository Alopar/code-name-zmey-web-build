/** @type {Readonly<Record<string, object>>} */
export const WEAPON_CONFIGS = Object.freeze({
  claws: Object.freeze({
    id: "claws",
    name: "Когти",
    damageMin: 1,
    damageMax: 4,
  }),
  knife: Object.freeze({
    id: "knife",
    name: "Нож",
    damageMin: 2,
    damageMax: 5,
  }),
});

/**
 * @param {string} weaponId
 */
export function getWeaponConfig(weaponId) {
  const config = WEAPON_CONFIGS[weaponId];
  if (!config) {
    throw new Error(`[Weapon] Неизвестное оружие: ${weaponId}`);
  }
  return config;
}
