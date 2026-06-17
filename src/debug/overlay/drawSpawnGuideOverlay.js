import { VIEWPORT_WIDTH } from "../../core/Viewport.js";
import { SCREEN_CENTER_X } from "../../combat/config/combatSpawnGuideConstants.js";

const SELECTED_COLOR = 0x40e060;

const LINE_COLORS = Object.freeze({
  enemy: 0xf04040,
  chest: 0x5ec8e8,
});

const MARKER_HALF = 10;
const CROSS_EXTEND = 5;

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {number} worldY
 * @param {number} color
 * @param {boolean} selected
 */
function drawHorizontalSpawnLine(graphics, worldY, color, selected) {
  const lineColor = selected ? SELECTED_COLOR : color;

  graphics.lineStyle(selected ? 2.5 : 1.5, lineColor, selected ? 1 : 0.8);
  graphics.lineBetween(0, worldY, VIEWPORT_WIDTH, worldY);

  const crossHalf = MARKER_HALF + CROSS_EXTEND;
  graphics.lineStyle(2, lineColor, 1);
  graphics.strokeRect(
    SCREEN_CENTER_X - MARKER_HALF,
    worldY - MARKER_HALF,
    MARKER_HALF * 2,
    MARKER_HALF * 2,
  );
  graphics.lineBetween(SCREEN_CENTER_X - crossHalf, worldY, SCREEN_CENTER_X + crossHalf, worldY);
  graphics.lineBetween(SCREEN_CENTER_X, worldY - crossHalf, SCREEN_CENTER_X, worldY + crossHalf);
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {{
 *   enemy: { y: number, instanceId: string } | null,
 *   chest: { y: number, instanceId: string } | null,
 * }} lines
 * @param {{ kind: string, instanceId: string } | null} [selection]
 */
export function drawSpawnGuideOverlay(graphics, lines, selection = null) {
  if (lines.enemy) {
    const selected =
      selection?.kind === "spawnGuide" && selection.instanceId === lines.enemy.instanceId;
    drawHorizontalSpawnLine(graphics, lines.enemy.y, LINE_COLORS.enemy, selected);
  }

  if (lines.chest) {
    const selected =
      selection?.kind === "spawnGuide" && selection.instanceId === lines.chest.instanceId;
    drawHorizontalSpawnLine(graphics, lines.chest.y, LINE_COLORS.chest, selected);
  }
}
