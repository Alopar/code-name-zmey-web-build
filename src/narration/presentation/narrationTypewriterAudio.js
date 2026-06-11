import { AudioKey } from "../../audio/AudioKeys.js";
import { getAudioManager } from "../../audio/AudioManager.js";

/** Ритм «пи-пи-пии-пи-пи-пиии» на цикл. */
const TYPEWRITER_RHYTHM = Object.freeze([
  AudioKey.NARRATION_TYPEWRITER_TICK,
  AudioKey.NARRATION_TYPEWRITER_TICK,
  AudioKey.NARRATION_TYPEWRITER_BEEP,
  AudioKey.NARRATION_TYPEWRITER_TICK,
  AudioKey.NARRATION_TYPEWRITER_TICK,
  AudioKey.NARRATION_TYPEWRITER_BEEP,
  AudioKey.NARRATION_TYPEWRITER_BEEP_LONG,
]);

/** @type {number} */
let rhythmIndex = 0;

/**
 * @param {number} charIndex
 * @param {string} char
 */
export function playNarrationTypewriterSound(charIndex, char) {
  if (/\s/.test(char)) {
    return;
  }

  const key = TYPEWRITER_RHYTHM[rhythmIndex % TYPEWRITER_RHYTHM.length];
  rhythmIndex += 1;

  getAudioManager()?.playSfx(key, { volume: 0.42 });
}

export function resetNarrationTypewriterSound() {
  rhythmIndex = 0;
}
