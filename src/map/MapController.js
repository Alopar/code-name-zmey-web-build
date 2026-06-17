import { GameEvents, emit, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { startCombat } from "../combat/startCombat.js";
import * as HeroSession from "../hero/HeroSession.js";
import * as PartySession from "../party/PartySession.js";
import { showGameResultModal } from "../ui/GameResultModal.js";
import { createCombatSetupFromNode } from "./createCombatSetupFromNode.js";
import { getMapWorld } from "./mapWorldBridge.js";
import * as MapSession from "./MapSession.js";

let transitioning = false;

/**
 * @returns {() => void}
 */
export function initMapController() {
  const unsubs = [
    on(GameEvents.SPACE_CHANGED, async (detail) => {
      if (
        detail?.space === GameSpace.WORLD_MAP &&
        (detail?.prev === GameSpace.LOBBY || detail?.prev === GameSpace.NARRATION)
      ) {
        await MapSession.reset();
        HeroSession.reset();
        PartySession.reset();
      }

      if (detail?.prev === GameSpace.COMBAT && detail?.space === GameSpace.WORLD_MAP) {
        if (MapSession.getPendingCombatNodeId()) {
          MapSession.clearPendingCombat();
        }
      }
    }),

    on(GameEvents.MAP_NODE_SELECTED, async (detail) => {
      const nodeId = detail?.nodeId;
      if (!nodeId || transitioning) {
        return;
      }

      const graph = MapSession.getGraph();
      if (!graph.canSelect(nodeId)) {
        return;
      }

      const world = getMapWorld();
      if (!world || world.isPlayerMoving()) {
        return;
      }

      const traversing = graph.isTraversal(nodeId);

      transitioning = true;

      try {
        await world.movePlayerTo(nodeId);

        if (traversing) {
          graph.moveToNode(nodeId);
          world.refresh();
          emit(GameEvents.MAP_STATE_CHANGED, { graph: graph.snapshot() });
          return;
        }

        const node = graph.getNode(nodeId);
        if (node.type === "start") {
          return;
        }

        MapSession.setPendingCombat(nodeId);
        startCombat(createCombatSetupFromNode(node));
      } finally {
        transitioning = false;
      }
    }),

    on(GameEvents.COMBAT_ENDED, (detail) => {
      const pendingNodeId = MapSession.getPendingCombatNodeId();
      if (!pendingNodeId) {
        return;
      }

      if (detail?.victory) {
        const completedId = MapSession.completePendingNode();
        const graph = MapSession.getGraph();
        const completedNode = completedId ? graph.getNode(completedId) : null;

        emit(GameEvents.MAP_STATE_CHANGED, { graph: graph.snapshot() });

        if (completedNode?.type === "final") {
          void showGameResultModal("victory");
          emit(GameEvents.COMBAT_OUTCOME, { leaveToMap: false });
          return;
        }

        emit(GameEvents.COMBAT_OUTCOME, { leaveToMap: true });
        return;
      }

      MapSession.clearPendingCombat();
      void showGameResultModal("defeat");
      emit(GameEvents.COMBAT_OUTCOME, { leaveToMap: false });
    }),
  ];

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}
