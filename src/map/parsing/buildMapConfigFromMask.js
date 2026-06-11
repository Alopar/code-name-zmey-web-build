import { createMapLayout } from "./mapLayout.js";
import { resolveNodeMeta, validateMapMeta } from "./mergeMapMeta.js";
import { extractMaskGraphEdges } from "./parseMapMaskGrid.js";

/**
 * @typedef {import("../MapGraph.js").MapConfig} MapConfig
 * @typedef {import("../MapGraph.js").MapEdgeData} MapEdgeData
 * @typedef {import("./mergeMapMeta.js").MapNodeMetaConfig} MapNodeMetaConfig
 * @typedef {import("./parseMapMaskGrid.js").ParsedMapMask} ParsedMapMask
 */

/**
 * @param {ParsedMapMask} mask
 * @returns {Map<string, Set<string>>}
 */
function buildAdjacency(mask) {
  const edges = extractMaskGraphEdges(mask);
  /** @type {Map<string, Set<string>>} */
  const adjacency = new Map();

  for (const nodeId of mask.nodesById.keys()) {
    adjacency.set(nodeId, new Set());
  }

  for (const edge of edges) {
    adjacency.get(edge.fromId)?.add(edge.toId);
    adjacency.get(edge.toId)?.add(edge.fromId);
  }

  return { adjacency, edges };
}

/**
 * @param {ParsedMapMask} mask
 * @param {Map<string, Set<string>>} adjacency
 */
function computeNodeDepthsFromAdjacency(mask, adjacency) {
  /** @type {Map<string, number>} */
  const depths = new Map([[mask.startNodeId, 0]]);
  /** @type {string[]} */
  const queue = [mask.startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) {
      break;
    }

    const depth = depths.get(nodeId) ?? 0;
    for (const nextId of adjacency.get(nodeId) ?? []) {
      if (!depths.has(nextId)) {
        depths.set(nextId, depth + 1);
        queue.push(nextId);
      }
    }
  }

  return depths;
}

/**
 * @param {ParsedMapMask} mask
 * @param {MapNodeMetaConfig} [meta={}]
 * @returns {MapConfig}
 */
export function buildMapConfigFromMask(mask, meta = {}) {
  validateMapMeta(meta, mask);

  const { adjacency, edges } = buildAdjacency(mask);
  const depths = computeNodeDepthsFromAdjacency(mask, adjacency);

  const layoutPoints = [
    ...mask.nodesById.values(),
    ...edges.flatMap((edge) => edge.gridPath),
  ];
  const layout = createMapLayout(layoutPoints);

  /** @type {import("../entities/MapNode.js").MapNodeData[]} */
  const nodes = [];

  for (const [nodeId, cell] of mask.nodesById) {
    const resolved = resolveNodeMeta(mask, meta, depths, nodeId);
    const screen = layout.toScreen(cell.row, cell.col);

    nodes.push({
      id: nodeId,
      type: resolved.type,
      enemyCount: resolved.enemyCount,
      grid: { row: cell.row, col: cell.col },
      position: screen,
      connections: [...(adjacency.get(nodeId) ?? [])].sort(),
      label: resolved.label,
    });
  }

  /** @type {MapEdgeData[]} */
  const mapEdges = edges.map((edge) => {
    const fromCell = mask.nodesById.get(edge.fromId);
    const toCell = mask.nodesById.get(edge.toId);
    if (!fromCell || !toCell) {
      throw new Error(`[MapMask] Некорректное ребро ${edge.fromId} -> ${edge.toId}`);
    }

    const points = [
      layout.toScreen(fromCell.row, fromCell.col),
      ...edge.gridPath.map((point) => layout.toScreen(point.row, point.col)),
      layout.toScreen(toCell.row, toCell.col),
    ];

    return {
      fromId: edge.fromId,
      toId: edge.toId,
      points,
    };
  });

  nodes.sort((a, b) => {
    if (a.grid.row !== b.grid.row) {
      return a.grid.row - b.grid.row;
    }
    return a.grid.col - b.grid.col;
  });

  return {
    nodes,
    edges: mapEdges,
    startNodeId: mask.startNodeId,
  };
}
