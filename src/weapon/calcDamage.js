import { getWeaponConfig } from "./config/weapons.js";

/**
 * Случайный урон оружия в диапазоне [damageMin, damageMax].
 * @param {string} weaponId
 * @returns {number}
 */
export function calcWeaponDamage(weaponId) {
  const { damageMin, damageMax } = getWeaponConfig(weaponId);

  if (damageMin === damageMax) {
    return damageMin;
  }

  return Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin;
}
