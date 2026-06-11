let nextLootDropId = 1;

/**
 * Лут на поле боя — один предмет в точке смерти врага.
 */
export class CombatLootDrop {
  /**
   * @param {{
   *   resourceId: string,
   *   amount: number,
   *   x: number,
   *   y: number,
   * }} data
   */
  constructor({ resourceId, amount, x, y }) {
    this.id = `loot_${nextLootDropId++}`;
    this.resourceId = resourceId;
    this.amount = amount;
    this.x = x;
    this.y = y;
    this.pickedUp = false;
  }

  /** @returns {{ id: string, resourceId: string, amount: number, x: number, y: number }} */
  toSnapshot() {
    return {
      id: this.id,
      resourceId: this.resourceId,
      amount: this.amount,
      x: this.x,
      y: this.y,
    };
  }
}
