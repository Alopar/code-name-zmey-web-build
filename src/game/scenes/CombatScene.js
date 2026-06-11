import Phaser from "phaser";
import { GameEvents, on } from "../../core/EventBus.js";
import { GameSpace, SceneKey } from "../../core/GameSpace.js";
import { VIEWPORT_HEIGHT } from "../../core/Viewport.js";
import {
  PLAYER_FLOAT_FEEDBACK_MS,
  spawnPlayerFloatingText,
} from "../combat/spawnPlayerFloatingText.js";
import { notifyAnimComplete } from "../../combat/combatAnimBridge.js";
import { notifyFeedbackComplete } from "../../combat/combatFeedbackBridge.js";
import * as CombatSession from "../../combat/CombatSession.js";
import { GlobalScreenFeedback } from "../feedback/global/GlobalScreenFeedback.js";
import { runGlobalScreenFeedback } from "../feedback/global/runGlobalScreenFeedback.js";
import { runEnemyFeedback } from "../feedback/runEnemyFeedback.js";
import { registerBloodBurnDissolveFilter } from "../feedback/filters/bloodBurnDissolveFilter.js";
import {
  getEnemySpriteDisplayWidth,
  layoutEnemyPositions,
} from "../combatEnemyLayout.js";
import { spawnCombatChestPresentation } from "../chestCombatPresentation.js";
import {
  createBreathOptionsForIndex,
  spawnCombatEnemyPresentation,
} from "../enemyCombatPresentation.js";
import { spawnCombatLootPresentation } from "../lootCombatPresentation.js";
import { syncCombatSceneWorldDepths } from "../combatWorldDepth.js";
import { BaseSpaceScene } from "../BaseSpaceScene.js";
import { addWorldBackground } from "../worldBackground.js";

/**
 * @param {Phaser.Scene} scene
 * @param {object} view
 * @param {string[]} effectNames
 * @param {Record<string, object>} effectOptions
 * @returns {Promise<void>}
 */
function runEnemyFeedbackAsync(scene, view, effectNames, effectOptions = {}) {
  return new Promise((resolve) => {
    runEnemyFeedback(scene, view, effectNames, resolve, effectOptions);
  });
}

/** Высота врага на тропе (доля viewport). */
const ENEMY_DISPLAY_HEIGHT = VIEWPORT_HEIGHT * 0.52;
const ENEMY_ATTACK_HOLD_MS = 420;
export class CombatScene extends BaseSpaceScene {
  constructor() {
    super(SceneKey.COMBAT, GameSpace.COMBAT);
    /** @type {Map<string, ReturnType<typeof spawnCombatEnemyPresentation>>} */
    this.enemyViews = new Map();
    /** @type {Map<string, ReturnType<typeof spawnCombatLootPresentation>>} */
    this.lootViews = new Map();
    /** @type {Map<string, ReturnType<typeof spawnCombatChestPresentation>>} */
    this.chestViews = new Map();
    /** @type {GlobalScreenFeedback | null} */
    this.screenFeedback = null;
    /** @type {(() => void) | null} */
    this._unsubCombatEvents = null;
  }

  create() {
    CombatSession.setScene(this);
    super.create();
  }

  buildWorld() {
    if (this.game.renderer?.type === Phaser.WEBGL) {
      registerBloodBurnDissolveFilter(this.game.renderer);
    }

    this.clearChestViews();
    this.screenFeedback?.destroy();
    this.screenFeedback = new GlobalScreenFeedback(this);
    this.bindCombatEvents();

    const encounter = CombatSession.consume();
    addWorldBackground(this, encounter.location.bgKey);

    this.spawnEnemies(encounter.enemies);
  }

  /**
   * @param {import("../../combat/entities/Enemy.js").Enemy[]} enemies
   */
  spawnEnemies(enemies) {
    this.clearEnemyViews();

    const spriteDisplayWidth = enemies.reduce((maxWidth, enemy) => {
      const width = getEnemySpriteDisplayWidth(this, enemy, ENEMY_DISPLAY_HEIGHT);
      return Math.max(maxWidth, width);
    }, 0);

    const positions = layoutEnemyPositions(enemies.length, spriteDisplayWidth);

    enemies.forEach((enemy, index) => {
      const pos = positions[index];
      if (!pos) {
        return;
      }

      const view = spawnCombatEnemyPresentation(
        this,
        enemy,
        pos.x,
        pos.y,
        ENEMY_DISPLAY_HEIGHT,
        createBreathOptionsForIndex(index),
      );

      if (!view) {
        return;
      }

      view.sprite.on("pointerdown", () => {
        CombatSession.getEngine()?.selectTarget(view.combatantId);
      });

      this.enemyViews.set(view.combatantId, view);
    });

    syncCombatSceneWorldDepths(this);
  }

