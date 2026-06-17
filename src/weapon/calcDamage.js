import { getWeaponConfig } from "./config/weapons.js";

/**
 * Случайное значение в диапазоне [min, max] включительно.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function rollDamageInRange(min, max) {
  if (min === max) {
    return min;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Случайный урон оружия в диапазоне [damageMin, damageMax].
 * @param {string} weaponId
 * @returns {number}
 */
export function calcWeaponDamage(weaponId) {
  const { damageMin, damageMax } = getWeaponConfig(weaponId);
  return rollDamageInRange(damageMin, damageMax);
}
