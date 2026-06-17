export const DEFAULT_HERO_ID = "zmey";

/** @type {Readonly<Record<string, object>>} */
export const HERO_CONFIGS = Object.freeze({
  zmey: Object.freeze({
    id: "zmey",
    name: "Zmey",
    hp: 20,
    maxHp: 20,
    primaryWeaponId: "fist",
    secondaryWeaponId: "knife",
    combatAbilityIds: Object.freeze(["stimulator", "grenade"]),
  }),
});

/**
 * @param {string} [heroId]
 * @returns {typeof HERO_CONFIGS[string]}
 */
export function getHeroConfig(heroId = DEFAULT_HERO_ID) {
  const config = HERO_CONFIGS[heroId];
  if (!config) {
    throw new Error(`[Hero] Конфиг героя «${heroId}» не найден`);
  }
  return config;
}
