/** Базовое число AP игрока за ход (модель поддерживает до 5). */
export const PLAYER_ACTION_POINTS_MAX = 2;

/** Стоимость AP-действия на первом этапе. */
export const DEFAULT_ACTION_COST = 1;

export const COMBAT_ACTION_IDS = Object.freeze({
  attack: (slot) => `attack:${slot}`,
  ability: (abilityId) => `ability:${abilityId}`,
});

/**
 * Состояние action points и одноразовых действий за ход игрока.
 */
export class CombatActionPoints {
  /**
   * @param {{ max?: number }} [options]
   */
  constructor({ max = PLAYER_ACTION_POINTS_MAX } = {}) {
    this.max = max;
    this.current = max;
    /** @type {Set<string>} */
    this.usedActionIdsThisTurn = new Set();
  }

  resetTurn() {
    this.current = this.max;
    this.usedActionIdsThisTurn.clear();
  }

  /**
   * @param {string} actionId
   * @param {number} [cost]
   */
  canUse(actionId, cost = DEFAULT_ACTION_COST) {
    if (this.current < cost) {
      return false;
    }

    if (this.usedActionIdsThisTurn.has(actionId)) {
      return false;
    }

    return true;
  }

  /**
   * @param {string} actionId
   * @param {number} [cost]
   * @returns {boolean}
   */
  spend(actionId, cost = DEFAULT_ACTION_COST) {
    if (!this.canUse(actionId, cost)) {
      return false;
    }

    this.current -= cost;
    this.usedActionIdsThisTurn.add(actionId);
    return true;
  }

  get isEmpty() {
    return this.current <= 0;
  }

  toSnapshot() {
    return {
      current: this.current,
      max: this.max,
      spent: this.max - this.current,
      isEmpty: this.isEmpty,
      usedActionIds: [...this.usedActionIdsThisTurn],
    };
  }
}
