import { createWorldRigDebugAdapter } from "./createWorldRigDebugAdapter.js";

/**
 * @param {ReturnType<typeof import("../../game/enemyCombatPresentation.js").spawnCombatEnemyPresentation>} view
 */
export function createEnemyDebugAdapter(view) {
  return createWorldRigDebugAdapter({
    kind: "enemy",
    instanceId: view.combatantId,
    configId: view.enemyId,
    canEditOffsets: true,
    pivot: view.pivot ?? view.container,
    view: view.view,
    sprite: view.sprite,
    shadow: view.shadow,
  });
}
