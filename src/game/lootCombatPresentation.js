import Phaser from "phaser";
import { AudioKey } from "../audio/AudioKeys.js";
import { getAudioManager } from "../audio/AudioManager.js";
import { getLootVisualConfig } from "../loot/config/lootVisuals.js";
import { createCombatWorldRig } from "./combatWorldPivot.js";
import { createSoftShadowImage } from "./softShadow.js";
import { attachCombatShadow, resolveShadowLayer } from "./attachCombatShadow.js";
import { shadowFrameOffsetToView, spriteFrameOffsetToView } from "./visualFrameOffset.js";

const DEFAULT_SHADOW = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  widthScale: 0.9,
  heightScale: 0.22,
  alpha: 0.55,
});

const DEFAULT_SPRITE = Object.freeze({
  offsetX: 0,
  offsetY: 0,
});

const SPAWN_ANIM_MS = 380;
const SPAWN_JUMP_PX = 16;
const IDLE_BLINK_MS = 420;
const IDLE_BLINK_DELAY_MS = 1050;
/** Пиковая сила белой подсветки (0–1) в режиме TintModes.ADD. */
const IDLE_BLINK_PEAK = 0.28;
const PICKUP_ANIM_MS = 280;
const PICKUP_FLY_PX = 56;
/** Отступ подписи пачки от «земли» (низ спрайта). */
const STACK_LABEL_OFFSET_Y = 6;

/**
 * @param {object} visual
 */
function resolveSpriteOptions(visual) {
  const sprite = visual.sprite ?? {};
  return {
    offsetX: sprite.offsetX ?? DEFAULT_SPRITE.offsetX,
    offsetY: sprite.offsetY ?? DEFAULT_SPRITE.offsetY,
  };
}

/**
 * @param {object} visual
 */
function resolveShadowOptions(visual) {
  const shadow = visual.shadow ?? {};
  return {
    offsetX: shadow.offsetX ?? DEFAULT_SHADOW.offsetX,
    offsetY: shadow.offsetY ?? DEFAULT_SHADOW.offsetY,
    widthScale: shadow.widthScale ?? DEFAULT_SHADOW.widthScale,
    heightScale: shadow.heightScale ?? DEFAULT_SHADOW.heightScale,
    alpha: shadow.alpha ?? DEFAULT_SHADOW.alpha,
    layer: resolveShadowLayer(shadow),
  };
}

/**
 * @param {string} audioKey
 */
function playLootSfx(audioKey) {
  getAudioManager()?.playSfx(audioKey);
}

/**
 * Pivot на земле + view (спрайт, подпись) + тень на pivot.
 * @param {Phaser.Scene} scene
 * @param {import("../combat/entities/CombatLootDrop.js").CombatLootDrop} drop
 */
