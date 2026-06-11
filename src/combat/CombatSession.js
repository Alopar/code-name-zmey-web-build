import { createCombatEncounter } from "./CombatEncounter.js";
import { CombatEngine } from "./CombatEngine.js";
import { createDefaultTestEncounter } from "./defaultEncounter.js";

/** @type {import("./CombatEncounter.js").CombatSetup | null} */
let pendingSetup = null;

/** @type {ReturnType<typeof createCombatEncounter> | null} */
let activeEncounter = null;

/** @type {CombatEngine | null} */
let activeEngine = null;

/** @type {object | null} */
let activeScene = null;

import { clearAnimBridge } from "./combatAnimBridge.js";
import { clearFeedbackBridge } from "./combatFeedbackBridge.js";

/**
 * @param {import("./CombatEncounter.js").CombatSetup} setup
 */
export function begin(setup) {
  pendingSetup = setup;
}

/**
 * Создаёт встречу и движок; вызывается при входе в CombatScene.
 */
export function consume() {
  const setup = pendingSetup ?? createDefaultTestEncounter();
  pendingSetup = null;
  activeEncounter = createCombatEncounter(setup);
  activeEngine = new CombatEngine(activeEncounter);
  activeEngine.start();
  return activeEncounter;
}

export function getEncounter() {
  return activeEncounter;
}

export function getEngine() {
  return activeEngine;
}

export function refreshState() {
  activeEngine?.refreshState();
}

/**
 * @param {object | null} scene
 */
export function setScene(scene) {
  activeScene = scene;
}

export function getScene() {
  return activeScene;
}

/** Создаёт Phaser-представления сундуков, если модель уже есть, а view — нет. */
export function syncChestViews() {
  const scene = activeScene;
  if (!scene || typeof scene.syncChestViewsFromEngine !== "function") {
    return;
  }

  scene.syncChestViewsFromEngine();
}

export function clear() {
  pendingSetup = null;
  activeEncounter = null;
  activeEngine = null;
  activeScene = null;
  clearAnimBridge();
  clearFeedbackBridge();
}
