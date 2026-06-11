import { createCombatWorldRig } from "./combatWorldPivot.js";
import { createEnemyWorldHpBar } from "./enemyWorldHpBar.js";
import { createSoftShadowImage } from "./softShadow.js";

/** «Вдох» по Y (половина прежней амплитуды). */
const BREATH_SCALE_Y = 1.014;
const BREATH_SCALE_X = 0.996;
const BREATH_DURATION_MS = 1650;

const DEFAULT_SHADOW = Object.freeze({
  offsetY: 0,
  widthScale: 0.62,
  heightScale: 0.2,
  alpha: 0.58,
});

/**
 * @param {import("../combat/entities/Enemy.js").Enemy["visual"]} visual
 */
function resolveShadowOptions(visual) {
  const shadow = visual.shadow ?? {};
  return {
    offsetY: shadow.offsetY ?? DEFAULT_SHADOW.offsetY,
    widthScale: shadow.widthScale ?? DEFAULT_SHADOW.widthScale,
    heightScale: shadow.heightScale ?? DEFAULT_SHADOW.heightScale,
    alpha: shadow.alpha ?? DEFAULT_SHADOW.alpha,
  };
}

/**
 * @param {number} index
 */
export function createBreathOptionsForIndex(index) {
  const jitter = (seed, spread) => ((seed * 7919) % 1000) / 1000 * spread * 2 - spread;
  return {
    breathDurationMs: BREATH_DURATION_MS + Math.round(jitter(index + 1, 120)),
    breathDelayMs: Math.round(jitter(index + 3, 200)),
    breathScaleY: BREATH_SCALE_Y + jitter(index + 5, 0.003),
    breathScaleX: BREATH_SCALE_X + jitter(index + 7, 0.002),
    flipX: Math.random() < 0.5,
  };
}

/**
 * Pivot на земле + view (спрайт, HP-бар) + тень на pivot.
 * @param {Phaser.Scene} scene
 * @param {import("../combat/entities/Enemy.js").Enemy} enemy
 * @param {number} x
 * @param {number} y — точка опоры на «земле» сцены (pivot.y)
 * @param {number} displayHeight
 * @param {{
 *   breathDurationMs?: number,
 *   breathDelayMs?: number,
 *   breathScaleY?: number,
 *   breathScaleX?: number,
 *   flipX?: boolean,
 * }} [presentationOpts]
 */
export function spawnCombatEnemyPresentation(
  scene,
  enemy,
  x,
  y,
  displayHeight,
  presentationOpts = {},
) {
  const { assetKey, idle } = enemy.visual;
  const shadowOpts = resolveShadowOptions(enemy.visual);

  if (!scene.textures.exists(assetKey)) {
    return null;
  }

  const breathDurationMs = presentationOpts.breathDurationMs ?? BREATH_DURATION_MS;
  const breathDelayMs = presentationOpts.breathDelayMs ?? 0;
  const breathScaleY = presentationOpts.breathScaleY ?? BREATH_SCALE_Y;
  const breathScaleX = presentationOpts.breathScaleX ?? BREATH_SCALE_X;
  const flipX = presentationOpts.flipX ?? false;

  const { pivot, view } = createCombatWorldRig(scene, x, y);

  const sprite = scene.add.sprite(0, 0, assetKey, idle);
  sprite.setOrigin(0.5, 1);

  const baseScale = displayHeight / sprite.height;
  sprite.setScale(baseScale);
  sprite.setFlipX(flipX);

  const shadowW = sprite.displayWidth * shadowOpts.widthScale;
  const shadowH = shadowW * shadowOpts.heightScale;
  const shadow = createSoftShadowImage(scene, shadowW, shadowH, shadowOpts.alpha);
  shadow.setPosition(0, -shadowOpts.offsetY * baseScale);

  const barWidth = sprite.displayWidth * 0.65;
  const hpBar = createEnemyWorldHpBar(scene, barWidth, -displayHeight);
  hpBar.setPercent(enemy.getHpPercent());

  pivot.add(shadow);
  view.add([sprite, hpBar.container]);

  const breathTween = scene.tweens.add({
    targets: sprite,
    scaleX: baseScale * breathScaleX,
    scaleY: baseScale * breathScaleY,
    duration: breathDurationMs,
    delay: breathDelayMs,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  sprite.setInteractive({ useHandCursor: true });

  let destroyed = false;

  return {
    combatantId: enemy.id,
    pivot,
    view,
    /** @deprecated alias pivot — для depth-сортировки и координат спавна лута */
    container: pivot,
    sprite,
    shadow,
    hpBar,
    visual: enemy.visual,
    breathTween,
    setHpPercent(percent) {
      hpBar.setPercent(percent);
    },
    syncHpPercent(percent) {
      hpBar.setPercent(percent);
    },
    isHpAnimating() {
      return hpBar.isAnimating();
    },
    /**
     * @param {number} percent
     * @param {number} [fromPercent]
     * @returns {Promise<void>}
     */
    animateHpToPercent(percent, fromPercent) {
      return hpBar.animateToPercent(percent, fromPercent);
    },
    hideHpBar() {
      hpBar.setVisible(false);
    },
    setTargetHighlight(selected) {
      hpBar.setSelected(selected);
    },
    pauseBreathing() {
      breathTween.pause();
      sprite.setScale(baseScale);
    },
    resumeBreathing() {
      sprite.setScale(baseScale);
      breathTween.resume();
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;

      breathTween.stop();

      if (sprite.scene) {
        scene.tweens.killTweensOf(sprite);
        scene.tweens.killTweensOf(view);
        sprite.removeAllListeners();
        if (sprite.input) {
          sprite.removeInteractive();
        }
      }

      hpBar.destroy();

      if (pivot.scene) {
        pivot.destroy(true);
      }
    },
  };
}
