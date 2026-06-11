import { Combatant } from "./Combatant.js";

/**
 * Враг в бою — статы + визуал для Phaser.
 */
export class Enemy extends Combatant {
  /**
   * @param {{
   *   enemyId: string,
   *   id: string,
   *   hp: number,
   *   maxHp: number,
   *   weaponId: string,
   *   name: string,
   *   visual: { assetKey: string, idle: number, attack: number },
   * }} data
   */
  constructor({ enemyId, id, hp, maxHp, weaponId, name, visual }) {
    super({ id, hp, maxHp, weaponId, name });
    this.enemyId = enemyId;
    this.visual = visual;
  }

  /** @returns {import("./Combatant.js").Combatant & { enemyId: string, visual: object }} */
  toSnapshot() {
    return {
      ...super.toSnapshot(),
      enemyId: this.enemyId,
    };
  }
}
