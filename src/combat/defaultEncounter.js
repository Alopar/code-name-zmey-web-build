import { getCombatSetupLocation } from "../locations/config/locations.js";
import * as HeroSession from "../hero/HeroSession.js";
import * as PartySession from "../party/PartySession.js";

/** Dev / fallback встреча: джунгли, два бабуина. */
export function createDefaultTestEncounter() {
  return {
    location: getCombatSetupLocation("jungle_road"),
    settings: {},
    player: HeroSession.getCombatSetup(PartySession.getTacticalResourcesForCombat()),
    enemies: [{ enemyId: "baboon" }, { enemyId: "baboon" }],
  };
}