  clearEnemyViews() {
    for (const view of this.enemyViews.values()) {
      view.destroy();
    }
    this.enemyViews.clear();
  }

  /** Сброс ссылок при shutdown — display list уничтожает Phaser. */
  releaseEnemyViews() {
    this.enemyViews.clear();
  }

  /**
   * @param {string} combatantId
   * @returns {ReturnType<typeof spawnCombatEnemyPresentation> | undefined}
   */
  getEnemyView(combatantId) {
    return this.enemyViews.get(combatantId);
  }

  /**
   * @param {string} combatantId
   */
  removeEnemyView(combatantId) {
    const view = this.enemyViews.get(combatantId);
    if (!view) {
      return;
    }
    view.destroy();
    this.enemyViews.delete(combatantId);
  }

  /**
   * @param {import("../../combat/entities/CombatLootDrop.js").CombatLootDrop} drop
   */
  spawnLootView(drop) {
    const view = spawnCombatLootPresentation(this, drop);
    if (!view) {
      return;
    }

    view.sprite.on("pointerdown", () => {
      this.handleLootPickup(view.dropId);
    });

    this.lootViews.set(view.dropId, view);
    syncCombatSceneWorldDepths(this);
  }

  /**
   * @param {string} dropId
   */
  handleLootPickup(dropId) {
    const view = this.lootViews.get(dropId);
    if (!view) {
      return;
    }

    const engine = CombatSession.getEngine();
    const picked = engine?.pickupLoot(dropId);
    if (!picked) {
      return;
    }

    this.lootViews.delete(dropId);
    if (view.sprite.input) {
      view.sprite.removeInteractive();
    }
    view.playPickupAnimation(() => {
      view.destroy();
    });
  }

  clearLootViews() {
    for (const view of this.lootViews.values()) {
      view.destroy();
    }
    this.lootViews.clear();
  }

  releaseLootViews() {
    this.lootViews.clear();
  }

  /**
   * @param {import("../../combat/entities/CombatChest.js").CombatChest} chest
   */
  spawnChestView(chest) {
    if (this.chestViews.has(chest.id)) {
      return;
    }

    const view = spawnCombatChestPresentation(this, chest);
    if (!view) {
      console.warn("[CombatScene] Не удалось создать view сундука:", chest.containerId);
      return;
    }

    view.sprite.on("pointerdown", () => {
      this.handleChestTap(view.chestId);
    });

    this.chestViews.set(view.chestId, view);
    syncCombatSceneWorldDepths(this);
  }

  syncChestViewsFromEngine() {
    const engine = CombatSession.getEngine();
    if (!engine?.victory || engine.phase !== "ended") {
      return;
    }

    for (const chest of engine.getChests()) {
      this.spawnChestView(chest);
    }
  }

  /**
   * @param {string} chestId
   */
  handleChestTap(chestId) {
    const view = this.chestViews.get(chestId);
    if (!view || view.isBusy || view.opened) {
      return;
    }

    const engine = CombatSession.getEngine();
    const result = engine?.tapChest(chestId);
    if (!result) {
      return;
    }

    view.playTapFeedback(() => {
      if (!result.readyToOpen) {
        return;
      }

      const drops = engine.openChest(chestId);
      view.playOpenAnimation(() => {
        for (const drop of drops) {
          this.spawnLootView(drop);
        }
      });
    });
  }

  clearChestViews() {
    for (const view of this.chestViews.values()) {
      view.destroy();
    }
    this.chestViews.clear();
  }

  releaseChestViews() {
    this.chestViews.clear();
  }

