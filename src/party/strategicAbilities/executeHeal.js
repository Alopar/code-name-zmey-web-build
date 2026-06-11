import * as HeroSession from "../../hero/HeroSession.js";
import { getStrategicAbilityConfig } from "../config/strategicAbilities.js";

/**
 * @param {import("../entities/Party.js").Party} party
 * @param {import("../../hero/entities/Hero.js").Hero} hero
 * @returns {{ success: boolean, reason?: string }}
 */
export function executeHeal(party, hero) {
  const ability = getStrategicAbilityConfig("heal");

  if (hero.hp >= hero.maxHp) {
    return { success: false, reason: "full_hp" };
  }

  if (party.getResourceCount(ability.resourceId) < ability.resourceCost) {
    return { success: false, reason: "no_resource" };
  }

  const consumed = party.consumeResource(ability.resourceId, ability.resourceCost);
  if (!consumed) {
    return { success: false, reason: "no_resource" };
  }

  HeroSession.restoreFullHp();
  return { success: true };
}
