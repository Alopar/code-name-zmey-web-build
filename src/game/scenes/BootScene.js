import Phaser from "phaser";
import { BOOT_AUDIO_ASSET_PATHS } from "../../audio/AudioAssets.js";
import { ENEMY_SPRITE_CHROMA } from "../../core/chromaKeyConfig.js";
import { loadKeyedSpritesheet } from "../../core/loadKeyedSpritesheet.js";
import { ASSET_PATHS, AssetKey, KEYED_SPRITE_PATHS, KEYED_SPRITE_COLUMNS } from "../Assets.js";
import { SceneKey } from "../../core/GameSpace.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.BOOT });
  }

  preload() {
    for (const [key, path] of Object.entries(ASSET_PATHS)) {
      this.load.image(key, path);
    }

    for (const [key, path] of Object.entries(BOOT_AUDIO_ASSET_PATHS)) {
      this.load.audio(key, path);
    }
  }

  create() {
    this.loadKeyedSprites()
      .catch((error) => {
        console.warn("[Boot] Chromakey-спрайты не загружены:", error);
      })
      .finally(() => {
        this.scene.start(SceneKey.LOBBY);
      });
  }

  async loadKeyedSprites() {
    for (const [key, path] of Object.entries(KEYED_SPRITE_PATHS)) {
      await loadKeyedSpritesheet({
        scene: this,
        key,
        url: path,
        chroma: ENEMY_SPRITE_CHROMA,
        columns: KEYED_SPRITE_COLUMNS[key] ?? 2,
      });
    }
  }
}
