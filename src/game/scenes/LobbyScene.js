import { AssetKey } from "../Assets.js";
import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { BaseSpaceScene } from "../BaseSpaceScene.js";
import { addWorldBackground } from "../worldBackground.js";

export class LobbyScene extends BaseSpaceScene {
  constructor() {
    super(SceneKey.LOBBY, GameSpace.LOBBY);
  }

  buildWorld() {
    addWorldBackground(this, AssetKey.LOBBY_BG);
  }
}
