import { emit, GameEvents, on } from "../core/EventBus.js";
import { SPACE_TO_SCENE } from "../core/GameSpace.js";
import { runSceneTransition } from "./SceneTransition.js";

/**
 * @param {Phaser.Game} game
 * @returns {() => void}
 */
export function initGameController(game) {
  return on(GameEvents.NAVIGATE, (detail) => {
    const target = detail?.target;
    const sceneKey = target ? SPACE_TO_SCENE[target] : undefined;

    if (!sceneKey) {
      console.warn("[GameController] Неизвестный target:", target);
      return;
    }

    const tasks = Array.isArray(detail?.tasks) ? detail.tasks : [];
    void runSceneTransition(game, target, tasks);
  });
}

/**
 * @param {string} target — значение GameSpace
 * @param {{ id: string, run: (ctx: unknown) => Promise<void> }[]} [tasks]
 */
export function navigateTo(target, tasks) {
  emit(GameEvents.NAVIGATE, { target, tasks });
}
