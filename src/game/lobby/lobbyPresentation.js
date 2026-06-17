import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { getCurrentSpace } from "../../core/GameState.js";
import { getUserSettings, onUserSettingsChanged } from "../../settings/UserSettings.js";
import { AssetKey } from "../Assets.js";
import { addWorldBackground } from "../worldBackground.js";
import { initLobbyLogoLife, syncLobbyLogoLife } from "./lobbyLogoLife.js";
import { setupLobbyLiveBackground } from "./lobbyLiveBackground.js";
import { isLobbyPresentationEnabled, setLobbyPresentationEnabled } from "./lobbyPresentationState.js";

export { isLobbyPresentationEnabled } from "./lobbyPresentationState.js";

/** @type {Phaser.Game | null} */
let gameRef = null;

/** @type {{ bg: Phaser.GameObjects.Image | null, cleanup: (() => void) | null }} */
let backgroundHandle = { bg: null, cleanup: null };

function syncFromSettings() {
  setLobbyPresentationEnabled(getUserSettings().lobbyAnimated);
}

/**
 * @param {Phaser.Scene} scene
 */
function clearLobbyBackground(scene) {
  backgroundHandle.cleanup?.();
  backgroundHandle.cleanup = null;

  if (backgroundHandle.bg?.active) {
    backgroundHandle.bg.destroy();
  }

  backgroundHandle.bg = null;

  void scene;
}

/**
 * Собирает фон лобби: живой параллакс или статичная картинка.
 * @param {Phaser.Scene} scene
 */
export function setupLobbyWorld(scene) {
  syncFromSettings();
  clearLobbyBackground(scene);

  if (isLobbyPresentationEnabled()) {
    backgroundHandle = setupLobbyLiveBackground(scene);
    return;
  }

  backgroundHandle = {
    bg: addWorldBackground(scene, AssetKey.LOBBY_BG),
    cleanup: null,
  };
}

function rebuildActiveLobbyWorld() {
  if (getCurrentSpace() !== GameSpace.LOBBY || !gameRef) {
    return;
  }

  const lobby = gameRef.scene.getScene(SceneKey.LOBBY);
  if (!lobby?.scene.isActive()) {
    return;
  }

  setupLobbyWorld(lobby);
}

function syncLobbyPresentation() {
  syncLobbyLogoLife();
  rebuildActiveLobbyWorld();
}

/**
 * Единая точка входа: настройки, логотип, фон лобби.
 * @param {Phaser.Game} game
 * @returns {() => void}
 */
export function initLobbyPresentation(game) {
  gameRef = game;

  const apply = () => {
    syncFromSettings();
    syncLobbyPresentation();
  };

  const unsubSettings = onUserSettingsChanged(apply);
  const teardownLogo = initLobbyLogoLife();
  apply();

  return () => {
    unsubSettings();
    teardownLogo();
    gameRef = null;
    backgroundHandle = { bg: null, cleanup: null };
  };
}
