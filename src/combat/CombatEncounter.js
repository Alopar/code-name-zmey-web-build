import { ResourceStock } from "../party/entities/ResourceStock.js";
import { getEnemyConfig } from "./config/enemies.js";
import { Combatant } from "./entities/Combatant.js";
import { Enemy } from "./entities/Enemy.js";

/**
 * @typedef {object} CombatSetup
 * @property {{ id: string, bgKey: string, chestId?: string }} location
 * @property {Record<string, unknown>} [settings]
 * @property {{ name: string, hp: number, maxHp: number, primaryWeaponId: string, secondaryWeaponId?: string | null, combatAbilityIds?: string[], tacticalResources?: Record<string, number> }} player
 * @property {{ enemyId: string }[]} enemies
 */

/**
 * @param {CombatSetup} setup
 */
export function createCombatEncounter(setup) {
  const player = new Combatant({
    id: "player",
    name: setup.player.name,
    hp: setup.player.hp,
    maxHp: setup.player.maxHp,
    primaryWeaponId: setup.player.primaryWeaponId,
    secondaryWeaponId: setup.player.secondaryWeaponId ?? null,
    resources: ResourceStock.fromInitial(setup.player.tacticalResources ?? {}),
  });

  const enemies = setup.enemies.map(({ enemyId }, index) => {
    const cfg = getEnemyConfig(enemyId);
    return new Enemy({
      enemyId,
      id: `${enemyId}_${index}`,
      name: cfg.name,
      hp: cfg.hp,
      maxHp: cfg.maxHp,
      primaryWeaponId: cfg.primaryWeaponId,
      visual: cfg.visual,
    });
  });

  return Object.freeze({
    location: setup.location,
    settings: setup.settings ?? {},
    player,
    enemies,
    combatAbilityIds: setup.player.combatAbilityIds ?? [],
  });
}
