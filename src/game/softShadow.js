/**
 * Мягкая тень через canvas blur.
 * @param {Phaser.Scene} scene
 * @param {number} width
 * @param {number} height
 * @param {number} alpha — плотность 0…1
 * @returns {Phaser.GameObjects.Image}
 */
export function createSoftShadowImage(scene, width, height, alpha) {
  const blurPx = Math.max(5, Math.round(width * 0.045));
  const pad = blurPx * 2;
  const canvasW = Math.ceil(width + pad * 2);
  const canvasH = Math.ceil(height + pad * 2);
  const alphaRounded = Math.round(alpha * 100);

  const cacheKey = `shadow_soft_${Math.round(width)}_${Math.round(height)}_${blurPx}_${alphaRounded}`;

  if (!scene.textures.exists(cacheKey)) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.filter = `blur(${blurPx}px)`;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(canvasW / 2, canvasH / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = "none";
    }

    scene.textures.addCanvas(cacheKey, canvas);
  }

  const shadow = scene.add.image(0, 0, cacheKey);
  shadow.setOrigin(0.5, 0.5);
  return shadow;
}
