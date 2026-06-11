export const FEEDBACK_TEXTURE_KEYS = Object.freeze({
  BLOOD_DROP: "fx_blood_drop_v2",
});

const DROP_SIZE = 28;

/**
 * Процедурная капля крови для частиц (один раз на сцену).
 * @param {Phaser.Scene} scene
 */
export function registerFeedbackTextures(scene) {
  const key = FEEDBACK_TEXTURE_KEYS.BLOOD_DROP;
  if (scene.textures.exists(key)) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = DROP_SIZE;
  canvas.height = DROP_SIZE;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#c41e1e";
    ctx.beginPath();
    ctx.ellipse(DROP_SIZE / 2, DROP_SIZE / 2, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.ellipse(DROP_SIZE / 2 - 2, DROP_SIZE / 2 - 3, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas(key, canvas);
}
