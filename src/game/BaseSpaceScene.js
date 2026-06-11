import Phaser from "phaser";
import { setSpace } from "../core/GameState.js";

/**
 * Базовая сцена игрового пространства: при каждом create() синхронизирует GameState и UI.
 */
export class BaseSpaceScene extends Phaser.Scene {
  /**
   * @param {string} sceneKey
   * @param {string} gameSpace
   */
  constructor(sceneKey, gameSpace) {
    super({ key: sceneKey });
    this.gameSpace = gameSpace;
  }

  create() {
    setSpace(this.gameSpace);
    this.input.mouse?.disableContextMenu();
    this.buildWorld();
  }

  /** Переопределить в наследнике — только графика world-view. */
  buildWorld() {}
}
