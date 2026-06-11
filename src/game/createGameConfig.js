import Phaser from "phaser";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../core/Viewport.js";
import { BootScene } from "./scenes/BootScene.js";
import { LobbyScene } from "./scenes/LobbyScene.js";
import { WorldMapScene } from "./scenes/WorldMapScene.js";
import { CombatScene } from "./scenes/CombatScene.js";
import { NarrationScene } from "./scenes/NarrationScene.js";

/** @returns {Phaser.Types.Core.GameConfig} */
export function createGameConfig() {
  return {
    type: Phaser.WEBGL,
    parent: "world-view",
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    backgroundColor: "#141c0e",
    scale: {
      mode: Phaser.Scale.NONE,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    },
    scene: [BootScene, LobbyScene, WorldMapScene, CombatScene, NarrationScene],
  };
}
