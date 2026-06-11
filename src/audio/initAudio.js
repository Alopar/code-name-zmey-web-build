import { createAudioManager, getAudioManager } from "./AudioManager.js";
import { resyncSceneAudio } from "./initSceneAudio.js";

/** @type {(() => void) | null} */
let removeUnlockListeners = null;

function bindAudioUnlock(game) {
  removeUnlockListeners?.();

  const unlock = () => {
    getAudioManager()?.unlock();
    resyncSceneAudio();
  };

  const options = { capture: true, once: true };
  window.addEventListener("pointerdown", unlock, options);
  window.addEventListener("keydown", unlock, options);

  removeUnlockListeners = () => {
    window.removeEventListener("pointerdown", unlock, options);
    window.removeEventListener("keydown", unlock, options);
    removeUnlockListeners = null;
  };
}

/**
 * @param {Phaser.Game} game
 * @returns {import("./AudioManager.js").AudioManager}
 */
export function initAudio(game) {
  const manager = createAudioManager(game);
  manager.unlock();
  bindAudioUnlock(game);
  return manager;
}
