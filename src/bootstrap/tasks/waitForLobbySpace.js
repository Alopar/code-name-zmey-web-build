import { SceneKey } from "../../core/GameSpace.js";

/**
 * Ждёт готовности лобби: BootScene завершила preload/create и LobbyScene активна.
 * @param {Phaser.Game} game
 * @returns {Promise<void>}
 */
export function waitForLobbySpace(game) {
  return new Promise((resolve) => {
    const attach = () => {
      const lobby = game.scene.getScene(SceneKey.LOBBY);
      if (!lobby) {
        console.warn("[AppBootstrap] LobbyScene не найдена");
        resolve();
        return;
      }

      if (lobby.scene.isActive()) {
        resolve();
        return;
      }

      lobby.events.once("create", resolve);
    };

    if (game.isBooted) {
      attach();
      return;
    }

    game.events.once("ready", attach);
  });
}
