import { VIEWPORT_HEIGHT } from "../core/Viewport.js";
import { FLOATING_TEXT_DEPTH } from "./feedback/floatingText/depth.js";

/** Минимальная глубина мировых объектов боя (фон — 0). */
export const COMBAT_WORLD_DEPTH_BASE = 10;

/**
 * Масштаб Y → depth: весь viewport укладывается ниже слоя floating text.
 * Чем ниже объект на экране (больше Y), тем выше depth — рисуется поверх.
 */
const COMBAT_WORLD_DEPTH_Y_SCALE =
  (FLOATING_TEXT_DEPTH - COMBAT_WORLD_DEPTH_BASE - 1) / VIEWPORT_HEIGHT;

/** Разводит объекты с одинаковым Y по X (слева — чуть ниже по depth). */
const COMBAT_WORLD_DEPTH_X_BIAS = 1e-4;

/** Смещение depth для hit-эффектов поверх сущности в той же точке. */
export const COMBAT_ENTITY_FEEDBACK_DEPTH_OFFSET = 0.5;

/**
 * @param {number} groundY — Y pivot на земле (физическая точка, не view)
 * @param {number} [groundX]
 * @returns {number}
 */
export function combatDepthFromGroundY(groundY, groundX = 0) {
  return (
    COMBAT_WORLD_DEPTH_BASE +
    groundY * COMBAT_WORLD_DEPTH_Y_SCALE +
    groundX * COMBAT_WORLD_DEPTH_X_BIAS
  );
}

/**
 * @param {Phaser.GameObjects.Container | null | undefined} pivot
 * @returns {number}
 */
export function combatEntityFeedbackDepth(pivot) {
  if (!pivot?.active) {
    return COMBAT_WORLD_DEPTH_BASE;
  }

  return (
    combatDepthFromGroundY(pivot.y, pivot.x) +
    COMBAT_ENTITY_FEEDBACK_DEPTH_OFFSET
  );
}

/**
 * @param {Phaser.GameObjects.Container | null | undefined} pivot
 */
export function applyCombatWorldDepth(pivot) {
  if (!pivot?.active) {
    return;
  }

  pivot.setDepth(combatDepthFromGroundY(pivot.y, pivot.x));
}

/**
 * @param {{ pivot?: Phaser.GameObjects.Container, container?: Phaser.GameObjects.Container }} entityView
 */
function applyEntityViewDepth(entityView) {
  applyCombatWorldDepth(entityView.pivot ?? entityView.container);
}

/**
 * Пересчёт depth всех pivot на сцене. Вызывать после спавна или смены позиции по игровой логике.
 * @param {import("./scenes/CombatScene.js").CombatScene} scene
 */
export function syncCombatSceneWorldDepths(scene) {
  for (const entityView of scene.enemyViews?.values() ?? []) {
    applyEntityViewDepth(entityView);
  }

  for (const entityView of scene.lootViews?.values() ?? []) {
    applyEntityViewDepth(entityView);
  }

  for (const entityView of scene.chestViews?.values() ?? []) {
    applyEntityViewDepth(entityView);
  }
}
