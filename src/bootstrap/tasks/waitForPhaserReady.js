/**
 * Ждёт инициализации Phaser Game (событие `ready`).
 * @param {Phaser.Game} game
 * @returns {Promise<void>}
 */
export function waitForPhaserReady(game) {
  return new Promise((resolve) => {
    if (game.isBooted) {
      resolve();
      return;
    }

    game.events.once("ready", resolve);
  });
}