  bindCombatEvents() {
    this._unsubCombatEvents?.();
    this._unsubCombatEvents = () => {
      this._unsubAnim?.();
      this._unsubFeedback?.();
      this._unsubScreenFeedback?.();
      this._unsubCombatState?.();
      this._unsubCombatEnded?.();
    };

    this._unsubAnim = on(GameEvents.COMBAT_ANIM_REQUEST, (detail) => {
      if (detail?.type === "enemy_attack") {
        const combatantId = detail.combatantId;
        this.playEnemyAttack(combatantId, ENEMY_ATTACK_HOLD_MS, () => {
          notifyAnimComplete();
        });
      }
    });

    this._unsubFeedback = on(GameEvents.COMBAT_FEEDBACK_REQUEST, (detail) => {
      const feedbackType = detail?.type;

      if (feedbackType === "player_heal") {
        const healAmount = typeof detail.healAmount === "number" ? detail.healAmount : 0;
        spawnPlayerFloatingText(this, { preset: "heal", value: healAmount });
        this.time.delayedCall(PLAYER_FLOAT_FEEDBACK_MS, () => {
          notifyFeedbackComplete();
        });
        return;
      }

      if (feedbackType !== "enemy_hit" && feedbackType !== "enemy_death") {
        notifyFeedbackComplete();
        return;
      }

      const combatantId = detail.combatantId;
      const view = combatantId ? this.getEnemyView(combatantId) : undefined;
      if (!view) {
        notifyFeedbackComplete();
        return;
      }

      const effects = Array.isArray(detail.effects) ? detail.effects : [];
      const effectOptions =
        detail.effectOptions && typeof detail.effectOptions === "object"
          ? detail.effectOptions
          : {};

      view.pauseBreathing();

      if (feedbackType === "enemy_hit") {
        const hitEffects =
          effects.length > 0 ? effects : ["redBlink", "shake", "bloodSplash"];
        const hpPercent = typeof detail.hpPercent === "number" ? detail.hpPercent : 0;
        const previousHpPercent =
          typeof detail.previousHpPercent === "number"
            ? detail.previousHpPercent
            : hpPercent;

        void Promise.all([
          runEnemyFeedbackAsync(this, view, hitEffects, effectOptions),
          view.animateHpToPercent(hpPercent, previousHpPercent),
        ]).then(() => {
          notifyFeedbackComplete();
        });
        return;
      }

      const deathEffects =
        effects.length > 0
          ? effects
          : ["bloodBurnDissolve", "shadowShrink", "bloodBurstLoop"];

      view.hideHpBar();

      runEnemyFeedback(this, view, deathEffects, () => {
        const { x, y } = view.pivot;
        const engine = CombatSession.getEngine();
        const drop = engine?.trySpawnLootFromEnemy(detail.enemyId, { x, y });

        if (drop) {
          this.spawnLootView(drop);
        }

        this.removeEnemyView(combatantId);
        notifyFeedbackComplete();
      }, effectOptions);
    });

    this._unsubScreenFeedback = on(GameEvents.COMBAT_SCREEN_FEEDBACK_REQUEST, (detail) => {
      const feedback = this.screenFeedback;
      if (!feedback) {
        return;
      }

      if (detail?.type === "player_hit") {
        const damage = typeof detail.damage === "number" ? detail.damage : 0;
        if (damage > 0) {
          spawnPlayerFloatingText(this, { preset: "damage", value: damage });
        }

        const effects = Array.isArray(detail.effects) ? detail.effects : ["cameraShake"];
        const effectOptions =
          detail.effectOptions && typeof detail.effectOptions === "object"
            ? detail.effectOptions
            : {};
        runGlobalScreenFeedback(feedback, effects, effectOptions);
      }
    });

    this._unsubCombatEnded = on(GameEvents.COMBAT_ENDED, (detail) => {
      if (!detail?.victory) {
        return;
      }

      // Модель создаётся в CombatEngine.#endCombat; здесь — запасной путь для view.
      this.time.delayedCall(0, () => {
        this.syncChestViewsFromEngine();
      });
    });

    this._unsubCombatState = on(GameEvents.COMBAT_STATE, (detail) => {
      const hpPercent = detail?.player?.hpPercent;
      if (typeof hpPercent === "number") {
        this.screenFeedback?.updateLowHpVignette(hpPercent);
      }

      if (detail?.phase === "ended" && detail?.victory) {
        this.syncChestViewsFromEngine();
      }

      const selectedTargetId = detail?.selectedTargetId ?? null;
      const enemySnapshots = detail?.enemies ?? [];

      for (const snapshot of enemySnapshots) {
        const view = this.getEnemyView(snapshot.id);
        if (!view) {
          continue;
        }

        view.setTargetHighlight(snapshot.id === selectedTargetId);

        if (snapshot.hp <= 0) {
          view.hideHpBar();
          continue;
        }

        if (!view.isHpAnimating()) {
          view.syncHpPercent(snapshot.hpPercent);
        }
      }
    });
  }

  /**
   * @param {string} [combatantId]
   * @param {number} [holdMs]
   * @param {() => void} [onComplete]
   */
  playEnemyAttack(combatantId, holdMs = ENEMY_ATTACK_HOLD_MS, onComplete) {
    const view = combatantId ? this.getEnemyView(combatantId) : undefined;
    if (!view) {
      onComplete?.();
      return;
    }

    const { sprite, visual } = view;
    view.pauseBreathing();

    sprite.setFrame(visual.attack);
    this.time.delayedCall(holdMs, () => {
      if (sprite.active) {
        sprite.setFrame(visual.idle);
        view.resumeBreathing();
      }
      onComplete?.();
    });
  }

  shutdown() {
    this._unsubCombatEvents?.();
    this._unsubCombatEvents = null;
    this._unsubAnim = null;
    this._unsubFeedback = null;
    this._unsubScreenFeedback = null;
    this._unsubCombatState = null;
    this.screenFeedback?.destroy();
    this.screenFeedback = null;
    this.clearLootViews();
    this.clearChestViews();
    this.releaseEnemyViews();
    CombatSession.setScene(null);
    super.shutdown?.();
  }
}
