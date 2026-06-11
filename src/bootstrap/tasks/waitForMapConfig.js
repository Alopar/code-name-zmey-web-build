import * as MapSession from "../../map/MapSession.js";

/**
 * Загружает PNG-маску карты и собирает MapConfig до входа в world map.
 * @returns {Promise<void>}
 */
export function waitForMapConfig() {
  return MapSession.ensureInitialized();
}
