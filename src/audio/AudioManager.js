import { AmbientChannel } from "./channels/AmbientChannel.js";
import { MusicChannel } from "./channels/MusicChannel.js";
import { SfxChannel } from "./channels/SfxChannel.js";

/** @typedef {"master" | "sfx" | "music" | "ambient"} VolumeCategory */

export class AudioManager {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game) {
    this.game = game;
    /** @type {Record<VolumeCategory, number>} */
    this.volumes = {
      master: 1,
      sfx: 1,
      music: 0.7,
      ambient: 0.5,
    };

    this.sfx = new SfxChannel(game, this);
    this.music = new MusicChannel(game, this);
    this.ambient = new AmbientChannel(game, this);
  }

  /**
   * @param {"sfx" | "music" | "ambient"} category
   * @returns {number}
   */
  getEffectiveVolume(category) {
    return this.volumes.master * this.volumes[category];
  }

  /**
   * @param {VolumeCategory} category
   * @returns {number}
   */
  getVolume(category) {
    return this.volumes[category];
  }

  /**
   * @param {VolumeCategory} category
   * @param {number} value
   */
  setVolume(category, value) {
    this.volumes[category] = Math.max(0, Math.min(1, value));

    if (category === "music" || category === "master") {
      this.music.syncVolume();
    }
    if (category === "ambient" || category === "master") {
      this.ambient.syncVolume();
    }
  }

  /**
   * @param {string} key
   * @param {object} [options]
   */
  playSfx(key, options) {
    this.sfx.play(key, options);
  }

  /**
   * @param {string} key
   * @param {{ loop?: boolean, fadeInMs?: number, volume?: number }} [options]
   */
  playMusic(key, options) {
    this.music.play(key, options);
  }

  /**
   * @param {{ fadeOutMs?: number }} [options]
   */
  stopMusic(options) {
    this.music.stop(options);
  }

  /** @returns {boolean} */
  isMusicPlaying() {
    return this.music.isPlaying();
  }

  /**
   * @param {string} key
   * @param {{ loop?: boolean, fadeInMs?: number, volume?: number }} [options]
   */
  playAmbient(key, options) {
    this.ambient.play(key, options);
  }

  /**
   * @param {{ fadeOutMs?: number }} [options]
   */
  stopAmbient(options) {
    this.ambient.stop(options);
  }

  /**
   * @param {string[]} keys
   * @param {{ fadeInMs?: number, volume?: number }} [options]
   */
  playAmbientSequence(keys, options) {
    this.ambient.playSequence(keys, options);
  }

  /**
   * @param {string[]} keys
   * @returns {boolean}
   */
  isAmbientSequencePlaying(keys) {
    return this.ambient.isPlayingSequence(keys);
  }

  unlock() {
    if (typeof this.game.sound?.unlock === "function") {
      this.game.sound.unlock();
    }

    const context = this.game.sound?.context;
    if (context instanceof AudioContext && context.state === "suspended") {
      void context.resume();
    }
  }
}

/** @type {AudioManager | null} */
let instance = null;

/**
 * @param {Phaser.Game} game
 * @returns {AudioManager}
 */
export function createAudioManager(game) {
  instance = new AudioManager(game);
  return instance;
}

/**
 * @returns {AudioManager | null}
 */
export function getAudioManager() {
  return instance;
}
