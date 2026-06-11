import { MapNode } from "./entities/MapNode.js";
import { MapNodeState } from "./MapNodeState.js";

/**
 * @typedef {object} MapEdgeData
 * @property {string} fromId
 * @property {string} toId
 * @property {{ x: number, y: number }[]} points
 */

/**
 * @typedef {object} MapConfig
 * @property {import("./entities/MapNode.js").MapNodeData[]} nodes
 * @property {string} startNodeId
 * @property {MapEdgeData[]} [edges]
 */

/**
 * @typedef {object} MapGraphSnapshot
 * @property {Map<string, MapNode>} nodes
 * @property {string} currentNodeId
 * @property {ReadonlySet<string>} visited
 * @property {string} startNodeId
 */

export class MapGraph {
  /**
   * @param {MapConfig} config
   */
  constructor(config) {
    /** @type {Map<string, MapNode>} */
    this.nodes = new Map(config.nodes.map((data) => [data.id, MapNode.fromConfig(data)]));
    this.startNodeId = config.startNodeId;
    this.currentNodeId = config.startNodeId;
    /** @type {Set<string>} */
    this.visited = new Set([config.startNodeId]);
    /** @type {Map<string, { x: number, y: number }[]>} */
    this.edgePaths = new Map();

    for (const edge of config.edges ?? []) {
      const edgeKey = [edge.fromId, edge.toId].sort().join("|");
      this.edgePaths.set(
        edgeKey,
        edge.points.map((point) => ({ ...point })),
      );
    }
  }

  /**
   * @param {MapConfig} config
   */
  static fromConfig(config) {
    return new MapGraph(config);
  }

  /**
   * @param {string} nodeId
   */
  getNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`[MapGraph] Неизвестная нода: ${nodeId}`);
    }
    return node;
  }

  /**
   * @param {string} nodeId
   */
  getNodeState(nodeId) {
    if (this.visited.has(nodeId)) {
      return MapNodeState.VISITED;
    }

    const current = this.getNode(this.currentNodeId);
    if (current.connections.includes(nodeId)) {
      return MapNodeState.AVAILABLE;
    }

    return MapNodeState.LOCKED;
  }

  /**
   * @param {string} nodeId
   */
  canSelect(nodeId) {
    return this.getNodeState(nodeId) === MapNodeState.AVAILABLE;
  }

  /**
   * @param {string} nodeId
   */
  completeNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      return;
    }

    this.visited.add(nodeId);
    this.currentNodeId = nodeId;
  }

  /**
   * @param {string} fromId
   * @param {string} toId
   */
  getEdgeState(fromId, toId) {
    const fromState = this.getNodeState(fromId);
    const toState = this.getNodeState(toId);

    if (fromState === MapNodeState.LOCKED || toState === MapNodeState.LOCKED) {
      return MapNodeState.LOCKED;
    }

    if (fromState === MapNodeState.VISITED && toState === MapNodeState.VISITED) {
      return MapNodeState.VISITED;
    }

    if (
      (fromState === MapNodeState.VISITED && toState === MapNodeState.AVAILABLE) ||
      (fromState === MapNodeState.AVAILABLE && toState === MapNodeState.VISITED)
    ) {
      return MapNodeState.AVAILABLE;
    }

    return MapNodeState.LOCKED;
  }

  /**
   * @param {string} fromId
   * @param {string} toId
   * @returns {{ from: { x: number, y: number }, to: { x: number, y: number }, points: { x: number, y: number }[] }}
   */
  getPath(fromId, toId) {
    const from = this.getNode(fromId);
    const to = this.getNode(toId);
    const edgeKey = [fromId, toId].sort().join("|");
    const stored = this.edgePaths.get(edgeKey);

    if (stored && stored.length >= 2) {
      return {
        from: stored[0],
        to: stored[stored.length - 1],
        points: stored,
      };
    }

    return {
      from: { x: from.position.x, y: from.position.y },
      to: { x: to.position.x, y: to.position.y },
      points: [
        { x: from.position.x, y: from.position.y },
        { x: to.position.x, y: to.position.y },
      ],
    };
  }

  /** @returns {MapGraphSnapshot} */
  snapshot() {
    return {
      nodes: this.nodes,
      currentNodeId: this.currentNodeId,
      visited: this.visited,
      startNodeId: this.startNodeId,
    };
  }
}