export function spawnCombatLootPresentation(scene, drop) {
  const visual = getLootVisualConfig(drop.resourceId);
  const spriteOpts = resolveSpriteOptions(visual);
  const shadowOpts = resolveShadowOptions(visual);
  const { assetKey, displayHeight } = visual;

  if (!scene.textures.exists(assetKey)) {
    return null;
  }

  const { pivot, view } = createCombatWorldRig(scene, drop.x, drop.y);
  view.y = -SPAWN_JUMP_PX;

  const sprite = scene.add.sprite(0, 0, assetKey, 0);
  sprite.setOrigin(0.5, 1);

  const baseScale = displayHeight / sprite.height;
  sprite.setScale(0);

  const spriteViewPos = spriteFrameOffsetToView(
    spriteOpts.offsetX,
    spriteOpts.offsetY,
    baseScale,
  );
  sprite.setPosition(spriteViewPos.x, spriteViewPos.y);

  const shadowW = sprite.width * baseScale * shadowOpts.widthScale;
  const shadowH = shadowW * shadowOpts.heightScale;
  const shadow = createSoftShadowImage(scene, shadowW, shadowH, shadowOpts.alpha);
  const shadowViewPos = shadowFrameOffsetToView(
    shadowOpts.offsetX,
    shadowOpts.offsetY,
    baseScale,
  );
  shadow.setPosition(shadowViewPos.x, shadowViewPos.y);
  shadow.setScale(0);

  /** @type {Phaser.GameObjects.Text | null} */
  let stackLabel = null;

  if (drop.amount > 1) {
    const fontSize = Math.max(14, Math.round(displayHeight * 0.24));
    const strokeThickness = Math.max(2, Math.round(fontSize * 0.16));

    stackLabel = scene.add.text(0, STACK_LABEL_OFFSET_Y, `×${drop.amount}`, {
      fontFamily: '"PT Sans Narrow", sans-serif',
      fontSize: `${fontSize}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#120e08",
      strokeThickness,
    });
    stackLabel.setOrigin(0.5, 0);
    stackLabel.setScale(0);
    view.add(stackLabel);
  }

  attachCombatShadow(pivot, view, shadow, shadowOpts.layer);
  view.add(sprite);
  sprite.setInteractive({ useHandCursor: true });

  let destroyed = false;
  /** @type {Phaser.Tweens.Tween | null} */
  let idleBlinkTween = null;

  const killPresentationTweens = () => {
    scene.tweens.killTweensOf(view);
    scene.tweens.killTweensOf(sprite);
    scene.tweens.killTweensOf(shadow);
    if (stackLabel) {
      scene.tweens.killTweensOf(stackLabel);
    }
    idleBlinkTween?.stop();
    idleBlinkTween = null;
    sprite.clearTint();
  };

  /**
   * @param {number} intensity 0–1
   */
  const applySoftWhiteTint = (intensity) => {
    if (intensity <= 0.001) {
      sprite.clearTint();
      return;
    }

    const channel = Math.round(255 * intensity);
    sprite
      .setTint(Phaser.Display.Color.GetColor(channel, channel, channel))
      .setTintMode(Phaser.TintModes.ADD);
  };

  const startIdleBlink = () => {
    if (destroyed || !sprite.active) {
      return;
    }

    sprite.clearTint();
    idleBlinkTween = scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: IDLE_BLINK_MS,
      yoyo: true,
      repeat: -1,
      repeatDelay: IDLE_BLINK_DELAY_MS,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        applySoftWhiteTint(tween.getValue() * IDLE_BLINK_PEAK);
      },
    });
  };

  const playSpawnAnimation = () => {
    playLootSfx(AudioKey.LOOT_SPAWN);

    scene.tweens.add({
      targets: view,
      y: 0,
      duration: SPAWN_ANIM_MS,
      ease: "Back.easeOut",
    });

    scene.tweens.add({
      targets: sprite,
      scaleX: baseScale,
      scaleY: baseScale,
      duration: SPAWN_ANIM_MS,
      ease: "Back.easeOut",
      onComplete: () => {
        startIdleBlink();
      },
    });

    scene.tweens.add({
      targets: shadow,
      scaleX: 1,
      scaleY: 1,
      duration: SPAWN_ANIM_MS,
      ease: "Back.easeOut",
    });

    if (stackLabel) {
      scene.tweens.add({
        targets: stackLabel,
        scaleX: 1,
        scaleY: 1,
        duration: SPAWN_ANIM_MS,
        ease: "Back.easeOut",
      });
    }
  };

  playSpawnAnimation();

  return {
    dropId: drop.id,
    resourceId: drop.resourceId,
    pivot,
    view,
    /** @deprecated alias pivot */
    container: pivot,
    sprite,
    shadow,
    /**
     * @param {() => void} [onComplete]
     */
    playPickupAnimation(onComplete) {
      if (destroyed) {
        onComplete?.();
        return;
      }

      killPresentationTweens();
      playLootSfx(AudioKey.LOOT_PICKUP);

      scene.tweens.add({
        targets: view,
        y: view.y - PICKUP_FLY_PX,
        alpha: 0,
        duration: PICKUP_ANIM_MS,
        ease: "Cubic.easeIn",
        onComplete: () => {
          onComplete?.();
        },
      });
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;

      killPresentationTweens();

      if (sprite.scene) {
        sprite.removeAllListeners();
        if (sprite.input) {
          sprite.removeInteractive();
        }
      }

      if (pivot.scene) {
        pivot.destroy(true);
      }
    },
  };
}
