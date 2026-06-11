import Phaser from "phaser";
import { initCombatAudio } from "../audio/combat/initCombatAudio.js";
import { initAudio } from "../audio/initAudio.js";
import { DEFERRED_AUDIO_ASSET_PATHS } from "../audio/AudioAssets.js";
import { preloadAudioAssetsInBackground } from "../audio/loadAudioAssets.js";
import { initSceneAudio } from "../audio/initSceneAudio.js";
import { blockBrowserDefaultsOnPage } from "../core/blockBrowserDefaults.js";
import { assertInputLayersReady } from "../core/InputLayers.js";
import { updateViewportScale } from "../core/Viewport.js";
import { createGameConfig } from "../game/createGameConfig.js";
import { initGameController } from "../game/GameController.js";
import { initHeroController } from "../hero/HeroController.js";
import { initLootController } from "../loot/LootController.js";
import { initMapController } from "../map/MapController.js";
import { initCombatLocationUI } from "../locations/initCombatLocationUI.js";
import { initCombatUI } from "../ui/CombatUI.js";
import { loadUserSettings, applyUserSettings } from "../settings/UserSettings.js";
import { initGameResultModal } from "../ui/GameResultModal.js";
import { initSettingsModal } from "../ui/SettingsModal.js";
import { initHeroUI } from "../ui/HeroUI.js";
import { initMapUI } from "../ui/MapUI.js";
import { initModalManager } from "../ui/ModalManager.js";
import { initNarrationUI } from "../ui/NarrationUI.js";
import { initInfoToastUI } from "../ui/infoToast/index.js";
import { initUIManager } from "../ui/UIManager.js";
import { initDebugSystem } from "../debug/initDebugSystem.js";
import { initNarrationController } from "../narration/NarrationController.js";
import { dismissAppLoadCurtain } from "./AppLoadCurtain.js";
import { prepareScreenAssets } from "./tasks/prepareScreenAssets.js";
import { waitForLobbyBootstrapAssets } from "./tasks/waitForLobbyBootstrapAssets.js";
import { waitForLobbySpace } from "./tasks/waitForLobbySpace.js";
import { waitForMapConfig } from "./tasks/waitForMapConfig.js";
import { waitForPhaserReady } from "./tasks/waitForPhaserReady.js";

/** @typedef {{ id: string, run: (ctx: { game: Phaser.Game }) => Promise<void> }} AppBootstrapTask */

/** @type {AppBootstrapTask[]} */
const BOOTSTRAP_TASKS = [
  { id: "engine", run: ({ game }) => waitForPhaserReady(game) },
  { id: "lobby-space", run: ({ game }) => waitForLobbySpace(game) },
  { id: "lobby-assets", run: ({ game }) => waitForLobbyBootstrapAssets(game) },
  { id: "screen-ui", run: () => prepareScreenAssets() },
  { id: "map-config", run: () => waitForMapConfig() },
];

/**
 * @param {AppBootstrapTask} task
 * @param {{ game: Phaser.Game }} ctx
 */
async function runBootstrapTask(task, ctx) {
  try {
    await task.run(ctx);
  } catch (error) {
    console.warn(`[AppBootstrap] Задача «${task.id}» завершилась с ошибкой:`, error);
  }
}

/**
 * Загрузка приложения до игры: движок, ассеты лобби, DOM UI.
 * App load curtain закрывает всё окно до завершения bootstrap.
 */
export async function runAppBootstrap() {
  blockBrowserDefaultsOnPage();
  updateViewportScale();
  window.addEventListener("resize", updateViewportScale);

  const game = new Phaser.Game(createGameConfig());
  const ctx = { game };

  initGameController(game);
  initMapController();
  initHeroController();
  initLootController();
  initNarrationController();
  initUIManager();
  initInfoToastUI();
  initModalManager(game);
  initGameResultModal();
  loadUserSettings();
  initSettingsModal();
  initNarrationUI();
  initCombatUI();
  initCombatLocationUI();
  initHeroUI();
  initMapUI();
  initDebugSystem(game);

  await Promise.all(BOOTSTRAP_TASKS.map((task) => runBootstrapTask(task, ctx)));

  initAudio(game);
  initSceneAudio();
  applyUserSettings();
  initCombatAudio();
  preloadAudioAssetsInBackground(game, DEFERRED_AUDIO_ASSET_PATHS);

  dismissAppLoadCurtain();
  assertInputLayersReady();
}
