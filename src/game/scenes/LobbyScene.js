import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { BaseSpaceScene } from "../BaseSpaceScene.js";
import { setupLobbyWorld } from "../lobby/lobbyPresentation.js";

export class LobbyScene extends BaseSpaceScene {
  constructor() {
    super(SceneKey.LOBBY, GameSpace.LOBBY);
  }

  buildWorld() {
    setupLobbyWorld(this);
  }
}
