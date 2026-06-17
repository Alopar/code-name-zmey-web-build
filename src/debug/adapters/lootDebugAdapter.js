import { createWorldRigDebugAdapter } from "./createWorldRigDebugAdapter.js";

/**
 * @param {ReturnType<typeof import("../../game/lootCombatPresentation.js").spawnCombatLootPresentation>} view
 */
export function createLootDebugAdapter(view) {
  return createWorldRigDebugAdapter({
    kind: "loot",
    instanceId: view.dropId,
    configId: view.resourceId,
    canEditOffsets: true,
    pivot: view.pivot ?? view.container,
    view: view.view,
    sprite: view.sprite,
    shadow: view.shadow,
  });
}
