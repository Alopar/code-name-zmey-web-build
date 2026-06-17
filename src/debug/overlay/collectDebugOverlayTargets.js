/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */

/**
 * @param {DebugEntityAdapter[]} entities
 * @returns {{ pivots: import("./drawDebugOverlay.js").DebugPivot[], bounds: import("./drawDebugOverlay.js").DebugBounds[] }}
 */
export function collectDebugOverlayTargets(entities) {
  /** @type {import("./drawDebugOverlay.js").DebugPivot[]} */
  const pivots = [];
  /** @type {import("./drawDebugOverlay.js").DebugBounds[]} */
  const bounds = [];

  for (const entity of entities) {
    if (!entity.isAlive()) {
      continue;
    }

    pivots.push({
      x: entity.pivot.x,
      y: entity.pivot.y,
      kind: entity.kind,
      instanceId: entity.instanceId,
    });

    const spriteBounds = entity.getBounds();
    if (spriteBounds) {
      bounds.push({
        x: spriteBounds.x,
        y: spriteBounds.y,
        width: spriteBounds.width,
        height: spriteBounds.height,
        kind: entity.kind,
        instanceId: entity.instanceId,
      });
    }
  }

  return { pivots, bounds };
}
