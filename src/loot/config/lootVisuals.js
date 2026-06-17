import { AssetKey } from "../../game/Assets.js";
import { VIEWPORT_HEIGHT } from "../../core/Viewport.js";

/** offsetY: 0 — центр тени на «земле» (точка опоры контейнера), не под тело как у врага. */
const DEFAULT_SPRITE = Object.freeze({
  offsetX: 0,
  offsetY: 0,
});

const DEFAULT_SHADOW = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  widthScale: 0.9,
  heightScale: 0.22,
  alpha: 0.85,
});

/** @type {Readonly<Record<string, object>>} */
export const LOOT_VISUAL_CONFIGS = Object.freeze({
  medkit: Object.freeze({
    assetKey: AssetKey.LOOT_MEDKIT,
    displayHeight: VIEWPORT_HEIGHT * 0.12,
    /** sprite/shadow.offsetX/offsetY — px кадра; shadow.layer — "behind" | "front" */
    sprite: DEFAULT_SPRITE,
    shadow: DEFAULT_SHADOW,
  }),
  stimulator: Object.freeze({
    assetKey: AssetKey.LOOT_STIMULATOR,
    displayHeight: VIEWPORT_HEIGHT * 0.1,
    sprite: DEFAULT_SPRITE,
    shadow: DEFAULT_SHADOW,
  }),
  grenade: Object.freeze({
    assetKey: AssetKey.LOOT_GRENADE,
    displayHeight: VIEWPORT_HEIGHT * 0.1,
    sprite: DEFAULT_SPRITE,
    shadow: DEFAULT_SHADOW,
  }),
});

/**
 * @param {string} resourceId
 */
export function getLootVisualConfig(resourceId) {
  const config = LOOT_VISUAL_CONFIGS[resourceId];
  if (!config) {
    throw new Error(`[Loot] Визуальный конфиг лута «${resourceId}» не найден`);
  }
  return config;
}
