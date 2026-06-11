/** @type {Readonly<Record<string, { id: string, label: string }>>} */
export const LOCATION_ACTIONS = Object.freeze({
  retreat: Object.freeze({
    id: "retreat",
    label: "Отступить",
  }),
  leave: Object.freeze({
    id: "leave",
    label: "Уйти",
  }),
});

/**
 * @param {string} actionId
 * @returns {typeof LOCATION_ACTIONS[string]}
 */
export function getLocationActionConfig(actionId) {
  const config = LOCATION_ACTIONS[actionId];
  if (!config) {
    throw new Error(`[Locations] Конфиг действия локации «${actionId}» не найден`);
  }
  return config;
}
