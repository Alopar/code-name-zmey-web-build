import { getResourceConfig } from "../../party/config/resources.js";
import { INFO_TOAST_MESSAGES } from "./config/infoToastTypes.js";

/**
 * @param {{ resourceId: string, amount: number }} drop
 * @returns {string}
 */
export function formatLootMessage(drop) {
  const config = getResourceConfig(drop.resourceId);
  return INFO_TOAST_MESSAGES.lootFormat
    .replace("{name}", config.name)
    .replace("{amount}", String(drop.amount));
}
