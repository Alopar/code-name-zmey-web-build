import { RESOURCE_TYPES } from "./config/resources.js";

/**
 * @param {import("./entities/Party.js").Party} party
 * @returns {Record<string, number>}
 */
export function getTacticalResourcesFromParty(party) {
  const snapshot = party.toSnapshot().resources;
  /** @type {Record<string, number>} */
  const tactical = {};

  for (const resource of snapshot) {
    if (resource.type === RESOURCE_TYPES.TACTICAL) {
      tactical[resource.id] = resource.count;
    }
  }

  return tactical;
}

/**
 * @param {Array<{ id: string, type: string, count: number }>} resources
 * @returns {Record<string, number>}
 */
export function getTacticalResourceCounts(resources) {
  /** @type {Record<string, number>} */
  const tactical = {};

  for (const resource of resources) {
    if (resource.type === RESOURCE_TYPES.TACTICAL) {
      tactical[resource.id] = resource.count;
    }
  }

  return tactical;
}
