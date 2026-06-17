/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */

/**
 * @param {DebugEntityAdapter} entity
 * @param {number} dx
 * @param {number} dy
 */
export function nudgeSpriteOffset(entity, dx, dy) {
  const offset = entity.getSpriteOffset();
  entity.setSpriteOffset(offset.x + dx, offset.y + dy);
}

/**
 * @param {DebugEntityAdapter} entity
 * @param {number} dx
 * @param {number} dy
 */
export function nudgeShadowOffset(entity, dx, dy) {
  const offset = entity.getShadowOffset();
  entity.setShadowOffset(offset.x + dx, offset.y + dy);
}
