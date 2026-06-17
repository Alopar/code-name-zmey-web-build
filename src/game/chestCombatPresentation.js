import { AudioKey } from "../audio/AudioKeys.js";
import { getAudioManager } from "../audio/AudioManager.js";
import { getLootContainerConfig } from "../loot/config/lootContainers.js";
import { createCombatWorldRig } from "./combatWorldPivot.js";
import { runEnemyFeedback } from "./feedback/runEnemyFeedback.js";
import { createSoftShadowImage } from "./softShadow.js";
import { attachCombatShadow, resolveShadowLayer } from "./attachCombatShadow.js";
import { shadowFrameOffsetToView, spriteFrameOffsetToView } from "./visualFrameOffset.js";

const DEFAULT_SHADOW = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  widthScale: 0.85,
  heightScale: 0.25,
  alpha: 0.55,
});

const DEFAULT_SPRITE = Object.freeze({
  offsetX: 0,
  offsetY: 0,
});

const SPAWN_ANIM_MS = 420;
const SPAWN_JUMP_PX = 24;
const OPEN_BOUNCE_MS = 280;

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
function playChestSfx(audioKey) {
  getAudioManager()?.playSfx(audioKey);
}

/**
 * Pivot на земле + view (спрайт) + тень на pivot.
 * @param {Phaser.Scene} scene
 * @param {import("../combat/entities/CombatChest.js").CombatChest} chest
 */
export function spawnCombatChestPresentation(scene, chest) {
  const config = getLootContainerConfig(chest.containerId);
  const { visual, interaction } = config;
  const spriteOpts = resolveSpriteOptions(visual);
  const shadowOpts = resolveShadowOptions(visual);
  const { assetKey, closed, open, displayHeight } = visual;

  if (!scene.textures.exists(assetKey)) {
    return null;
  }

  const { pivot, view } = createCombatWorldRig(scene, chest.x, chest.y);
  view.y = -SPAWN_JUMP_PX;

  const sprite = scene.add.sprite(0, 0, assetKey, closed);
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

  attachCombatShadow(pivot, view, shadow, shadowOpts.layer);
  view.add(sprite);
  sprite.setInteractive({ useHandCursor: true });

  let destroyed = false;
  let isBusy = false;
  let opened = false;

  const killPresentationTweens = () => {
    scene.tweens.killTweensOf(view);
    scene.tweens.killTweensOf(sprite);
    scene.tweens.killTweensOf(shadow);
    sprite.clearTint();
  };

  const playSpawnAnimation = () => {
    playChestSfx(AudioKey.LOOT_SPAWN);

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
    });

    scene.tweens.add({
      targets: shadow,
      scaleX: 1,
      scaleY: 1,
      duration: SPAWN_ANIM_MS,
      ease: "Back.easeOut",
    });
  };

  playSpawnAnimation();

  const tapEffects = Array.isArray(interaction.tapEffects)
    ? interaction.tapEffects
    : ["softWhiteBlink", "shake"];
  const tapEffectOptions =
    interaction.effectOptions && typeof interaction.effectOptions === "object"
      ? interaction.effectOptions
      : {};

  return {
    chestId: chest.id,
    containerId: chest.containerId,
    pivot,
    view,
    /** @deprecated alias pivot */
    container: pivot,
    sprite,
    shadow,
    visual,
    openFrame: open,
    get isBusy() {
      return isBusy;
    },
    get opened() {
      return opened;
    },
    /**
     * @param {() => void} [onComplete]
     */
    playTapFeedback(onComplete) {
      if (destroyed || opened || isBusy) {
        onComplete?.();
        return;
      }

      isBusy = true;
      playChestSfx(AudioKey.CHEST_TAP);
      runEnemyFeedback(
        scene,
        { sprite, pivot, view, shadow },
        tapEffects,
        () => {
          isBusy = false;
          onComplete?.();
        },
        tapEffectOptions,
      );
    },
    /**
     * @param {() => void} [onComplete]
     */
    playOpenAnimation(onComplete) {
      if (destroyed || opened) {
        onComplete?.();
        return;
      }

      opened = true;
      isBusy = true;

      if (sprite.input) {
        sprite.removeInteractive();
      }

      playChestSfx(AudioKey.CHEST_OPEN);
      sprite.setFrame(open);

      const bounceScale = baseScale * 1.06;
      scene.tweens.add({
        targets: sprite,
        scaleX: bounceScale,
        scaleY: bounceScale,
        duration: OPEN_BOUNCE_MS / 2,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => {
          isBusy = false;
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
