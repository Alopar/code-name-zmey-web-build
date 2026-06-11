/** @type {{ movePlayerTo: (nodeId: string) => Promise<void>, isPlayerMoving: () => boolean, refresh: () => void } | null} */
let activeWorld = null;

/**
 * @param {{ movePlayerTo: (nodeId: string) => Promise<void>, isPlayerMoving: () => boolean, refresh: () => void }} api
 */
export function registerMapWorld(api) {
  activeWorld = api;
}

export function unregisterMapWorld() {
  activeWorld = null;
}

export function getMapWorld() {
  return activeWorld;
}
