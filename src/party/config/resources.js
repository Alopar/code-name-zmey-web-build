export const RESOURCE_TYPES = Object.freeze({
  STRATEGIC: "strategic",
  TACTICAL: "tactical",
});

/** @type {Readonly<Record<string, object>>} */
export const RESOURCE_CONFIGS = Object.freeze({
  medkit: Object.freeze({
    id: "medkit",
    name: "Аптечка",
    type: RESOURCE_TYPES.STRATEGIC,
  }),
  stimulator: Object.freeze({
    id: "stimulator",
    name: "Стимулятор",
    type: RESOURCE_TYPES.TACTICAL,
  }),
  grenade: Object.freeze({
    id: "grenade",
    name: "Граната",
    type: RESOURCE_TYPES.TACTICAL,
  }),
});

/**
 * @param {string} resourceId
 * @returns {typeof RESOURCE_CONFIGS[string]}
 */
export function getResourceConfig(resourceId) {
  const config = RESOURCE_CONFIGS[resourceId];
  if (!config) {
    throw new Error(`[Party] Конфиг ресурса «${resourceId}» не найден`);
  }
  return config;
}
