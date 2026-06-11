import { JUNGLE_ROAD_BG_KEYS } from "../../game/Assets.js";

/**
 * @typedef {object} LocationConfig
 * @property {string} id
 * @property {readonly string[]} bgKeys
 * @property {string} chestId
 * @property {readonly string[]} actionIds
 */

/** @type {Readonly<Record<string, LocationConfig>>} */
export const LOCATIONS = Object.freeze({
  jungle_road: Object.freeze({
    id: "jungle_road",
    bgKeys: JUNGLE_ROAD_BG_KEYS,
    chestId: "medical",
    actionIds: Object.freeze(["retreat", "leave"]),
  }),
});

/**
 * @param {string} locationId
 * @returns {typeof LOCATIONS[string]}
 */
export function getLocationConfig(locationId) {
  const config = LOCATIONS[locationId];
  if (!config) {
    throw new Error(`[Locations] Конфиг локации «${locationId}» не найден`);
  }
  return config;
}

/**
 * @param {readonly string[]} bgKeys
 * @returns {string}
 */
function pickRandomBgKey(bgKeys) {
  return bgKeys[Math.floor(Math.random() * bgKeys.length)];
}

/**
 * @param {string} locationId
 * @returns {{ id: string, bgKey: string, chestId: string }}
 */
export function getCombatSetupLocation(locationId) {
  const { id, bgKeys, chestId } = getLocationConfig(locationId);
  return { id, bgKey: pickRandomBgKey(bgKeys), chestId };
}
