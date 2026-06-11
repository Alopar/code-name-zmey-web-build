import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as CombatSession from "../combat/CombatSession.js";
import * as PartySession from "../party/PartySession.js";
import * as HeroSession from "./HeroSession.js";

function syncActiveCombatToHero() {
  const player = CombatSession.getEncounter()?.player;
  if (!player) {
    return;
  }

  HeroSession.syncFromCombatPlayer(player);

  const resources = player.resources?.toSnapshot() ?? [];
  if (resources.length > 0) {
    PartySession.syncTacticalResourcesFromCombat(resources);
  }
}

/**
 * @returns {() => void}
 */
export function initHeroController() {
  const unsub = on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.prev !== GameSpace.COMBAT) {
      return;
    }

    syncActiveCombatToHero();
  });

  return () => {
    unsub();
  };
}
