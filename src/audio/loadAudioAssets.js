import Phaser from "phaser";

/**
 * @param {Phaser.Game} game
 * @param {Readonly<Record<string, string>>} assets
 * @returns {Promise<void>}
 */
export function loadAudioAssets(game, assets) {
  const missing = Object.entries(assets).filter(([key]) => !game.cache.audio.exists(key));
  if (!missing.length) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scene = game.scene.getScenes(true).find((entry) => entry.sys?.isActive());
    if (!scene) {
      reject(new Error("[loadAudioAssets] Нет активной сцены для загрузки"));
      return;
    }

    for (const [key, path] of missing) {
      scene.load.audio(key, path);
    }

    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.once(Phaser.Loader.Events.LOAD_ERROR, (file) => {
      reject(new Error(`[loadAudioAssets] Ошибка загрузки: ${file?.key ?? "unknown"}`));
    });
    scene.load.start();
  });
}

/**
 * Фоновая подгрузка без блокировки UI.
 * @param {Phaser.Game} game
 * @param {Readonly<Record<string, string>>} assets
 */
export function preloadAudioAssetsInBackground(game, assets) {
  void loadAudioAssets(game, assets).catch((error) => {
    console.warn("[loadAudioAssets] Фоновая загрузка не удалась:", error);
  });
}
