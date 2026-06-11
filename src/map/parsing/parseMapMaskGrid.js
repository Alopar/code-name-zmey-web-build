import {
  MAP_MASK_NODE_KINDS,
  MAP_MASK_SIZE,
  classifyMaskPixel,
  createNodeId,
  formatGridCoord,
} from "./mapMaskPalette.js";

/**
 * @typedef {import("./mapMaskPalette.js").MapMaskCellKind} MapMaskCellKind
 */

/**
 * @typedef {object} MapMaskCell
 * @property {number} row
 * @property {number} col
 * @property {MapMaskCellKind} kind
 */

/**
 * @typedef {object} ParsedMapMask
 * @property {number} width
 * @property {number} height
 * @property {MapMaskCell[][]} cells
 * @property {Map<string, MapMaskCell>} nodesById
 * @property {string} startNodeId
 * @property {string[]} exitNodeIds
 */

const DIRECTIONS = Object.freeze([
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]);

/**
 * @param {Uint8ClampedArray} pixels
 * @param {number} width
 * @param {number} height
 * @returns {ParsedMapMask}
 */
export function parseMapMaskPixels(pixels, width, height) {
  if (width !== MAP_MASK_SIZE || height !== MAP_MASK_SIZE) {
    throw new Error(
      `[MapMask] Ожидался размер ${MAP_MASK_SIZE}×${MAP_MASK_SIZE}, получено ${width}×${height}.`,
    );
  }

  /** @type {MapMaskCell[][]} */
  const cells = [];
  /** @type {Map<string, MapMaskCell>} */
  const nodesById = new Map();
  /** @type {string[]} */
  const exitNodeIds = [];
  let startNodeId = "";

  for (let row = 0; row < height; row += 1) {
    /** @type {MapMaskCell[]} */
    const rowCells = [];

    for (let col = 0; col < width; col += 1) {
      const index = (row * width + col) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      if (a < 255) {
        throw new Error(
          `[MapMask] Пиксель (${col}, ${row}) не полностью непрозрачен (alpha=${a}).`,
        );
      }

      const kind = classifyMaskPixel(r, g, b);
      const cell = { row, col, kind };
      rowCells.push(cell);

      if (!MAP_MASK_NODE_KINDS.has(kind)) {
        continue;
      }

      const nodeId = createNodeId(row, col);
      if (nodesById.has(nodeId)) {
        throw new Error(`[MapMask] Дублирующаяся нода в (${col}, ${row}).`);
      }

      nodesById.set(nodeId, cell);

      if (kind === "start") {
        if (startNodeId) {
          throw new Error("[MapMask] На карте больше одной стартовой ноды.");
        }
        startNodeId = nodeId;
      }

      if (kind === "exit") {
        exitNodeIds.push(nodeId);
      }
    }

    cells.push(rowCells);
  }

  if (!startNodeId) {
    throw new Error("[MapMask] Стартовая нода (зелёный пиксель) не найдена.");
  }

  if (exitNodeIds.length === 0) {
    throw new Error("[MapMask] Выходная нода (жёлтый пиксель) не найдена.");
  }

  return {
    width,
    height,
    cells,
    nodesById,
    startNodeId,
    exitNodeIds,
  };
}

/**
 * @param {ParsedMapMask} mask
 * @param {number} row
 * @param {number} col
 */
function getCell(mask, row, col) {
  if (row < 0 || col < 0 || row >= mask.height || col >= mask.width) {
    return null;
  }
  return mask.cells[row][col];
}

/**
 * @param {ParsedMapMask} mask
 * @param {number} row
 * @param {number} col
 */
function isWalkablePath(mask, row, col) {
  const cell = getCell(mask, row, col);
  return cell?.kind === "path";
}

/**
 * @param {ParsedMapMask} mask
 * @param {number} row
 * @param {number} col
 */
function isNodeCell(mask, row, col) {
  const cell = getCell(mask, row, col);
  return cell != null && MAP_MASK_NODE_KINDS.has(cell.kind);
}

/**
 * @typedef {object} MaskGraphEdge
 * @property {string} fromId
 * @property {string} toId
 * @property {{ row: number, col: number }[]} gridPath
 */

/**
 * @param {ParsedMapMask} mask
 * @returns {MaskGraphEdge[]}
 */
export function extractMaskGraphEdges(mask) {
  /** @type {MaskGraphEdge[]} */
  const edges = [];
  /** @type {Set<string>} */
  const seen = new Set();

  for (const [fromId, fromNode] of mask.nodesById) {
    /** @type {Set<string>} */
    const visited = new Set([formatGridCoord(fromNode.row, fromNode.col)]);
    /** @type {{ row: number, col: number, path: { row: number, col: number }[] }[]} */
    const queue = [{ row: fromNode.row, col: fromNode.col, path: [] }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      for (const dir of DIRECTIONS) {
        const nextRow = current.row + dir.row;
        const nextCol = current.col + dir.col;
        const key = formatGridCoord(nextRow, nextCol);

        if (visited.has(key)) {
          continue;
        }

        const nextCell = getCell(mask, nextRow, nextCol);
        if (!nextCell) {
          continue;
        }

        if (isNodeCell(mask, nextRow, nextCol)) {
          const toId = createNodeId(nextRow, nextCol);
          if (toId === fromId) {
            continue;
          }

          if (current.path.length === 0) {
            continue;
          }

          const edgeKey = [fromId, toId].sort().join("|");
          if (!seen.has(edgeKey)) {
            seen.add(edgeKey);
            edges.push({
              fromId,
              toId,
              gridPath: current.path.map((point) => ({ ...point })),
            });
          }
          continue;
        }

        if (!isWalkablePath(mask, nextRow, nextCol)) {
          continue;
        }

        visited.add(key);
        queue.push({
          row: nextRow,
          col: nextCol,
          path: [...current.path, { row: nextRow, col: nextCol }],
        });
      }
    }
  }

  validateMaskGraph(mask, edges);
  return edges;
}

/**
 * @param {ParsedMapMask} mask
 * @param {MaskGraphEdge[]} edges
 */
function validateMaskGraph(mask, edges) {
  /** @type {Map<string, Set<string>>} */
  const adjacency = new Map();

  for (const nodeId of mask.nodesById.keys()) {
    adjacency.set(nodeId, new Set());
  }

  for (const edge of edges) {
    adjacency.get(edge.fromId)?.add(edge.toId);
    adjacency.get(edge.toId)?.add(edge.fromId);
  }

  /** @type {Set<string>} */
  const reachable = new Set();
  /** @type {string[]} */
  const queue = [mask.startNodeId];
  reachable.add(mask.startNodeId);

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) {
      break;
    }

    for (const nextId of adjacency.get(nodeId) ?? []) {
      if (!reachable.has(nextId)) {
        reachable.add(nextId);
        queue.push(nextId);
      }
    }
  }

  for (const nodeId of mask.nodesById.keys()) {
    if (!reachable.has(nodeId)) {
      const coords = nodeId.replace("node_r", "").replace("c", ",");
      throw new Error(`[MapMask] Нода ${nodeId} (${coords}) недостижима от старта.`);
    }
  }

  for (const exitId of mask.exitNodeIds) {
    if (!reachable.has(exitId)) {
      throw new Error(`[MapMask] Выход ${exitId} недостижим от старта.`);
    }
  }

  for (const [nodeId, neighbors] of adjacency) {
    if (neighbors.size === 0) {
      throw new Error(`[MapMask] Нода ${nodeId} не имеет переходов.`);
    }
  }
}

export { DIRECTIONS };
