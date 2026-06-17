import Phaser from "phaser";
import { GameEvents, on } from "../../core/EventBus.js";
import { getCurrentSpace } from "../../core/GameState.js";
import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { collectDebugEntitiesFromScene, collectSpawnGuideOverlayLines } from "../adapters/debugEntityRegistry.js";
import { isSpawnGuideDebugEntity } from "../adapters/spawnGuideDebugAdapter.js";
import { copyToClipboard } from "../export/copyToClipboard.js";
import { formatDebugExport } from "../export/formatDebugExport.js";
import { isDebugEnabled, onDebugSettingsChanged } from "../DebugSettings.js";
import { DebugInputHandler } from "../interaction/DebugInputHandler.js";
import { DebugSelectionController } from "../interaction/DebugSelectionController.js";
import { SpawnGuideDebugSession } from "../spawnGuides/SpawnGuideDebugSession.js";
import {
  shadowViewOffsetToFrame,
  spriteViewOffsetToFrame,
} from "../../game/visualFrameOffset.js";
import { collectDebugOverlayTargets } from "./collectDebugOverlayTargets.js";
import { drawDebugOverlay } from "./drawDebugOverlay.js";
import { drawSpawnGuideOverlay } from "./drawSpawnGuideOverlay.js";

const OVERLAY_DEPTH = 9999;
const LABEL_DEPTH = 10000;

const LABEL_STYLE = Object.freeze({
  fontFamily: '"PT Sans Narrow", sans-serif',
  fontSize: "14px",
  color: "#40e060",
  backgroundColor: "#000000aa",
  padding: { x: 4, y: 2 },
});

const LABEL_OFFSET_X = 40;
const LABEL_OFFSET_Y = 24;

export class CombatDebugController {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game) {
    this.game = game;
    /** @type {import("../../game/scenes/CombatScene.js").CombatScene | null} */
    this.combatScene = null;
    /** @type {Phaser.GameObjects.Graphics | null} */
    this.graphics = null;
    /** @type {Phaser.GameObjects.Text | null} */
    this.shadowLabel = null;
    /** @type {Phaser.GameObjects.Text | null} */
    this.spriteLabel = null;
    this.selection = new DebugSelectionController();
    this.inputHandler = new DebugInputHandler({
      getSelectedEntity: () => this.getSelectedEntity(),
      onExport: (entity) => {
        void this.exportEntity(entity);
      },
    });
    /** @type {SpawnGuideDebugSession | null} */
    this.spawnGuideSession = null;
    /** @type {(DebugEntityAdapter | ReturnType<typeof import("../adapters/spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter>)[]} */
    this._entities = [];
    /** @type {(() => void) | null} */
    this._unsubSpace = null;
    /** @type {(() => void) | null} */
    this._unsubCombatStarted = null;
    /** @type {(() => void) | null} */
    this._unsubSettings = null;
    /** @type {((time: number, delta: number) => void) | null} */
    this._onPostUpdate = null;
    /** @type {((pointer: Phaser.Input.Pointer) => void) | null} */
    this._onPointerDown = null;
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
        this.clearOverlay();
        this.selection.clear();
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
   * @returns {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter | null}
   */
  getSelectedEntity() {
    return this.selection.findSelected(this._entities);
  }

  /**
   * @param {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} entity
   */
  async exportEntity(entity) {
    const payload = formatDebugExport(entity);
    await copyToClipboard(JSON.stringify(payload, null, 2));
  }

  clearOverlay() {
    this.graphics?.clear();
    this.shadowLabel?.setVisible(false);
    this.spriteLabel?.setVisible(false);
  }

