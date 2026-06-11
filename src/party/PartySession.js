import { emit, GameEvents } from "../core/EventBus.js";
import { DEFAULT_PARTY_CONFIG } from "./config/defaultParty.js";
import { RESOURCE_TYPES } from "./config/resources.js";
import { getStrategicAbilityConfig } from "./config/strategicAbilities.js";
import { Party } from "./entities/Party.js";
import * as HeroSession from "../hero/HeroSession.js";
import { executeStrategicAbility } from "./strategicAbilities/index.js";
import { getTacticalResourcesFromParty } from "./tacticalResources.js";

/** @type {Party | null} */
let activeParty = null;

function broadcastState() {
  emit(GameEvents.PARTY_STATE_CHANGED, { party: snapshot() });
}

export function begin() {
  activeParty = Party.fromConfig(DEFAULT_PARTY_CONFIG);
  broadcastState();
}

export function reset() {
  begin();
}

export function getParty() {
  if (!activeParty) {
    begin();
  }
  return activeParty;
}

export function snapshot() {
  return getParty().toSnapshot();
}

export function clear() {
  activeParty = null;
}

/**
 * @param {string} resourceId
 * @param {number} amount
 */
export function consumeResource(resourceId, amount) {
  const consumed = getParty().consumeResource(resourceId, amount);
  if (consumed) {
    broadcastState();
  }
  return consumed;
}

/**
 * @param {string} resourceId
 * @param {number} amount
 */
export function addResource(resourceId, amount) {
  getParty().addResource(resourceId, amount);
  broadcastState();
}

/**
 * @param {string} abilityId
 * @returns {{ success: boolean, reason?: string }}
 */
export function getTacticalResourcesForCombat() {
  return getTacticalResourcesFromParty(getParty());
}

/**
 * @param {Array<{ id: string, type: string, count: number }>} resources
 */
export function syncTacticalResourcesFromCombat(resources) {
  const party = getParty();

  for (const resource of resources) {
    if (resource.type !== RESOURCE_TYPES.TACTICAL) {
      continue;
    }
    party.setResourceCount(resource.id, resource.count);
  }

  broadcastState();
}

export function useStrategicAbility(abilityId) {
  getStrategicAbilityConfig(abilityId);
  const party = getParty();
  const hero = HeroSession.getHero();
  const result = executeStrategicAbility(abilityId, party, hero);

  if (result.success) {
    broadcastState();
  }

  return result;
}
