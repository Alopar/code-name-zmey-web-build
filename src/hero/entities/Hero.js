/**
 * Игровая сущность протагониста в текущем забеге.
 * Мета-прогресс игрока (Player) будет отдельным модулем.
 */
export class Hero {
  /**
   * @param {{
   *   id: string,
   *   name: string,
   *   hp: number,
   *   maxHp: number,
   *   primaryWeaponId: string,
   *   secondaryWeaponId?: string | null,
   *   combatAbilityIds?: readonly string[],
   * }} data
   */
  constructor({
    id,
    name,
    hp,
    maxHp,
    primaryWeaponId,
    secondaryWeaponId = null,
    combatAbilityIds = [],
  }) {
    this.id = id;
    this.name = name;
    this.hp = hp;
    this.maxHp = maxHp;
    this.primaryWeaponId = primaryWeaponId;
    this.secondaryWeaponId = secondaryWeaponId;
    this.combatAbilityIds = combatAbilityIds;
  }

  /**
   * @param {ReturnType<import("../config/defaultHero.js").getHeroConfig>} config
   */
  static fromConfig(config) {
    return new Hero({
      id: config.id,
      name: config.name,
      hp: config.hp,
      maxHp: config.maxHp,
      primaryWeaponId: config.primaryWeaponId,
      secondaryWeaponId: config.secondaryWeaponId ?? null,
      combatAbilityIds: config.combatAbilityIds ?? [],
    });
  }

  /** @param {number} hp */
  setHp(hp) {
    this.hp = Math.max(0, Math.min(this.maxHp, hp));
  }

  /**
   * @param {{ hp: number, maxHp: number }} stats
   */
  applyCombatState({ hp, maxHp }) {
    this.maxHp = maxHp;
    this.setHp(hp);
  }

  /** @param {ReturnType<import("../config/defaultHero.js").getHeroConfig>} config */
  resetStats(config) {
    this.hp = config.hp;
    this.maxHp = config.maxHp;
    this.primaryWeaponId = config.primaryWeaponId;
    this.secondaryWeaponId = config.secondaryWeaponId ?? null;
  }

  /** @returns {number} */
  getHpPercent() {
    if (this.maxHp <= 0) {
      return 0;
    }
    return Math.round((this.hp / this.maxHp) * 100);
  }

  /** @returns {{ id: string, name: string, hp: number, maxHp: number, primaryWeaponId: string, secondaryWeaponId: string | null, hpPercent: number }} */
  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      primaryWeaponId: this.primaryWeaponId,
      secondaryWeaponId: this.secondaryWeaponId,
      hpPercent: this.getHpPercent(),
    };
  }

  /**
   * @param {Record<string, number>} [tacticalResources]
   * @returns {{ name: string, hp: number, maxHp: number, primaryWeaponId: string, secondaryWeaponId: string | null, combatAbilityIds: readonly string[], tacticalResources: Record<string, number> }}
   */
  toCombatSetup(tacticalResources = {}) {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      primaryWeaponId: this.primaryWeaponId,
      secondaryWeaponId: this.secondaryWeaponId,
      combatAbilityIds: this.combatAbilityIds,
      tacticalResources,
    };
  }
}
