export const ShadowLayer = Object.freeze({
  BEHIND: "behind",
  FRONT: "front",
});

/**
 * @param {object} [shadow]
 * @returns {typeof ShadowLayer[keyof typeof ShadowLayer]}
 */
export function resolveShadowLayer(shadow = {}) {
  const raw = shadow.layer;
  if (raw === ShadowLayer.FRONT || raw === "inFront" || raw === "front") {
    return ShadowLayer.FRONT;
  }
  if (raw === false || shadow.behindSprite === false) {
    return ShadowLayer.FRONT;
  }
  return ShadowLayer.BEHIND;
}

/**
 * @param {Phaser.GameObjects.Container} pivot
 * @param {Phaser.GameObjects.Container} view
 * @param {Phaser.GameObjects.Image} shadow
 * @param {typeof ShadowLayer[keyof typeof ShadowLayer]} [layer]
 */
export function attachCombatShadow(pivot, view, shadow, layer = ShadowLayer.BEHIND) {
  if (layer === ShadowLayer.FRONT) {
    pivot.add(shadow);
    return;
  }

  const viewIndex = pivot.getIndex(view);
  if (viewIndex < 0) {
    pivot.addAt(shadow, 0);
    return;
  }

  pivot.addAt(shadow, viewIndex);
}

/**
 * @param {Phaser.GameObjects.Container} pivot
 * @param {Phaser.GameObjects.Container} view
 * @param {Phaser.GameObjects.Image} shadow
 * @returns {typeof ShadowLayer[keyof typeof ShadowLayer]}
 */
export function getShadowLayerFromPivot(pivot, view, shadow) {
  const shadowIndex = pivot.getIndex(shadow);
  const viewIndex = pivot.getIndex(view);
  if (shadowIndex < 0 || viewIndex < 0) {
    return ShadowLayer.BEHIND;
  }

  return shadowIndex < viewIndex ? ShadowLayer.BEHIND : ShadowLayer.FRONT;
}

/**
 * @param {Phaser.GameObjects.Container} pivot
 * @param {Phaser.GameObjects.Container} view
 * @param {Phaser.GameObjects.Image} shadow
 * @param {typeof ShadowLayer[keyof typeof ShadowLayer]} layer
 */
export function setCombatShadowLayer(pivot, view, shadow, layer) {
  pivot.remove(shadow, false);
  attachCombatShadow(pivot, view, shadow, layer);
}
