import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";

const MAP_USABLE_WIDTH_RATIO = 0.78;
const MAP_USABLE_HEIGHT_RATIO = 0.62;
const MAX_CELL_SIZE = 132;
const MIN_CELL_SIZE = 72;

/**
 * @typedef {object} GridPoint
 * @property {number} row
 * @property {number} col
 */

/**
 * @param {Iterable<GridPoint>} points
 */
export function computeGridBounds(points) {
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minRow = Math.min(minRow, point.row);
    maxRow = Math.max(maxRow, point.row);
    minCol = Math.min(minCol, point.col);
    maxCol = Math.max(maxCol, point.col);
  }

  return { minRow, maxRow, minCol, maxCol };
}

/**
 * @param {number} minRow
 * @param {number} maxRow
 * @param {number} minCol
 * @param {number} maxCol
 */
export function resolveCellSize(minRow, maxRow, minCol, maxCol) {
  const gridWidth = maxCol - minCol + 1;
  const gridHeight = maxRow - minRow + 1;
  const usableWidth = VIEWPORT_WIDTH * MAP_USABLE_WIDTH_RATIO;
  const usableHeight = VIEWPORT_HEIGHT * MAP_USABLE_HEIGHT_RATIO;

  const cellSize = Math.min(
    usableWidth / gridWidth,
    usableHeight / gridHeight,
    MAX_CELL_SIZE,
  );

  return Math.max(MIN_CELL_SIZE, Math.floor(cellSize));
}

/**
 * @param {Iterable<GridPoint>} points
 */
export function createMapLayout(points) {
  const bounds = computeGridBounds(points);
  const cellSize = resolveCellSize(
    bounds.minRow,
    bounds.maxRow,
    bounds.minCol,
    bounds.maxCol,
  );

  const gridWidth = bounds.maxCol - bounds.minCol + 1;
  const gridHeight = bounds.maxRow - bounds.minRow + 1;
  const totalWidth = gridWidth * cellSize;
  const totalHeight = gridHeight * cellSize;
  const originX = VIEWPORT_WIDTH / 2 - totalWidth / 2;
  const originY = VIEWPORT_HEIGHT * 0.48 - totalHeight / 2;

  /**
   * @param {number} row
   * @param {number} col
   */
  function toScreen(row, col) {
    return {
      x: originX + (col - bounds.minCol) * cellSize + cellSize / 2,
      y: originY + (row - bounds.minRow) * cellSize + cellSize / 2,
    };
  }

  return {
    cellSize,
    bounds,
    toScreen,
  };
}
