const BAR_HEIGHT = 8;
const BAR_GAP_ABOVE_SPRITE = 14;
/** Пауза после скачка красного fill, перед движением белого trail. */
const HP_TRAIL_HOLD_MS = 500;
/** Длительность «уползания» белого trail до красного fill. */
const HP_TRAIL_DURATION_MS = 500;

const COLORS = Object.freeze({
  bg: 0x1a1210,
  bgAlpha: 0.85,
  fill: 0xc44a3a,
  fillSelected: 0xe86a52,
  trail: 0xe8e4dc,
  border: 0x4a3830,
  borderSelected: 0xf0c878,
});

/**
 * HP-бар над врагом: красный fill = текущее HP, белый trail догоняет после удара.
 * @param {Phaser.Scene} scene
 * @param {number} barWidth
 * @param {number} anchorY — верх спрайта относительно container (отрицательный Y)
 */
export function createEnemyWorldHpBar(scene, barWidth, anchorY) {
  const y = anchorY - BAR_GAP_ABOVE_SPRITE - BAR_HEIGHT / 2;
  const hpContainer = scene.add.container(0, y);
  hpContainer.setDepth(1);

  const innerHeight = BAR_HEIGHT - 2;
  const innerMaxW = barWidth - 2;

  const bg = scene.add.rectangle(0, 0, barWidth, BAR_HEIGHT, COLORS.bg, COLORS.bgAlpha);
  bg.setStrokeStyle(2, COLORS.border, 1);

  const trailFill = scene.add.rectangle(
    -barWidth / 2,
    0,
    innerMaxW,
    innerHeight,
    COLORS.trail,
    1,
  );
  trailFill.setOrigin(0, 0.5);

  const fill = scene.add.rectangle(
    -barWidth / 2,
    0,
    innerMaxW,
    innerHeight,
    COLORS.fill,
    1,
  );
  fill.setOrigin(0, 0.5);

  hpContainer.add([bg, trailFill, fill]);

  let selected = false;
  let fillPercent = 100;
  let trailPercent = 100;
  let visible = true;
  /** @type {Phaser.Tweens.Tween | null} */
  let trailTween = null;
  /** @type {{ t: number } | null} */
  let trailTweenState = null;
  /** @type {Phaser.Time.TimerEvent | null} */
  let trailDelayEvent = null;
  let animating = false;

  function widthForPercent(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    return Math.max(0, innerMaxW * (clamped / 100));
  }

  function applyFill() {
    fill.width = widthForPercent(fillPercent);
    fill.fillColor = selected ? COLORS.fillSelected : COLORS.fill;
    bg.setStrokeStyle(2, selected ? COLORS.borderSelected : COLORS.border, 1);
  }

  function applyTrail() {
    trailFill.width = widthForPercent(trailPercent);
    trailFill.visible = trailPercent > fillPercent + 0.5 && visible;
  }

  function applyAll() {
    applyFill();
    applyTrail();
  }

  function stopTrailTween() {
    animating = false;
    trailDelayEvent?.remove();
    trailDelayEvent = null;
    trailTween?.stop();
    trailTween = null;
    if (trailTweenState) {
      scene.tweens.killTweensOf(trailTweenState);
      trailTweenState = null;
    }
  }

  return {
    container: hpContainer,

    isAnimating() {
      return animating;
    },

    setPercent(nextPercent) {
      stopTrailTween();
      fillPercent = nextPercent;
      trailPercent = nextPercent;
      applyAll();
    },

    setSelected(isSelected) {
      selected = isSelected;
      applyFill();
    },

    setVisible(isVisible) {
      visible = isVisible;
      hpContainer.setVisible(isVisible);
      applyTrail();
    },

    /**
     * 1) красный fill сразу на newPercent;
     * 2) пауза HP_TRAIL_HOLD_MS;
     * 3) белый trail за HP_TRAIL_DURATION_MS сходит к newPercent.
     * @param {number} newPercent
     * @param {number} [fromPercent]
     * @returns {Promise<void>}
     */
    animateToPercent(newPercent, fromPercent) {
      stopTrailTween();

      const from = typeof fromPercent === "number" ? fromPercent : trailPercent;
      fillPercent = newPercent;
      trailPercent = from;
      applyFill();
      applyTrail();

      if (Math.abs(trailPercent - fillPercent) < 0.5) {
        trailPercent = fillPercent;
        applyTrail();
        return Promise.resolve();
      }

      animating = true;

      return new Promise((resolve) => {
        const finish = () => {
          animating = false;
          trailDelayEvent = null;
          trailTween = null;
          trailTweenState = null;
          trailPercent = fillPercent;
          applyTrail();
          resolve();
        };

        trailDelayEvent = scene.time.delayedCall(HP_TRAIL_HOLD_MS, () => {
          trailDelayEvent = null;
          if (!hpContainer.scene) {
            finish();
            return;
          }

          trailTweenState = { t: trailPercent };
          trailTween = scene.tweens.add({
            targets: trailTweenState,
            t: fillPercent,
            duration: HP_TRAIL_DURATION_MS,
            ease: "Sine.easeOut",
            onUpdate: () => {
              trailPercent = trailTweenState.t;
              applyTrail();
            },
            onComplete: finish,
          });
        });
      });
    },

    destroy() {
      stopTrailTween();
      if (hpContainer.scene) {
        hpContainer.destroy(true);
      }
    },
  };
}

export { BAR_GAP_ABOVE_SPRITE, HP_TRAIL_HOLD_MS, HP_TRAIL_DURATION_MS };
