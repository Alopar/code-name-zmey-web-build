/** @typedef {{ x: number, y: number, kind: "enemy" | "loot" | "chest", instanceId: string }} DebugPivot */
/** @typedef {{ x: number, y: number, width: number, height: number, kind: "enemy" | "loot" | "chest", instanceId: string }} DebugBounds */

const COLORS = Object.freeze({
  enemy: 0xf04040,
  loot: 0x4488ff,
  chest: 0x5ec8e8,
});

const SELECTED_COLOR = 0x40e060;

const CIRCLE_RADIUS = 12;
const CROSS_EXTEND = 6;
const PIVOT_LINE_WIDTH = 2;
const BOUNDS_LINE_WIDTH = 1.5;

/**
 * @param {DebugPivot} pivot
 * @param {{ kind: string, instanceId: string } | null} selection
 */
function isSelected(pivot, selection) {
  return (
    selection != null &&
    pivot.kind === selection.kind &&
    pivot.instanceId === selection.instanceId
  );
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {DebugPivot} pivot
 * @param {{ kind: string, instanceId: string } | null} selection
 */
function drawPivotMarker(graphics, pivot, selection) {
  const color = isSelected(pivot, selection)
    ? SELECTED_COLOR
    : (COLORS[pivot.kind] ?? 0xffffff);
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
 * @param {{ kind: string, instanceId: string } | null} selection
 */
function drawSpriteBounds(graphics, bounds, selection) {
  const color = isSelected(bounds, selection)
    ? SELECTED_COLOR
    : (COLORS[bounds.kind] ?? 0xffffff);

  graphics.lineStyle(BOUNDS_LINE_WIDTH, color, 0.85);
  graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {{ pivots: DebugPivot[], bounds: DebugBounds[] }} targets
 * @param {{ kind: string, instanceId: string } | null} [selection]
 */
export function drawDebugOverlay(graphics, targets, selection = null) {
  graphics.clear();

  for (const bounds of targets.bounds) {
    drawSpriteBounds(graphics, bounds, selection);
  }

  for (const pivot of targets.pivots) {
    drawPivotMarker(graphics, pivot, selection);
  }
}
