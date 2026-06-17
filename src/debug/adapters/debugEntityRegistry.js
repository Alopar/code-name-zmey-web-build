import { collectSpawnGuideDebugAdapters } from "./spawnGuideDebugAdapter.js";
import { createChestDebugAdapter } from "./chestDebugAdapter.js";
import { createEnemyDebugAdapter } from "./enemyDebugAdapter.js";
import { createLootDebugAdapter } from "./lootDebugAdapter.js";

/** @typedef {import("./createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */

/**
 * @param {import("../../game/scenes/CombatScene.js").CombatScene} scene
 * @param {import("../spawnGuides/SpawnGuideDebugSession.js").SpawnGuideDebugSession | null} [spawnGuideSession]
 */
export function collectDebugEntitiesFromScene(scene, spawnGuideSession = null) {
  /** @type {(DebugEntityAdapter | ReturnType<typeof import("./spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter>)[]} */
  const entities = [];

  entities.push(...collectSpawnGuideDebugAdapters(spawnGuideSession));

  for (const view of scene.enemyViews?.values() ?? []) {
    const adapter = createEnemyDebugAdapter(view);
    if (adapter.isAlive()) {
      entities.push(adapter);
    }
  }

  for (const view of scene.lootViews?.values() ?? []) {
    const adapter = createLootDebugAdapter(view);
    if (adapter.isAlive()) {
      entities.push(adapter);
    }
  }

  for (const view of scene.chestViews?.values() ?? []) {
    const adapter = createChestDebugAdapter(view);
    if (adapter.isAlive()) {
      entities.push(adapter);
    }
  }

  return entities;
}

/**
 * @param {(DebugEntityAdapter | ReturnType<typeof import("./spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter>)[]} entities
 */
export function collectSpawnGuideOverlayLines(entities) {
  /** @type {{ y: number, instanceId: string } | null} */
  let enemy = null;
  /** @type {{ y: number, instanceId: string } | null} */
  let chest = null;

  for (const entity of entities) {
    if (entity.kind !== "spawnGuide") {
      continue;
    }

    const position = entity.getWorldPosition();
    const line = {
      y: position.y,
      instanceId: entity.instanceId,
    };

    if (entity.guideKind === "enemy") {
      enemy = line;
      continue;
    }

    chest = line;
  }

  return { enemy, chest };
}
