import { buildMapConfigFromMask } from "../parsing/buildMapConfigFromMask.js";
import { loadMapMaskImage } from "../parsing/loadMapMaskImage.js";
import { JUNGLE_ZONE_MAP_META } from "./jungleZoneMapMeta.js";

export const JUNGLE_ZONE_MAP_MASK_URL = "assets/images/maps/jungle-zone-map-mask.png";

/** @type {import("../MapGraph.js").MapConfig | null} */
let cachedConfig = null;

/**
 * @returns {Promise<import("../MapGraph.js").MapConfig>}
 */
export async function createJungleZoneMapConfig() {
  if (cachedConfig) {
    return {
      nodes: cachedConfig.nodes.map((node) => ({
        ...node,
        grid: { ...node.grid },
        position: { ...node.position },
        connections: [...node.connections],
      })),
      edges: cachedConfig.edges.map((edge) => ({
        ...edge,
        points: edge.points.map((point) => ({ ...point })),
      })),
      startNodeId: cachedConfig.startNodeId,
    };
  }

  const mask = await loadMapMaskImage(JUNGLE_ZONE_MAP_MASK_URL);
  cachedConfig = buildMapConfigFromMask(mask, JUNGLE_ZONE_MAP_META);
  return createJungleZoneMapConfig();
}

/**
 * Сброс кэша (для dev-перезагрузки маски).
 */
export function clearJungleZoneMapCache() {
  cachedConfig = null;
}
