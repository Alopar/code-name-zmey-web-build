import { fadeSoundVolume } from "./fadeVolume.js";

/** @typedef {import("../AudioManager.js").AudioManager} AudioManager */

export class AmbientChannel {
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
    /** @type {string[] | null} */
    this.sequenceKeys = null;
    /** @type {number} */
    this.sequenceIndex = 0;
    /** @type {boolean} */
    this.sequenceActive = false;
    /** @type {number} */
    this.sequenceVolume = 1;
    /** @type {(() => void) | null} */
    this.onCompleteHandler = null;
  }

  /**
   * @param {string} key
   * @param {{ loop?: boolean, fadeInMs?: number, volume?: number }} [options]
   */
  play(key, options = {}) {
    if (!this.game.cache.audio.exists(key)) {
      console.warn("[AmbientChannel] Аудио-ассет не загружен:", key);
      return;
    }

    this.#clearSequenceState();

    const loop = options.loop ?? true;
    const fadeInMs = options.fadeInMs ?? 0;
    const targetVolume =
      this.manager.getEffectiveVolume("ambient") * (options.volume ?? 1);

    void this.#startTrack(key, loop, fadeInMs, targetVolume);
  }

  /**
   * @param {string[]} keys
   * @param {{ fadeInMs?: number, volume?: number }} [options]
   */
  playSequence(keys, options = {}) {
    if (!keys.length) {
      return;
    }

    if (this.sequenceActive && this.#isSameSequence(keys)) {
      return;
    }

    for (const key of keys) {
      if (!this.game.cache.audio.exists(key)) {
        console.warn("[AmbientChannel] Аудио-ассет не загружен:", key);
        return;
      }
    }

    this.sequenceKeys = keys.slice();
    this.sequenceActive = true;
    this.sequenceIndex = 0;
    this.sequenceVolume = options.volume ?? 1;

    const fadeInMs = options.fadeInMs ?? 0;
    const targetVolume =
      this.manager.getEffectiveVolume("ambient") * this.sequenceVolume;

    void this.#startSequenceTrack(0, fadeInMs, targetVolume);
  }

  /**
   * @param {string[]} keys
   * @returns {boolean}
   */
  isPlayingSequence(keys) {
    return this.sequenceActive && this.#isSameSequence(keys);
  }

  /**
   * @param {{ fadeOutMs?: number }} [options]
   */
  stop(options = {}) {
    this.#clearSequenceState();
    void this.#stopCurrent(options.fadeOutMs ?? 0);
  }

  syncVolume() {
    if (!this.current) {
      return;
    }

    this.fadeGeneration += 1;
    this.fadeTask = null;

    const multiplier = this.sequenceActive ? this.sequenceVolume : 1;
    this.current.setVolume(this.manager.getEffectiveVolume("ambient") * multiplier);
  }

  /**
   * @param {string[]} keys
   * @returns {boolean}
   */
  #isSameSequence(keys) {
    if (!this.sequenceKeys || this.sequenceKeys.length !== keys.length) {
      return false;
    }

    return this.sequenceKeys.every((key, index) => key === keys[index]);
  }

  #clearSequenceState() {
    this.sequenceActive = false;
    this.sequenceKeys = null;
    this.sequenceIndex = 0;
    this.sequenceVolume = 1;
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
   * @param {number} index
   * @param {number} fadeInMs
   * @param {number} targetVolume
   */
  async #startSequenceTrack(index, fadeInMs, targetVolume) {
    if (!this.sequenceActive || !this.sequenceKeys) {
      return;
    }

    await this.#stopCurrent(0);

    if (!this.sequenceActive || !this.sequenceKeys) {
      return;
    }

    const key = this.sequenceKeys[index];
    this.sequenceIndex = index;

    const sound = this.game.sound.add(key, { loop: false });
    this.current = sound;
    const generation = this.fadeGeneration;

    this.onCompleteHandler = () => {
      if (!this.sequenceActive || !this.sequenceKeys) {
        return;
      }

      const nextIndex = (this.sequenceIndex + 1) % this.sequenceKeys.length;
      const volume =
        this.manager.getEffectiveVolume("ambient") * this.sequenceVolume;
      void this.#startSequenceTrack(nextIndex, 0, volume);
    };
    sound.once("complete", this.onCompleteHandler);

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

    if (this.onCompleteHandler) {
      sound.off("complete", this.onCompleteHandler);
      this.onCompleteHandler = null;
    }

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
}
