import {
  getShadowLayerFromPivot,
  setCombatShadowLayer,
  ShadowLayer,
} from "../../game/attachCombatShadow.js";

/** @typedef {"enemy" | "loot" | "chest"} DebugEntityKind */

/**
 * @typedef {object} DebugEntityAdapter
 * @property {DebugEntityKind} kind
 * @property {string} instanceId
 * @property {string} configId
 * @property {boolean} canEditOffsets
 * @property {Phaser.GameObjects.Container} pivot
 * @property {Phaser.GameObjects.Container} view
 * @property {Phaser.GameObjects.Sprite} sprite
 * @property {Phaser.GameObjects.Image} shadow
 * @property {() => { x: number, y: number }} getSpriteOffset
 * @property {(x: number, y: number) => void} setSpriteOffset
 * @property {() => { x: number, y: number }} getShadowOffset
 * @property {(x: number, y: number) => void} setShadowOffset
 * @property {() => typeof ShadowLayer[keyof typeof ShadowLayer]} getShadowLayer
 * @property {(layer: typeof ShadowLayer[keyof typeof ShadowLayer]) => void} setShadowLayer
 * @property {() => typeof ShadowLayer[keyof typeof ShadowLayer]} toggleShadowLayer
 * @property {() => number} getBaseScale
 * @property {() => Phaser.Geom.Rectangle | null} getBounds
 * @property {() => boolean} isAlive
 */

/**
 * @param {{
 *   kind: DebugEntityKind,
 *   instanceId: string,
 *   configId: string,
 *   canEditOffsets: boolean,
 *   pivot: Phaser.GameObjects.Container,
 *   view: Phaser.GameObjects.Container,
 *   sprite: Phaser.GameObjects.Sprite,
 *   shadow: Phaser.GameObjects.Image,
 * }} params
 * @returns {DebugEntityAdapter}
 */
export function createWorldRigDebugAdapter({
  kind,
  instanceId,
  configId,
  canEditOffsets,
  pivot,
  view,
  sprite,
  shadow,
}) {
  return {
    kind,
    instanceId,
    configId,
    canEditOffsets,
    pivot,
    view,
    sprite,
    shadow,
    getSpriteOffset() {
      return { x: sprite.x, y: sprite.y };
    },
    setSpriteOffset(x, y) {
      sprite.setPosition(x, y);
    },
    getShadowOffset() {
      return { x: shadow.x, y: shadow.y };
    },
    setShadowOffset(x, y) {
      shadow.setPosition(x, y);
    },
    getShadowLayer() {
      return getShadowLayerFromPivot(pivot, view, shadow);
    },
    setShadowLayer(layer) {
      setCombatShadowLayer(pivot, view, shadow, layer);
    },
    toggleShadowLayer() {
      const next =
        getShadowLayerFromPivot(pivot, view, shadow) === ShadowLayer.BEHIND
          ? ShadowLayer.FRONT
          : ShadowLayer.BEHIND;
      setCombatShadowLayer(pivot, view, shadow, next);
      return next;
    },
    getBaseScale() {
      if (!sprite.active || sprite.height <= 0) {
        return 1;
      }
      return sprite.displayHeight / sprite.height;
    },
    getBounds() {
      if (!sprite?.active) {
        return null;
      }

      const rect = sprite.getBounds();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      return rect;
    },
    isAlive() {
      return Boolean(pivot?.active);
    },
  };
}
