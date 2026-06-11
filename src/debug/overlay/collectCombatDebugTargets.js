/** @typedef {import("./drawDebugOverlay.js").DebugBounds} DebugBounds */
/** @typedef {import("./drawDebugOverlay.js").DebugPivot} DebugPivot */

/**
 * @typedef {object} CombatDebugTargets
 * @property {DebugPivot[]} pivots
 * @property {DebugBounds[]} bounds
 */

/**
 * @param {Phaser.GameObjects.Sprite | null | undefined} sprite
 * @param {"enemy" | "loot" | "chest"} kind
 * @returns {DebugBounds | null}
 */
function collectSpriteBounds(sprite, kind) {
  if (!sprite?.active) {
    return null;
  }

  const rect = sprite.getBounds();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    kind,
  };
}

/**
 * @param {import("../../game/scenes/CombatScene.js").CombatScene | null | undefined} scene
 * @returns {CombatDebugTargets}
 */
export function collectCombatDebugTargets(scene) {
  /** @type {DebugPivot[]} */
  const pivots = [];
  /** @type {DebugBounds[]} */
  const bounds = [];

  if (!scene) {
    return { pivots, bounds };
  }

  for (const view of scene.enemyViews?.values() ?? []) {
    const pivot = view.pivot ?? view.container;
    if (!pivot?.active) {
      continue;
    }

    pivots.push({
      x: pivot.x,
      y: pivot.y,
      kind: "enemy",
    });

    const spriteBounds = collectSpriteBounds(view.sprite, "enemy");
    if (spriteBounds) {
      bounds.push(spriteBounds);
    }
  }

  for (const view of scene.lootViews?.values() ?? []) {
    const pivot = view.pivot ?? view.container;
    if (!pivot?.active) {
      continue;
    }

    pivots.push({
      x: pivot.x,
      y: pivot.y,
      kind: "loot",
    });

    const spriteBounds = collectSpriteBounds(view.sprite, "loot");
    if (spriteBounds) {
      bounds.push(spriteBounds);
    }
  }

  for (const view of scene.chestViews?.values() ?? []) {
    const pivot = view.pivot ?? view.container;
    if (!pivot?.active) {
      continue;
    }

    pivots.push({
      x: pivot.x,
      y: pivot.y,
      kind: "chest",
    });

    const spriteBounds = collectSpriteBounds(view.sprite, "chest");
    if (spriteBounds) {
      bounds.push(spriteBounds);
    }
  }

  return { pivots, bounds };
}
