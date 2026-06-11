import { getCombatSetupLocation } from "../locations/config/locations.js";
import * as HeroSession from "../hero/HeroSession.js";
import * as PartySession from "../party/PartySession.js";
import { MapNode } from "./entities/MapNode.js";

/**
 * @param {MapNode} node
 * @returns {import("../combat/CombatEncounter.js").CombatSetup}
 */
export function createCombatSetupFromNode(node) {
  const enemies = Array.from({ length: node.enemyCount }, () => ({
    enemyId: "baboon",
  }));

  return {
    location: getCombatSetupLocation("jungle_road"),
    settings: {
      mapNodeId: node.id,
    },
    player: HeroSession.getCombatSetup(PartySession.getTacticalResourcesForCombat()),
    enemies,
  };
}
