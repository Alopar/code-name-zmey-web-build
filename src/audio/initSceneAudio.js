import { JUNGLE_DENSE_AMBIENT } from "./ambientPlaylists.js";
import { getAudioManager } from "./AudioManager.js";
import { AudioKey } from "./AudioKeys.js";
import { DEFERRED_AUDIO_ASSET_PATHS } from "./AudioAssets.js";
import { AMBIENT_FADE_MS, MUSIC_FADE_MS } from "./audioTiming.js";
import { loadAudioAssets } from "./loadAudioAssets.js";
import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { getCurrentSpace } from "../core/GameState.js";

/** @type {ReadonlySet<string>} */
const AMBIENT_SPACES = new Set([GameSpace.WORLD_MAP, GameSpace.COMBAT]);

/**
 * @param {string} space
 */
async function applySceneAudio(space) {
  const audio = getAudioManager();
  if (!audio) {
    return;
  }

  if (space === GameSpace.LOBBY) {
    audio.stopAmbient({ fadeOutMs: AMBIENT_FADE_MS });
    audio.playMusic(AudioKey.MUSIC_MAIN_MENU, {
      loop: true,
      fadeInMs: MUSIC_FADE_MS,
    });
    return;
  }

  if (AMBIENT_SPACES.has(space)) {
    audio.stopMusic({ fadeOutMs: MUSIC_FADE_MS });

    try {
      await loadAudioAssets(audio.game, DEFERRED_AUDIO_ASSET_PATHS);
    } catch (error) {
      console.warn("[SceneAudio] Эмбиент не загружен:", error);
    }

    audio.playAmbientSequence(JUNGLE_DENSE_AMBIENT, {
      fadeInMs: AMBIENT_FADE_MS,
    });
    return;
  }

  audio.stopMusic({ fadeOutMs: MUSIC_FADE_MS });
  audio.stopAmbient({ fadeOutMs: AMBIENT_FADE_MS });
}

/** Повторный запуск, если браузер заблокировал autoplay до первого клика. */
export function resyncSceneAudio() {
  const audio = getAudioManager();
  if (!audio) {
    return;
  }

  const space = getCurrentSpace();

  if (space === GameSpace.LOBBY && !audio.isMusicPlaying()) {
    audio.playMusic(AudioKey.MUSIC_MAIN_MENU, {
      loop: true,
      fadeInMs: MUSIC_FADE_MS,
    });
  }
}

/**
 * @returns {() => void}
 */
export function initSceneAudio() {
  void applySceneAudio(getCurrentSpace());

  return on(GameEvents.SPACE_CHANGED, (detail) => {
    if (!detail?.space) {
      return;
    }

    void applySceneAudio(detail.space);
  });
}
