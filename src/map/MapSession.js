import { createJungleZoneMapConfig } from "./config/jungleZoneMap.js";
import { MapGraph } from "./MapGraph.js";

/** @type {MapGraph | null} */
let activeGraph = null;

/** @type {string | null} */
let pendingCombatNodeId = null;

/** @type {Promise<void> | null} */
let initPromise = null;

/**
 * @param {import("./MapGraph.js").MapConfig} config
 */
export function begin(config) {
  activeGraph = MapGraph.fromConfig(config);
  pendingCombatNodeId = null;
}

/**
 * @returns {Promise<void>}
 */
export async function ensureInitialized() {
  if (activeGraph) {
    return;
  }

  if (!initPromise) {
    initPromise = createJungleZoneMapConfig()
      .then((config) => {
        begin(config);
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }

  await initPromise;
}

export async function reset() {
  const config = await createJungleZoneMapConfig();
  begin(config);
}

export function getGraph() {
  if (!activeGraph) {
    throw new Error("[MapSession] Карта не инициализирована. Сначала вызовите ensureInitialized().");
  }
  return activeGraph;
}

export function getCurrentNodeId() {
  return getGraph().currentNodeId;
}

/**
 * @param {string} nodeId
 */
export function setPendingCombat(nodeId) {
  pendingCombatNodeId = nodeId;
}

export function getPendingCombatNodeId() {
  return pendingCombatNodeId;
}

export function clearPendingCombat() {
  pendingCombatNodeId = null;
}

export function completePendingNode() {
  if (!pendingCombatNodeId) {
    return null;
  }

  const nodeId = pendingCombatNodeId;
  getGraph().completeNode(nodeId);
  pendingCombatNodeId = null;
  return nodeId;
}

export function clear() {
  activeGraph = null;
  pendingCombatNodeId = null;
}
