import { fadeSoundVolume } from "./fadeVolume.js";

/** @typedef {import("../AudioManager.js").AudioManager} AudioManager */

export class MusicChannel {
  /**
   * @param {Phaser.Game} game
   * @param {AudioManager} manager
   */
  constructor(game, manager) {
    this.game = game;
    this.manager = manager;
    /** @type {Phaser.Sound.BaseSound | null} */
    this.current = null;
    /** @type {Promise<void> | null} */
    this.fadeTask = null;
    /** @type {number} */
    this.fadeGeneration = 0;
  }

  /**
   * @param {string} key
   * @param {{ loop?: boolean, fadeInMs?: number, volume?: number }} [options]
   */
  play(key, options = {}) {
    if (!this.game.cache.audio.exists(key)) {
      console.warn("[MusicChannel] Аудио-ассет не загружен:", key);
      return;
    }

    const loop = options.loop ?? true;
    const fadeInMs = options.fadeInMs ?? 0;
    const targetVolume =
      this.manager.getEffectiveVolume("music") * (options.volume ?? 1);

    void this.#startTrack(key, loop, fadeInMs, targetVolume);
  }

  /**
   * @param {{ fadeOutMs?: number }} [options]
   */
  stop(options = {}) {
    void this.#stopCurrent(options.fadeOutMs ?? 0);
  }

  /** @returns {boolean} */
  isPlaying() {
    return Boolean(this.current?.isPlaying);
  }

  /**
   * @param {string} key
   * @param {boolean} loop
   * @param {number} fadeInMs
   * @param {number} targetVolume
   */
  async #startTrack(key, loop, fadeInMs, targetVolume) {
    await this.#stopCurrent(0);

    const sound = this.game.sound.add(key, { loop });
    this.current = sound;
    const generation = this.fadeGeneration;

    if (fadeInMs > 0) {
      sound.setVolume(0);
      sound.play();
      this.fadeTask = fadeSoundVolume(
        sound,
        0,
        targetVolume,
        fadeInMs,
        () => generation === this.fadeGeneration,
      );
      await this.fadeTask;
      if (generation !== this.fadeGeneration) {
        return;
      }
      return;
    }

    sound.setVolume(targetVolume);
    sound.play();
  }

  /**
   * @param {number} fadeOutMs
   */
  async #stopCurrent(fadeOutMs) {
    const sound = this.current;
    if (!sound) {
      return;
    }

    this.current = null;

    if (this.fadeTask) {
      await this.fadeTask;
      this.fadeTask = null;
    }

    if (fadeOutMs > 0 && sound.isPlaying) {
      const from = sound.volume;
      await fadeSoundVolume(sound, from, 0, fadeOutMs);
    }

    sound.stop();
    sound.destroy();
  }

  /** Обновляет громкость текущего трека при изменении настроек. */
  syncVolume() {
    if (!this.current) {
      return;
    }

    this.fadeGeneration += 1;
    this.fadeTask = null;
    this.current.setVolume(this.manager.getEffectiveVolume("music"));
  }
}
