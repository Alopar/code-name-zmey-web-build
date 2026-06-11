/** @typedef {{ x: number, y: number, kind: "enemy" | "loot" | "chest" }} DebugPivot */
/** @typedef {{ x: number, y: number, width: number, height: number, kind: "enemy" | "loot" | "chest" }} DebugBounds */

const COLORS = Object.freeze({
  enemy: 0xf0c040,
  loot: 0x5ec8e8,
  chest: 0xf08050,
});

const CIRCLE_RADIUS = 12;
const CROSS_EXTEND = 6;
const PIVOT_LINE_WIDTH = 2;
const BOUNDS_LINE_WIDTH = 1.5;

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {DebugPivot} pivot
 */
function drawPivotMarker(graphics, pivot) {
  const color = COLORS[pivot.kind] ?? 0xffffff;
  const { x, y } = pivot;
  const crossHalf = CIRCLE_RADIUS + CROSS_EXTEND;

  graphics.lineStyle(PIVOT_LINE_WIDTH, color, 1);
  graphics.strokeCircle(x, y, CIRCLE_RADIUS);
  graphics.lineBetween(x - crossHalf, y, x + crossHalf, y);
  graphics.lineBetween(x, y - crossHalf, x, y + crossHalf);
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {DebugBounds} bounds
 */
function drawSpriteBounds(graphics, bounds) {
  const color = COLORS[bounds.kind] ?? 0xffffff;

  graphics.lineStyle(BOUNDS_LINE_WIDTH, color, 0.85);
  graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {{ pivots: DebugPivot[], bounds: DebugBounds[] }} targets
 */
export function drawDebugOverlay(graphics, targets) {
  graphics.clear();

  for (const bounds of targets.bounds) {
    drawSpriteBounds(graphics, bounds);
  }

  for (const pivot of targets.pivots) {
    drawPivotMarker(graphics, pivot);
  }
}
