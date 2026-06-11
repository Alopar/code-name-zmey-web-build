import Phaser from "phaser";
import { GameEvents, on } from "../../core/EventBus.js";
import { getCurrentSpace } from "../../core/GameState.js";
import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { isDebugEnabled, onDebugSettingsChanged } from "../DebugSettings.js";
import { collectCombatDebugTargets } from "./collectCombatDebugTargets.js";
import { drawDebugOverlay } from "./drawDebugOverlay.js";

const OVERLAY_DEPTH = 9999;

export class PivotOverlayController {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game) {
    this.game = game;
    /** @type {import("../../game/scenes/CombatScene.js").CombatScene | null} */
    this.combatScene = null;
    /** @type {Phaser.GameObjects.Graphics | null} */
    this.graphics = null;
    /** @type {(() => void) | null} */
    this._unsubSpace = null;
    /** @type {(() => void) | null} */
    this._unsubCombatStarted = null;
    /** @type {(() => void) | null} */
    this._unsubSettings = null;
    /** @type {((time: number, delta: number) => void) | null} */
    this._onPostUpdate = null;
    /** @type {(() => void) | null} */
    this._onSceneShutdown = null;
  }

  start() {
    this._unsubSpace = on(GameEvents.SPACE_CHANGED, (detail) => {
      if (detail?.space === GameSpace.COMBAT) {
        this.scheduleAttach();
        return;
      }

      if (detail?.prev === GameSpace.COMBAT) {
        this.detachFromCombatScene();
      }
    });

    this._unsubCombatStarted = on(GameEvents.COMBAT_STARTED, () => {
      this.scheduleAttach();
    });

    this._unsubSettings = onDebugSettingsChanged(() => {
      if (!isDebugEnabled()) {
        this.graphics?.clear();
        return;
      }

      if (getCurrentSpace() === GameSpace.COMBAT) {
        this.scheduleAttach();
      }
    });
  }

  destroy() {
    this.detachFromCombatScene();
    this._unsubSpace?.();
    this._unsubSpace = null;
    this._unsubCombatStarted?.();
    this._unsubCombatStarted = null;
    this._unsubSettings?.();
    this._unsubSettings = null;
  }

  scheduleAttach() {
    if (!isDebugEnabled()) {
      return;
    }

    const scene = this.game.scene.getScene(SceneKey.COMBAT);
    if (!scene) {
      return;
    }

    const runAttach = () => {
      if (!isDebugEnabled() || getCurrentSpace() !== GameSpace.COMBAT) {
        return;
      }

      if (!scene.scene.isActive()) {
        return;
      }

      this.attachToCombatScene(scene);
    };

    if (scene.scene.isActive() && scene.sys?.isActive()) {
      runAttach();
      return;
    }

    scene.events.once(Phaser.Scenes.Events.CREATE, runAttach);
  }

  /**
   * @param {import("../../game/scenes/CombatScene.js").CombatScene} scene
   */
  attachToCombatScene(scene) {
    this.detachFromCombatScene();

    this.combatScene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(OVERLAY_DEPTH);

    this._onPostUpdate = () => {
      if (!isDebugEnabled() || getCurrentSpace() !== GameSpace.COMBAT) {
        this.graphics?.clear();
        return;
      }

      if (!this.graphics?.active || !this.combatScene?.sys?.isActive()) {
        return;
      }

      const targets = collectCombatDebugTargets(this.combatScene);
      drawDebugOverlay(this.graphics, targets);
    };

    this._onSceneShutdown = () => {
      this.detachFromCombatScene();
    };

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this._onPostUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onSceneShutdown);
  }

  detachFromCombatScene() {
    if (this.combatScene) {
      if (this._onPostUpdate) {
        this.combatScene.events.off(Phaser.Scenes.Events.POST_UPDATE, this._onPostUpdate);
      }
      if (this._onSceneShutdown) {
        this.combatScene.events.off(Phaser.Scenes.Events.SHUTDOWN, this._onSceneShutdown);
      }
    }

    this._onPostUpdate = null;
    this._onSceneShutdown = null;
    this.graphics?.destroy();
    this.graphics = null;
    this.combatScene = null;
  }
}
