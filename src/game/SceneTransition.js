import { SPACE_TO_SCENE, SceneKey } from "../core/GameSpace.js";
import { hideSceneLoadOverlay, showSceneLoadOverlay } from "../ui/SceneLoadOverlay.js";

const MIN_SCENE_LOAD_MS = 500;

/** @typedef {{ id: string, run: (ctx: TransitionContext) => Promise<void> }} SceneLoadTask */
/** @typedef {{ game: Phaser.Game, targetSpace: string, sceneKey: string }} TransitionContext */

/** @type {Partial<Record<string, SceneLoadTask[]>>} */
const SCENE_LOAD_TASKS = {};

let transitionInProgress = false;

/**
 * Активная игровая сцена (не Boot).
 * @param {Phaser.Game} game
 * @returns {Phaser.Scene | null}
 */
function getActiveGameplayScene(game) {
  const scenes = game.scene.getScenes(true);
  for (let i = scenes.length - 1; i >= 0; i--) {
    const scene = scenes[i];
    const key = scene.scene.key;
    if (key === SceneKey.BOOT) {
      continue;
    }
    if (scene.scene.isActive()) {
      return scene;
    }
  }
  return null;
}

/**
 * @param {Phaser.Scene} scene
 * @returns {Promise<void>}
 */
function waitForSceneCreate(scene) {
  return new Promise((resolve) => {
    scene.events.once("create", resolve);
  });
}

/**
 * @param {TransitionContext} ctx
 */
async function switchSceneTask(ctx) {
  const { game, sceneKey } = ctx;
  const active = getActiveGameplayScene(game);
  const targetScene = game.scene.getScene(sceneKey);

  if (!targetScene) {
    console.warn("[SceneTransition] Сцена не найдена:", sceneKey);
    return;
  }

  const ready = waitForSceneCreate(targetScene);

  if (active?.scene.key === sceneKey) {
    active.scene.restart();
  } else if (active) {
    active.scene.start(sceneKey);
  } else {
    game.scene.start(sceneKey);
  }

  await ready;
}

/**
 * @param {SceneLoadTask} task
 * @param {TransitionContext} ctx
 */
async function runTransitionTask(task, ctx) {
  try {
    await task.run(ctx);
  } catch (error) {
    console.warn(`[SceneTransition] Задача «${task.id}» завершилась с ошибкой:`, error);
  }
}

/**
 * @param {number} startedAt
 */
async function enforceMinDisplay(startedAt) {
  const elapsed = performance.now() - startedAt;
  const wait = MIN_SCENE_LOAD_MS - elapsed;
  if (wait > 0) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, wait);
    });
  }
}

/**
 * In-game переход между сценами с overlay и минимальным временем показа.
 * @param {Phaser.Game} game
 * @param {string} targetSpace — значение GameSpace
 * @param {SceneLoadTask[]} [extraTasks]
 */
export async function runSceneTransition(game, targetSpace, extraTasks = []) {
  if (transitionInProgress) {
    return;
  }

  const sceneKey = SPACE_TO_SCENE[targetSpace];
  if (!sceneKey) {
    console.warn("[SceneTransition] Неизвестный target:", targetSpace);
    return;
  }

  transitionInProgress = true;

  try {
    await showSceneLoadOverlay();
    const startedAt = performance.now();
    const ctx = { game, targetSpace, sceneKey };

    const registered = SCENE_LOAD_TASKS[targetSpace] ?? [];
    const tasks = [
      { id: "switch-scene", run: switchSceneTask },
      ...registered,
      ...extraTasks,
    ];

    await Promise.all(tasks.map((task) => runTransitionTask(task, ctx)));
    await enforceMinDisplay(startedAt);
  } finally {
    await hideSceneLoadOverlay();
    transitionInProgress = false;
  }
}
