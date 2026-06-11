import { getLootContainerConfig } from "../../loot/config/lootContainers.js";

let nextChestId = 1;

/**
 * Сундук на поле боя — открывается кликами, выдаёт лут после открытия.
 */
export class CombatChest {
  /**
   * @param {{
   *   containerId: string,
   *   x: number,
   *   y: number,
   * }} data
   */
  constructor({ containerId, x, y }) {
    const config = getLootContainerConfig(containerId);
    const { minTaps, maxTaps } = config.interaction;

    this.id = `chest_${nextChestId++}`;
    this.containerId = containerId;
    this.x = x;
    this.y = y;
    this.opened = false;
    this.tapCount = 0;
    this.requiredTaps =
      minTaps + Math.floor(Math.random() * (maxTaps - minTaps + 1));
    /** @type {string[]} */
    this.lootDropIds = [];
  }

  /** @returns {{ id: string, containerId: string, x: number, y: number, opened: boolean, tapCount: number, requiredTaps: number, lootDropIds: string[] }} */
  toSnapshot() {
    return {
      id: this.id,
      containerId: this.containerId,
      x: this.x,
      y: this.y,
      opened: this.opened,
      tapCount: this.tapCount,
      requiredTaps: this.requiredTaps,
      lootDropIds: [...this.lootDropIds],
    };
  }
}
