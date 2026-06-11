import { MapNodeState } from "../MapNodeState.js";
import { NODE_SIZE } from "./mapNodeView.js";

const PATH_INSET = NODE_SIZE / 2 + 2;

/** @type {Readonly<Record<string, { color: number, width: number, alpha: number }>>} */
const EDGE_STYLES = Object.freeze({
  [MapNodeState.LOCKED]: { color: 0x5a5848, width: 3, alpha: 0.45 },
  [MapNodeState.AVAILABLE]: { color: 0xc4b574, width: 5, alpha: 0.95 },
  [MapNodeState.VISITED]: { color: 0x6b8a42, width: 4, alpha: 0.9 },
});

/**
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 */
function clipSegment(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length <= PATH_INSET * 2) {
    return { from, to };
  }

  const nx = dx / length;
  const ny = dy / length;

  return {
    from: { x: from.x + nx * PATH_INSET, y: from.y + ny * PATH_INSET },
    to: { x: to.x - nx * PATH_INSET, y: to.y - ny * PATH_INSET },
  };
}

/**
 * @param {{ x: number, y: number }[]} points
 */
function clipPolyline(points) {
  if (points.length < 2) {
    return points;
  }

  const first = clipSegment(points[0], points[1]).from;
  const lastIndex = points.length - 1;
  const last = clipSegment(points[lastIndex - 1], points[lastIndex]).to;

  return [first, ...points.slice(1, lastIndex), last];
}

/**
 * @param {import("../MapGraph.js").MapGraph} graph
 * @param {Phaser.Scene} scene
 */
export function createMapPathView(scene, graph) {
  const graphics = scene.add.graphics();
  graphics.setDepth(1);

  function drawPaths() {
    graphics.clear();
    const drawn = new Set();

    for (const node of graph.nodes.values()) {
      for (const targetId of node.connections) {
        const edgeKey = [node.id, targetId].sort().join("|");
        if (drawn.has(edgeKey)) {
          continue;
        }
        drawn.add(edgeKey);

        const edgeState = graph.getEdgeState(node.id, targetId);
        const style = EDGE_STYLES[edgeState] ?? EDGE_STYLES[MapNodeState.LOCKED];
        const path = graph.getPath(node.id, targetId);
        const clipped = clipPolyline(path.points);

        graphics.lineStyle(style.width, style.color, style.alpha);
        graphics.beginPath();
        graphics.moveTo(clipped[0].x, clipped[0].y);

        for (let index = 1; index < clipped.length; index += 1) {
          graphics.lineTo(clipped[index].x, clipped[index].y);
        }

        graphics.strokePath();
      }
    }
  }

  drawPaths();

  return {
    graphics,
    refresh: drawPaths,
    destroy: () => {
      graphics.destroy();
    },
  };
}
