import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";
import { BaseSpaceScene } from "../BaseSpaceScene.js";

const NARRATION_BG = 0x0a0e08;

export class NarrationScene extends BaseSpaceScene {
  constructor() {
    super(SceneKey.NARRATION, GameSpace.NARRATION);
  }

  buildWorld() {
    this.cameras.main.setBackgroundColor(NARRATION_BG);
    this.add
      .rectangle(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, NARRATION_BG, 1)
      .setDepth(0);
  }
}
