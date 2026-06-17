import { emit, GameEvents } from "../../core/EventBus.js";
import { addMapGradientBackground } from "./mapGradientBackground.js";
import { createMapNodeView } from "./mapNodeView.js";
import { createMapPathView } from "./mapPathView.js";
import { createPlayerTokenView } from "./playerTokenView.js";

/**
 * @param {Phaser.Scene} scene
 * @param {import("../MapGraph.js").MapGraph} graph
 */
export function buildMapWorld(scene, graph) {
  const background = addMapGradientBackground(scene);
  const pathView = createMapPathView(scene, graph);

  /** @type {Map<string, ReturnType<typeof createMapNodeView>>} */
  const nodeViews = new Map();

  /**
   * @param {string} nodeId
   */
  function handleNodeSelect(nodeId) {
    if (playerToken.isMoving() || !graph.canSelect(nodeId)) {
      return;
    }

    emit(GameEvents.MAP_NODE_SELECTED, { nodeId });
  }

  for (const node of graph.nodes.values()) {
    const view = createMapNodeView(scene, node, graph.getNodeState(node.id), handleNodeSelect);
    view.setSelectable(graph.canSelect(node.id));
    nodeViews.set(node.id, view);
  }

  const currentNode = graph.getNode(graph.currentNodeId);
  const playerToken = createPlayerTokenView(
    scene,
    currentNode.position.x,
    currentNode.position.y,
  );

  function refresh() {
    pathView.refresh();

    for (const [nodeId, view] of nodeViews) {
      const state = graph.getNodeState(nodeId);
      view.setState(state);
      view.setSelectable(graph.canSelect(nodeId));
    }

    const node = graph.getNode(graph.currentNodeId);
    playerToken.setPosition(node.position.x, node.position.y);
  }

  /**
   * @param {string} nodeId
   * @returns {Promise<void>}
   */
  async function movePlayerTo(nodeId) {
    const target = graph.getNode(nodeId);
    await playerToken.moveTo(target.position.x, target.position.y);
  }

  return {
    background,
    refresh,
    movePlayerTo,
    isPlayerMoving: () => playerToken.isMoving(),
    destroy: () => {
      pathView.destroy();
      for (const view of nodeViews.values()) {
        view.destroy();
      }
      nodeViews.clear();
      playerToken.destroy();
      background?.destroy();
    },
  };
}
