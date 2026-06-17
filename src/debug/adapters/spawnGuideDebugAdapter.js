/** @typedef {import("../spawnGuides/SpawnGuideDebugSession.js").SpawnLineGuide} SpawnLineGuide */

/**
 * @param {import("../spawnGuides/SpawnGuideDebugSession.js").SpawnGuideDebugSession} session
 * @param {SpawnLineGuide} guide
 */
export function createSpawnGuideDebugAdapter(session, guide) {
  const instanceId = `${guide.guideKind}-line`;

  return {
    kind: "spawnGuide",
    guideKind: guide.guideKind,
    instanceId,
    configId: guide.locationId,
    canEditOffsets: true,
    getWorldPosition() {
      return session.getWorldPosition(guide);
    },
    getLineWorldY() {
      return session.getWorldPosition(guide).y;
    },
    getOffsetFromCenter() {
      return { offsetX: 0, offsetY: guide.offsetY };
    },
    nudgeOffsetY(deltaY) {
      session.nudgeGuideY(guide, deltaY);
    },
    isAlive() {
      return true;
    },
  };
}

/**
 * @param {import("../spawnGuides/SpawnGuideDebugSession.js").SpawnGuideDebugSession | null | undefined} session
 */
export function collectSpawnGuideDebugAdapters(session) {
  if (!session) {
    return [];
  }

  return session.getAllGuides().map((guide) => createSpawnGuideDebugAdapter(session, guide));
}

/**
 * @param {object} entity
 * @returns {entity is ReturnType<typeof createSpawnGuideDebugAdapter>}
 */
export function isSpawnGuideDebugEntity(entity) {
  return entity?.kind === "spawnGuide";
}

export const SPAWN_LINE_HIT_RADIUS = 14;

/**
 * @param {ReturnType<typeof createSpawnGuideDebugAdapter>} entity
 * @param {number} worldX
 * @param {number} worldY
 */
export function hitTestSpawnGuideLine(entity, worldX, worldY) {
  const lineY = entity.getLineWorldY();
  return Math.abs(worldY - lineY) <= SPAWN_LINE_HIT_RADIUS;
}
