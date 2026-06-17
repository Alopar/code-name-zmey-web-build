import { getLocationConfig } from "../../locations/config/locations.js";
import { layoutEnemyPositions } from "../../game/combatEnemyLayout.js";
import {
  DEFAULT_LINE_OFFSET_Y,
  SCREEN_CENTER_X,
  SCREEN_CENTER_Y,
} from "./combatSpawnGuideConstants.js";

/** @typedef {"enemy" | "chest"} SpawnLineKind */

/**
 * @param {unknown} spawnGuide
 * @returns {number}
 */
function resolveLineOffsetY(spawnGuide) {
  if (Array.isArray(spawnGuide)) {
    return spawnGuide[0]?.offsetY ?? DEFAULT_LINE_OFFSET_Y;
  }

  if (spawnGuide && typeof spawnGuide === "object") {
    return /** @type {{ offsetY?: number }} */ (spawnGuide).offsetY ?? DEFAULT_LINE_OFFSET_Y;
  }

  return DEFAULT_LINE_OFFSET_Y;
}

/**
 * @param {number} offsetY
 * @returns {number}
 */
export function spawnLineOffsetYToWorldY(offsetY) {
  return SCREEN_CENTER_Y + offsetY;
}

/**
 * @param {string} locationId
 * @returns {number}
 */
export function getEnemySpawnLineOffsetY(locationId) {
  try {
    const config = getLocationConfig(locationId);
    return resolveLineOffsetY(config.spawnGuides?.enemy);
  } catch {
    return DEFAULT_LINE_OFFSET_Y;
  }
}

/**
 * @param {string} locationId
 * @returns {number}
 */
export function getChestSpawnLineOffsetY(locationId) {
  try {
    const config = getLocationConfig(locationId);
    return resolveLineOffsetY(config.spawnGuides?.chest);
  } catch {
    return DEFAULT_LINE_OFFSET_Y;
  }
}

/**
 * @param {string} locationId
 * @returns {number}
 */
export function getEnemySpawnLineWorldY(locationId) {
  return spawnLineOffsetYToWorldY(getEnemySpawnLineOffsetY(locationId));
}

/**
 * @param {string} locationId
 * @returns {number}
 */
export function getChestSpawnLineWorldY(locationId) {
  return spawnLineOffsetYToWorldY(getChestSpawnLineOffsetY(locationId));
}

/**
 * @param {string} locationId
 * @param {number} count
 * @param {number} spriteDisplayWidth
 * @returns {{ x: number, y: number }[]}
 */
export function getEnemySpawnPositions(locationId, count, spriteDisplayWidth) {
  const lineY = getEnemySpawnLineWorldY(locationId);
  return layoutEnemyPositions(count, spriteDisplayWidth, lineY);
}

/**
 * @param {string} locationId
 * @returns {{ x: number, y: number }}
 */
export function getChestSpawnPosition(locationId) {
  return {
    x: SCREEN_CENTER_X,
    y: getChestSpawnLineWorldY(locationId),
  };
}

export { DEFAULT_LINE_OFFSET_Y } from "./combatSpawnGuideConstants.js";
