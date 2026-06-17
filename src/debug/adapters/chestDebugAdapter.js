import { createWorldRigDebugAdapter } from "./createWorldRigDebugAdapter.js";

/**
 * @param {ReturnType<typeof import("../../game/chestCombatPresentation.js").spawnCombatChestPresentation>} view
 */
export function createChestDebugAdapter(view) {
  return createWorldRigDebugAdapter({
    kind: "chest",
    instanceId: view.chestId,
    configId: view.containerId,
    canEditOffsets: true,
    pivot: view.pivot ?? view.container,
    view: view.view,
    sprite: view.sprite,
    shadow: view.shadow,
  });
}
