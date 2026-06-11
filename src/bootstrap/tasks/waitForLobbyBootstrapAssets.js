import { AudioKey } from "../../audio/AudioKeys.js";
import { AssetKey } from "../../game/Assets.js";

const POLL_MS = 50;
const TIMEOUT_MS = 60_000;

/**
 * Ждёт критичные ассеты лобби: фон world-view и главный музыкальный трек.
 * @param {Phaser.Game} game
 * @returns {Promise<void>}
 */
export function waitForLobbyBootstrapAssets(game) {
  return new Promise((resolve) => {
    const isReady = () =>
      game.cache.audio.exists(AudioKey.MUSIC_MAIN_MENU) &&
      game.textures.exists(AssetKey.LOBBY_BG);

    if (isReady()) {
      resolve();
      return;
    }

    const startedAt = performance.now();
    const pollId = window.setInterval(() => {
      if (!isReady()) {
        if (performance.now() - startedAt >= TIMEOUT_MS) {
          window.clearInterval(pollId);
          console.warn("[Bootstrap] Критичные ассеты лобби не загрузились вовремя");
          resolve();
        }
        return;
      }

      window.clearInterval(pollId);
      resolve();
    }, POLL_MS);
  });
}
