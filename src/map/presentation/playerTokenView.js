const TOKEN_RADIUS = 14;

/** @type {Readonly<Record<string, number>>} */
const COLORS = Object.freeze({
  fill: 0x3d5228,
  border: 0xe8d78a,
  inner: 0xc4b574,
});

/**
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 */
export function createPlayerTokenView(scene, x, y) {
  const container = scene.add.container(x, y);
  container.setDepth(3);

  const glow = scene.add.graphics();
  const body = scene.add.graphics();

  function redraw() {
    glow.clear();
    glow.fillStyle(COLORS.border, 0.22);
    glow.fillCircle(0, 0, TOKEN_RADIUS + 6);

    body.clear();
    body.fillStyle(COLORS.fill, 1);
    body.lineStyle(2, COLORS.border, 1);
    body.beginPath();
    body.moveTo(0, -TOKEN_RADIUS);
    body.lineTo(TOKEN_RADIUS, 0);
    body.lineTo(0, TOKEN_RADIUS);
    body.lineTo(-TOKEN_RADIUS, 0);
    body.closePath();
    body.fillPath();
    body.strokePath();

    body.fillStyle(COLORS.inner, 1);
    body.fillCircle(0, 0, 4);
  }

  redraw();
  container.add([glow, body]);

  /** @type {Phaser.Tweens.Tween | null} */
  let activeTween = null;

  /**
   * @param {number} targetX
   * @param {number} targetY
   * @returns {Promise<void>}
   */
  function moveTo(targetX, targetY) {
    if (activeTween) {
      activeTween.stop();
      activeTween = null;
    }

    return new Promise((resolve) => {
      activeTween = scene.tweens.add({
        targets: container,
        x: targetX,
        y: targetY,
        duration: 800,
        ease: "Power2",
        onComplete: () => {
          activeTween = null;
          resolve();
        },
      });
    });
  }

  function setPosition(x, y) {
    if (activeTween) {
      activeTween.stop();
      activeTween = null;
    }
    container.setPosition(x, y);
  }

  function isMoving() {
    return activeTween !== null;
  }

  return {
    container,
    moveTo,
    setPosition,
    isMoving,
    destroy: () => {
      if (activeTween) {
        activeTween.stop();
      }
      container.destroy();
    },
  };
}
