import { AssetKey, ContainerFrame } from "../../game/Assets.js";
import { VIEWPORT_HEIGHT } from "../../core/Viewport.js";

const DEFAULT_SPRITE = Object.freeze({
  offsetX: 0,
  offsetY: 0,
});

const DEFAULT_SHADOW = Object.freeze({
  offsetX: 0,
  offsetY: 48,
  widthScale: 0.85,
  heightScale: 0.25,
  alpha: 0.55,
});

/** @type {Readonly<Record<string, object>>} */
export const LOOT_CONTAINER_CONFIGS = Object.freeze({
  medical: Object.freeze({
    id: "medical",
    name: "Медицинский ящик",
    visual: Object.freeze({
      assetKey: AssetKey.CONTAINER_MEDICAL,
      closed: ContainerFrame.CLOSED,
      open: ContainerFrame.OPEN,
      displayHeight: VIEWPORT_HEIGHT * 0.38,
      /** sprite/shadow.offsetX/offsetY — px кадра; shadow.layer — "behind" | "front" */
      sprite: DEFAULT_SPRITE,
      shadow: DEFAULT_SHADOW,
    }),
    interaction: Object.freeze({
      minTaps: 3,
      maxTaps: 3,
      tapEffects: Object.freeze(["softWhiteBlink", "shake"]),
      effectOptions: Object.freeze({
        softWhiteBlink: Object.freeze({ pulses: 1 }),
        shake: Object.freeze({
          offsetX: 7,
          offsetY: 5,
          duration: 28,
          repeats: 2,
        }),
      }),
    }),
    loot: Object.freeze({
      drops: Object.freeze([
        Object.freeze({ resourceId: "medkit", chance: 1, amount: 1 }),
        Object.freeze({ resourceId: "stimulator", chance: 1, amount: 1 }),
      ]),
    }),
  }),
  military_olive: Object.freeze({
    id: "military_olive",
    name: "Военный ящик",
    visual: Object.freeze({
      assetKey: AssetKey.CONTAINER_MILITARY_OLIVE,
      closed: ContainerFrame.CLOSED,
      open: ContainerFrame.OPEN,
      displayHeight: VIEWPORT_HEIGHT * 0.38,
      sprite: DEFAULT_SPRITE,
      shadow: DEFAULT_SHADOW,
    }),
    interaction: Object.freeze({
      minTaps: 3,
      maxTaps: 3,
      tapEffects: Object.freeze(["softWhiteBlink", "shake"]),
      effectOptions: Object.freeze({
        softWhiteBlink: Object.freeze({ pulses: 1 }),
        shake: Object.freeze({
          offsetX: 7,
          offsetY: 5,
          duration: 28,
          repeats: 2,
        }),
      }),
    }),
    loot: Object.freeze({
      drops: Object.freeze([
        Object.freeze({ resourceId: "grenade", chance: 1, amountMin: 1, amountMax: 2 }),
        Object.freeze({ resourceId: "stimulator", chance: 1, amountMin: 1, amountMax: 2 }),
      ]),
    }),
  }),
});

/**
 * @param {string} containerId
 */
export function getLootContainerConfig(containerId) {
  const config = LOOT_CONTAINER_CONFIGS[containerId];
  if (!config) {
    throw new Error(`[Loot] Конфиг контейнера «${containerId}» не найден`);
  }
  return config;
}
