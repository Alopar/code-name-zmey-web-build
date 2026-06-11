import { DEFAULT_HERO_ID, getHeroConfig } from "./config/defaultHero.js";
import { Hero } from "./entities/Hero.js";
import { emit, GameEvents } from "../core/EventBus.js";

/** @type {Hero | null} */
let activeHero = null;

/** @type {string | null} */
let activeHeroId = null;

function broadcastState() {
  const hero = getHero();
  emit(GameEvents.HERO_STATE_CHANGED, { hero: hero.toSnapshot() });
}

/**
 * @param {string} [heroId]
 */
export function begin(heroId = DEFAULT_HERO_ID) {
  const config = getHeroConfig(heroId);
  activeHeroId = heroId;
  activeHero = Hero.fromConfig(config);
  broadcastState();
}

export function reset() {
  begin(activeHeroId ?? DEFAULT_HERO_ID);
}

export function getHero() {
  if (!activeHero) {
    begin();
  }
  return activeHero;
}

/**
 * @param {Record<string, number>} [tacticalResources]
 */
export function getCombatSetup(tacticalResources = {}) {
  return getHero().toCombatSetup(tacticalResources);
}

/**
 * @param {{ hp: number, maxHp: number }} player
 */
export function syncFromCombatPlayer(player) {
  getHero().applyCombatState({
    hp: player.hp,
    maxHp: player.maxHp,
  });
  broadcastState();
}

/** @param {number} hp */
export function syncCombatResult(hp) {
  getHero().setHp(hp);
  broadcastState();
}

export function restoreFullHp() {
  const hero = getHero();
  hero.setHp(hero.maxHp);
  broadcastState();
}

export function snapshot() {
  return getHero().toSnapshot();
}

export function clear() {
  activeHero = null;
  activeHeroId = null;
}
