import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as HeroSession from "../hero/HeroSession.js";

/**
 * @param {HTMLElement | null} bar
 * @param {HTMLElement | null} fill
 * @param {number} percent
 */
function setHpBar(bar, fill, percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  if (fill) {
    fill.style.width = `${clamped}%`;
  }
  if (bar) {
    bar.setAttribute("aria-valuenow", String(clamped));
  }
}

/**
 * @param {{ name?: string, hpPercent?: number }} hero
 */
function applyHeroState(hero) {
  const nameEl = document.getElementById("map-hero-name");
  const bar = document.getElementById("map-hero-hp-bar");
  const fill = document.getElementById("map-hero-hp-fill");

  if (nameEl && hero?.name) {
    nameEl.textContent = hero.name;
  }

  if (typeof hero?.hpPercent === "number") {
    setHpBar(bar, fill, hero.hpPercent);
  }
}

export function initHeroUI() {
  on(GameEvents.HERO_STATE_CHANGED, (detail) => {
    applyHeroState(detail?.hero);
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.space === GameSpace.WORLD_MAP) {
      applyHeroState(HeroSession.snapshot());
    }
  });
}
