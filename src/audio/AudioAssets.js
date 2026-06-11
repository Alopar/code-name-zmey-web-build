import { AudioKey } from "./AudioKeys.js";

/** Аудио, необходимое до показа лобби. */
export const BOOT_AUDIO_ASSET_PATHS = Object.freeze({
  [AudioKey.MUSIC_MAIN_MENU]: "assets/audio/music/zmey-main-menu-background.mp3",
});

/** Аудио, которое можно подгрузить после старта (эмбиент карты/локации). */
export const DEFERRED_AUDIO_ASSET_PATHS = Object.freeze({
  [AudioKey.AMB_JUNGLE_DENSE_1]:
    "assets/audio/ambient/Dense_Central_Americ_%231-1780261264220.mp3",
  [AudioKey.AMB_JUNGLE_DENSE_2]:
    "assets/audio/ambient/Dense_Central_Americ_%232-1780261264221.mp3",
  [AudioKey.AMB_JUNGLE_DENSE_3]:
    "assets/audio/ambient/Dense_Central_Americ_%233-1780261264222.mp3",
  [AudioKey.AMB_JUNGLE_DENSE_4]:
    "assets/audio/ambient/Dense_Central_Americ_%234-1780261334225.mp3",
});

/** @deprecated Используйте BOOT_AUDIO_ASSET_PATHS / DEFERRED_AUDIO_ASSET_PATHS. */
export const AUDIO_ASSET_PATHS = Object.freeze({
  ...BOOT_AUDIO_ASSET_PATHS,
  ...DEFERRED_AUDIO_ASSET_PATHS,
});
