import { hitTestSpawnGuideLine, isSpawnGuideDebugEntity } from "../adapters/spawnGuideDebugAdapter.js";

/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */
/** @typedef {import("../adapters/spawnGuideDebugAdapter.js").ReturnType<typeof import("../adapters/spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter>} SpawnGuideDebugAdapter */

const PIVOT_HIT_RADIUS = 20;
const RIGHT_MOUSE_BUTTON = 2;

/**
 * @param {DebugEntityAdapter | SpawnGuideDebugAdapter} entity
 */
function getEntityPivotPosition(entity) {
  if (isSpawnGuideDebugEntity(entity)) {
    return entity.getWorldPosition();
  }

  return {
    x: entity.pivot.x,
    y: entity.pivot.y,
  };
}

export class DebugSelectionController {
  constructor() {
    /** @type {string | null} */
    this.selectedKind = null;
    /** @type {string | null} */
    this.selectedInstanceId = null;
  }

  clear() {
    this.selectedKind = null;
    this.selectedInstanceId = null;
  }

  /**
   * @param {DebugEntityAdapter | SpawnGuideDebugAdapter} entity
   */
  select(entity) {
    this.selectedKind = entity.kind;
    this.selectedInstanceId = entity.instanceId;
  }

  /**
   * @returns {{ kind: string, instanceId: string } | null}
   */
  getSelection() {
    if (!this.selectedInstanceId || !this.selectedKind) {
      return null;
    }

    return {
      kind: this.selectedKind,
      instanceId: this.selectedInstanceId,
    };
  }

  /**
   * @param {(DebugEntityAdapter | SpawnGuideDebugAdapter)[]} entities
   * @returns {DebugEntityAdapter | SpawnGuideDebugAdapter | null}
   */
  findSelected(entities) {
    const selection = this.getSelection();
    if (!selection) {
      return null;
    }

    return (
      entities.find(
        (entity) =>
          entity.instanceId === selection.instanceId && entity.kind === selection.kind,
      ) ?? null
    );
  }

  /**
   * @param {Phaser.Input.Pointer} pointer
   * @param {(DebugEntityAdapter | SpawnGuideDebugAdapter)[]} entities
   * @returns {boolean}
   */
  handlePointerDown(pointer, entities) {
    if (pointer.button !== RIGHT_MOUSE_BUTTON) {
      return false;
    }

    pointer.event?.preventDefault();

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    const spawnGuides = entities.filter((entity) => isSpawnGuideDebugEntity(entity));
    const worldEntities = entities.filter((entity) => !isSpawnGuideDebugEntity(entity));
    const sortedWorld = [...worldEntities].sort(
      (a, b) => (b.pivot.depth ?? 0) - (a.pivot.depth ?? 0),
    );

    for (const entity of spawnGuides) {
      if (hitTestSpawnGuideLine(entity, worldX, worldY)) {
        this.select(entity);
        return true;
      }
    }

    for (const entity of sortedWorld) {
      const pivot = getEntityPivotPosition(entity);
      const dx = worldX - pivot.x;
      const dy = worldY - pivot.y;
      if (dx * dx + dy * dy <= PIVOT_HIT_RADIUS * PIVOT_HIT_RADIUS) {
        this.select(entity);
        return true;
      }
    }

    for (const entity of sortedWorld) {
      const bounds = entity.getBounds?.();
      if (bounds?.contains(worldX, worldY)) {
        this.select(entity);
        return true;
      }
    }

    this.clear();
    return true;
  }
}
