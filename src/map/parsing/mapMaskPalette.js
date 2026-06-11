/** Размер маски карты в пикселях (ширина = высота). */
export const MAP_MASK_SIZE = 11;

/**
 * @typedef {"empty" | "path" | "location" | "start" | "exit"} MapMaskCellKind
 */

/**
 * @typedef {object} MapMaskRgb
 * @property {number} r
 * @property {number} g
 * @property {number} b
 */

/** @type {Readonly<Record<MapMaskCellKind, MapMaskRgb>>} */
export const MAP_MASK_PALETTE = Object.freeze({
  empty: { r: 0, g: 0, b: 0 },
  path: { r: 128, g: 128, b: 128 },
  location: { r: 255, g: 255, b: 255 },
  start: { r: 0, g: 255, b: 0 },
  exit: { r: 255, g: 255, b: 0 },
});

/** @type {ReadonlySet<MapMaskCellKind>} */
export const MAP_MASK_NODE_KINDS = new Set(["location", "start", "exit"]);

/**
 * @param {MapMaskRgb} a
 * @param {MapMaskRgb} b
 */
function rgbEquals(a, b) {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {MapMaskCellKind}
 */
export function classifyMaskPixel(r, g, b) {
  const pixel = { r, g, b };

  for (const [kind, color] of Object.entries(MAP_MASK_PALETTE)) {
    if (rgbEquals(pixel, color)) {
      return /** @type {MapMaskCellKind} */ (kind);
    }
  }

  throw new Error(
    `[MapMask] Неизвестный цвет пикселя RGB(${r}, ${g}, ${b}). ` +
      "Допустимы только цвета палитры маски.",
  );
}

/**
 * @param {number} row
 * @param {number} col
 */
export function formatGridCoord(row, col) {
  return `${row},${col}`;
}

/**
 * @param {number} row
 * @param {number} col
 */
export function createNodeId(row, col) {
  return `node_r${row}c${col}`;
}

/**
 * @param {string} nodeId
 * @returns {{ row: number, col: number } | null}
 */
export function parseNodeId(nodeId) {
  const match = /^node_r(\d+)c(\d+)$/.exec(nodeId);
  if (!match) {
    return null;
  }

  return {
    row: Number(match[1]),
    col: Number(match[2]),
  };
}
