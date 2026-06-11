import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import * as MapSession from "../../map/MapSession.js";
import { buildMapWorld } from "../../map/presentation/buildMapWorld.js";
import { registerMapWorld, unregisterMapWorld } from "../../map/mapWorldBridge.js";
import { BaseSpaceScene } from "../BaseSpaceScene.js";

export class WorldMapScene extends BaseSpaceScene {
  constructor() {
    super(SceneKey.WORLD_MAP, GameSpace.WORLD_MAP);
    /** @type {ReturnType<typeof buildMapWorld> | null} */
    this._mapWorld = null;
  }

  buildWorld() {
    this._mapWorld?.destroy();
    this._mapWorld = buildMapWorld(this, MapSession.getGraph());
    registerMapWorld(this._mapWorld);
    this._mapWorld.refresh();
  }

  shutdown() {
    unregisterMapWorld();
    this._mapWorld?.destroy();
    this._mapWorld = null;
    super.shutdown();
  }
}
