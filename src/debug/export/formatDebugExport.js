import {
  shadowViewOffsetToFrame,
  spriteViewOffsetToFrame,
} from "../../game/visualFrameOffset.js";
import { isSpawnGuideDebugEntity } from "../adapters/spawnGuideDebugAdapter.js";

/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */

/**
 * @param {DebugEntityAdapter | ReturnType<typeof import("../adapters/spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter>} entity
 */
export function formatDebugExport(entity) {
  if (isSpawnGuideDebugEntity(entity)) {
    const offset = entity.getOffsetFromCenter();
    return {
      kind: "spawnLine",
      lineKind: entity.guideKind,
      locationId: entity.configId,
      offsetY: offset.offsetY,
    };
  }

  const spriteOffset = entity.getSpriteOffset();
  const shadowOffset = entity.getShadowOffset();
  const baseScale = entity.getBaseScale();

  const sprite = spriteViewOffsetToFrame(spriteOffset.x, spriteOffset.y, baseScale);
  const shadow = shadowViewOffsetToFrame(shadowOffset.x, shadowOffset.y, baseScale);

  return {
    kind: entity.kind,
    configId: entity.configId,
    instanceId: entity.instanceId,
    sprite,
    shadow: {
      ...shadow,
      layer: entity.getShadowLayer(),
    },
  };
}
