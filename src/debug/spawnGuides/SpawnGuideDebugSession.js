import {
  getChestSpawnLineOffsetY,
  getEnemySpawnLineOffsetY,
  spawnLineOffsetYToWorldY,
} from "../../combat/config/combatSpawnGuides.js";
import { SCREEN_CENTER_X } from "../../combat/config/combatSpawnGuideConstants.js";

/** @typedef {"enemy" | "chest"} SpawnLineKind */

/**
 * @typedef {object} SpawnLineGuide
 * @property {SpawnLineKind} guideKind
 * @property {string} locationId
 * @property {number} offsetY
 */

/**
 * @param {string} locationId
 * @param {SpawnLineKind} guideKind
 * @param {number} offsetY
 * @returns {SpawnLineGuide}
 */
function createLineGuide(locationId, guideKind, offsetY) {
  return {
    guideKind,
    locationId,
    offsetY,
  };
}

export class SpawnGuideDebugSession {
  /**
   * @param {string} locationId
   */
  constructor(locationId) {
    this.locationId = locationId;
    /** @type {SpawnLineGuide} */
    this.enemyLine = createLineGuide(
      locationId,
      "enemy",
      getEnemySpawnLineOffsetY(locationId),
    );
    /** @type {SpawnLineGuide} */
    this.chestLine = createLineGuide(
      locationId,
      "chest",
      getChestSpawnLineOffsetY(locationId),
    );
  }

  /** @returns {SpawnLineGuide[]} */
  getAllGuides() {
    return [this.enemyLine, this.chestLine];
  }

  /**
   * @param {string} instanceId
   * @returns {SpawnLineGuide | null}
   */
  findByInstanceId(instanceId) {
    if (instanceId === "enemy-line") {
      return this.enemyLine;
    }
    if (instanceId === "chest-line") {
      return this.chestLine;
    }
    return null;
  }

  /**
   * @param {SpawnLineGuide} guide
   * @returns {{ x: number, y: number }}
   */
  getWorldPosition(guide) {
    return {
      x: SCREEN_CENTER_X,
      y: spawnLineOffsetYToWorldY(guide.offsetY),
    };
  }

  /**
   * @param {SpawnLineGuide} guide
   * @param {number} deltaY
   */
  nudgeGuideY(guide, deltaY) {
    guide.offsetY += deltaY;
  }
}
