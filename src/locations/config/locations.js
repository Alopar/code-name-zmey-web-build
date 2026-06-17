import { JUNGLE_ROAD_BG_KEYS } from "../../game/Assets.js";
import { DEFAULT_LINE_OFFSET_Y } from "../../combat/config/combatSpawnGuideConstants.js";

/**
 * @typedef {object} LocationConfig
 * @property {string} id
 * @property {readonly string[]} bgKeys
 * @property {readonly string[]} [chestIds]
 * @property {string} [chestId]
 * @property {readonly string[]} actionIds
 * @property {{
 *   enemy?: { offsetY: number },
 *   chest?: { offsetY: number },
 * }} [spawnGuides]
 */

/** @type {Readonly<Record<string, object>>} */
export const LOCATIONS = Object.freeze({
  jungle_road: Object.freeze({
    id: "jungle_road",
    bgKeys: JUNGLE_ROAD_BG_KEYS,
    chestIds: Object.freeze(["medical", "military_olive"]),
    actionIds: Object.freeze(["retreat", "leave"]),
    /** offsetY — смещение горизонтальной линии спавна от центра экрана */
    spawnGuides: Object.freeze({
      enemy: Object.freeze({ offsetY: DEFAULT_LINE_OFFSET_Y }),
      chest: Object.freeze({ offsetY: DEFAULT_LINE_OFFSET_Y }),
    }),
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
 * @param {readonly string[]} items
 * @returns {string}
 */
function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * @param {string} locationId
 * @returns {{ id: string, bgKey: string, chestId: string | null }}
 */
export function getCombatSetupLocation(locationId) {
  const { id, bgKeys, chestIds, chestId } = getLocationConfig(locationId);
  const pool = chestIds ?? (chestId ? [chestId] : []);
  const pickedChestId = pool.length ? pickRandomItem(pool) : null;
  return { id, bgKey: pickRandomBgKey(bgKeys), chestId: pickedChestId };
}
