import { getSoundDefinition } from "../sounds/index.js";

/** @typedef {import("../AudioManager.js").AudioManager} AudioManager */

export class SfxChannel {
  /**
   * @param {Phaser.Game} game
   * @param {AudioManager} manager
   */
  constructor(game, manager) {
    this.game = game;
    this.manager = manager;
  }

  /**
   * @returns {AudioContext | null}
   */
  #getAudioContext() {
    const context = this.game.sound?.context;
    return context instanceof AudioContext ? context : null;
  }

  /**
   * @param {string} key
   * @param {object} [options]
   */
  play(key, options = {}) {
    const definition = getSoundDefinition(key);
    if (!definition) {
      console.warn("[SfxChannel] Неизвестный SFX:", key);
      return;
    }

    const volume = this.manager.getEffectiveVolume("sfx") * (options.volume ?? 1);

    if (definition.kind === "procedural") {
      this.#playProcedural(definition.generator, volume);
      return;
    }

    this.#playAsset(definition.key, volume, definition.loop ?? false);
  }

  /**
   * @param {(ctx: AudioContext, destination: AudioNode, volume?: number) => void} generator
   * @param {number} volume
   */
  #playProcedural(generator, volume) {
    const ctx = this.#getAudioContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const output = ctx.createGain();
    output.gain.value = volume;
    output.connect(ctx.destination);
    generator(ctx, output, 1);
  }

  /**
   * @param {string} key
   * @param {number} volume
   * @param {boolean} loop
   */
  #playAsset(key, volume, loop) {
    if (!this.game.cache.audio.exists(key)) {
      console.warn("[SfxChannel] Аудио-ассет не загружен:", key);
      return;
    }

    this.game.sound.play(key, { volume, loop });
  }
}
