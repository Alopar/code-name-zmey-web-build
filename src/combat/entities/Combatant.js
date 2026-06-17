import { ResourceStock } from "../../party/entities/ResourceStock.js";
import { WEAPON_SLOTS } from "../../weapon/weaponSlots.js";

/**
 * Участник боя (игрок или базовая модель).
 */
export class Combatant {
  /**
   * @param {{
   *   id: string,
   *   hp: number,
   *   maxHp: number,
   *   primaryWeaponId: string,
   *   secondaryWeaponId?: string | null,
   *   name?: string,
   *   resources?: ResourceStock,
   * }} data
   */
  constructor({
    id,
    hp,
    maxHp,
    primaryWeaponId,
    secondaryWeaponId = null,
    name,
    resources = null,
  }) {
    this.id = id;
    this.hp = hp;
    this.maxHp = maxHp;
    this.primaryWeaponId = primaryWeaponId;
    this.secondaryWeaponId = secondaryWeaponId;
    this.name = name ?? id;
    this.resources = resources;
  }

  /**
   * @param {import("../../weapon/weaponSlots.js").WeaponSlot} slot
   * @returns {string | null}
   */
  getWeaponIdForSlot(slot) {
    if (slot === WEAPON_SLOTS.primary) {
      return this.primaryWeaponId;
    }
    if (slot === WEAPON_SLOTS.secondary) {
      return this.secondaryWeaponId;
    }
    return null;
  }

  /** @param {string} resourceId */
  getResourceCount(resourceId) {
    return this.resources?.getCount(resourceId) ?? 0;
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  consumeResource(resourceId, amount) {
    return this.resources?.consume(resourceId, amount) ?? false;
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  addResource(resourceId, amount) {
    this.resources?.add(resourceId, amount);
  }

  /** @param {number} amount */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  /** @param {number} amount */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** @returns {number} */
  getHpPercent() {
    if (this.maxHp <= 0) {
      return 0;
    }
    return Math.round((this.hp / this.maxHp) * 100);
  }

  /** @returns {{ id: string, hp: number, maxHp: number, primaryWeaponId: string, secondaryWeaponId: string | null, name: string, hpPercent: number, resources: ReturnType<ResourceStock["toSnapshot"]> }} */
  toSnapshot() {
    return {
      id: this.id,
      hp: this.hp,
      maxHp: this.maxHp,
      primaryWeaponId: this.primaryWeaponId,
      secondaryWeaponId: this.secondaryWeaponId,
      name: this.name,
      hpPercent: this.getHpPercent(),
      resources: this.resources?.toSnapshot() ?? [],
    };
  }
}