  /**
   * @param {import("../../game/scenes/CombatScene.js").CombatScene} scene
   */
  attachToCombatScene(scene) {
    this.detachFromCombatScene();

    this.combatScene = scene;
    this.spawnGuideSession = new SpawnGuideDebugSession(scene.combatLocationId);
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(OVERLAY_DEPTH);

    this.shadowLabel = scene.add.text(0, 0, "", LABEL_STYLE);
    this.shadowLabel.setDepth(LABEL_DEPTH);
    this.shadowLabel.setOrigin(1, 0);
    this.shadowLabel.setVisible(false);

    this.spriteLabel = scene.add.text(0, 0, "", LABEL_STYLE);
    this.spriteLabel.setDepth(LABEL_DEPTH);
    this.spriteLabel.setOrigin(0, 0);
    this.spriteLabel.setVisible(false);

    this.inputHandler.attach(scene);

    this._onPointerDown = (pointer) => {
      if (!isDebugEnabled() || getCurrentSpace() !== GameSpace.COMBAT) {
        return;
      }

      this.selection.handlePointerDown(pointer, this._entities);
    };

    scene.input.on("pointerdown", this._onPointerDown);

    this._onPostUpdate = () => {
      if (!isDebugEnabled() || getCurrentSpace() !== GameSpace.COMBAT) {
        this.clearOverlay();
        return;
      }

      if (!this.graphics?.active || !this.combatScene?.sys?.isActive()) {
        return;
      }

      this._entities = collectDebugEntitiesFromScene(
        this.combatScene,
        this.spawnGuideSession,
      );
      const selectedEntity = this.selection.findSelected(this._entities);
      if (!selectedEntity && this.selection.getSelection()) {
        this.selection.clear();
      }
      const selected = this.selection.getSelection();
      const worldEntities = this._entities.filter((entity) => !isSpawnGuideDebugEntity(entity));
      const targets = collectDebugOverlayTargets(worldEntities);
      drawDebugOverlay(this.graphics, targets, selected);

      const spawnGuideLines = collectSpawnGuideOverlayLines(this._entities);
      drawSpawnGuideOverlay(this.graphics, spawnGuideLines, selected);
      this.updateLabels(selectedEntity);
    };

    this._onSceneShutdown = () => {
      this.detachFromCombatScene();
    };

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this._onPostUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onSceneShutdown);
  }

  /**
   * @param {DebugEntityAdapter | ReturnType<typeof import("../adapters/spawnGuideDebugAdapter.js").createSpawnGuideDebugAdapter> | null} entity
   */
  updateLabels(entity) {
    if (!this.shadowLabel || !this.spriteLabel) {
      return;
    }

    if (!entity) {
      this.shadowLabel.setVisible(false);
      this.spriteLabel.setVisible(false);
      return;
    }

    if (isSpawnGuideDebugEntity(entity)) {
      const offset = entity.getOffsetFromCenter();
      const position = entity.getWorldPosition();

      this.shadowLabel.setText(`line offsetY: ${offset.offsetY}`);
      this.shadowLabel.setPosition(position.x, position.y + LABEL_OFFSET_Y);
      this.shadowLabel.setOrigin(0.5, 0);
      this.shadowLabel.setVisible(true);
      this.spriteLabel.setVisible(false);
      return;
    }

    this.shadowLabel.setOrigin(1, 0);
    this.spriteLabel.setOrigin(0, 0);

    const shadowOffset = entity.getShadowOffset();
    const spriteOffset = entity.getSpriteOffset();
    const baseScale = entity.getBaseScale();
    const pivotX = entity.pivot.x;
    const pivotY = entity.pivot.y;

    const shadowFrame = shadowViewOffsetToFrame(shadowOffset.x, shadowOffset.y, baseScale);
    const spriteFrame = spriteViewOffsetToFrame(spriteOffset.x, spriteOffset.y, baseScale);

    this.shadowLabel.setText(
      `shadow: ${shadowFrame.offsetX}, ${shadowFrame.offsetY} (${entity.getShadowLayer()})`,
    );
    this.shadowLabel.setPosition(pivotX - LABEL_OFFSET_X, pivotY + LABEL_OFFSET_Y);
    this.shadowLabel.setVisible(true);

    this.spriteLabel.setText(
      `sprite: ${spriteFrame.offsetX}, ${spriteFrame.offsetY}`,
    );
    this.spriteLabel.setPosition(pivotX + LABEL_OFFSET_X, pivotY + LABEL_OFFSET_Y);
    this.spriteLabel.setVisible(true);
  }

  detachFromCombatScene() {
    if (this.combatScene) {
      if (this._onPostUpdate) {
        this.combatScene.events.off(Phaser.Scenes.Events.POST_UPDATE, this._onPostUpdate);
      }
      if (this._onSceneShutdown) {
        this.combatScene.events.off(Phaser.Scenes.Events.SHUTDOWN, this._onSceneShutdown);
      }
      if (this._onPointerDown) {
        this.combatScene.input.off("pointerdown", this._onPointerDown);
      }
    }

    this.inputHandler.detach();
    this._onPostUpdate = null;
    this._onSceneShutdown = null;
    this._onPointerDown = null;
    this._entities = [];
    this.spawnGuideSession = null;

    this.graphics?.destroy();
    this.graphics = null;
    this.shadowLabel?.destroy();
    this.shadowLabel = null;
    this.spriteLabel?.destroy();
    this.spriteLabel = null;
    this.combatScene = null;
  }
}

/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */
