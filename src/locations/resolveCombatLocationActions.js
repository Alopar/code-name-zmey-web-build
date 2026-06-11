import { getLocationActionConfig } from "./config/locationActions.js";
import { getLocationConfig } from "./config/locations.js";

/**
 * @typedef {object} CombatLocationActionState
 * @property {string} id
 * @property {string} label
 * @property {boolean} canUse
 */

/**
 * @param {{ hp?: number }[]} [enemies]
 */
function hasAliveEnemies(enemies) {
  return Boolean(enemies?.some((enemy) => (enemy.hp ?? 0) > 0));
}

/**
 * @param {string} actionId
 * @param {{ phase?: string, enemies?: Array<{ hp?: number }>, showLeave?: boolean }} context
 */
function isActionApplicable(actionId, context) {
  const { phase, enemies, showLeave = false } = context;

  switch (actionId) {
    case "retreat":
      return phase !== "ended" && hasAliveEnemies(enemies);
    case "leave":
      return phase === "ended" && showLeave;
    default:
      return false;
  }
}

/**
 * @param {string} actionId
 * @param {{ phase?: string }} context
 */
function canUseAction(actionId, context) {
  const { phase } = context;

  switch (actionId) {
    case "retreat":
      return phase === "player";
    case "leave":
      return true;
    default:
      return false;
  }
}

/**
 * @param {{
 *   locationId?: string,
 *   phase?: string,
 *   enemies?: Array<{ hp?: number }>,
 *   showLeave?: boolean,
 * }} params
 * @returns {CombatLocationActionState[]}
 */
export function resolveCombatLocationActions(params) {
  const { locationId, phase, enemies, showLeave = false } = params;
  if (!locationId) {
    return [];
  }

  const locationConfig = getLocationConfig(locationId);
  const context = { phase, enemies, showLeave };
  const actions = [];

  for (const actionId of locationConfig.actionIds) {
    if (!isActionApplicable(actionId, context)) {
      continue;
    }

    const config = getLocationActionConfig(actionId);
    actions.push({
      id: config.id,
      label: config.label,
      canUse: canUseAction(actionId, context),
    });
  }

  return actions;
}
