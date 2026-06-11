import { ensureFloatingTextLayer } from "./FloatingTextLayer.js";
import { resolveFloatingLabelText } from "./formatLabel.js";
import { getFloatingTextPreset } from "./presets.js";

/** @typedef {object} FloatingTextStyle */
/** @typedef {FloatingTextStyle & {
 *   x: number,
 *   y: number,
 *   text?: string,
 *   preset?: string,
 *   value?: number | string,
 *   format?: string,
 *   fontStyle?: string,
 *   floatDistance?: number,
 *   durationMs?: number,
 *   ease?: string,
 *   scaleFrom?: number,
 *   scaleTo?: number,
 *   originX?: number,
 *   originY?: number,
 * }} FloatingTextOptions */

const DEFAULT_FLOAT_DISTANCE = 60;
const DEFAULT_DURATION_MS = 900;
const DEFAULT_EASE = "Sine.easeOut";
const DEFAULT_SCALE_FROM = 1;
const DEFAULT_SCALE_TO = 1.15;

/**
 * Универсальный spawn плавающей подписи (fire-and-forget).
 * @param {Phaser.Scene} scene
 * @param {FloatingTextOptions} options
 * @returns {Phaser.GameObjects.Text | null}
 */
export function spawnFloatingText(scene, options) {
  const preset = options.preset ? getFloatingTextPreset(options.preset) : null;
  const textContent = resolveFloatingLabelText(options, preset);

  if (!textContent) {
    return null;
  }

  const layer = ensureFloatingTextLayer(scene);
  const style = {
    fontFamily: options.fontFamily ?? preset?.fontFamily ?? '"PT Sans Narrow", sans-serif',
    fontSize: options.fontSize ?? preset?.fontSize ?? 36,
    color: options.color ?? preset?.color ?? "#ffffff",
    fontStyle: options.fontStyle ?? preset?.fontStyle ?? "",
    stroke: options.stroke ?? preset?.stroke ?? "#060804",
    strokeThickness: options.strokeThickness ?? preset?.strokeThickness ?? 4,
  };

  const label = scene.add.text(options.x, options.y, textContent, {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    color: style.color,
    fontStyle: style.fontStyle,
    stroke: style.stroke,
    strokeThickness: style.strokeThickness,
  });

  label.setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
  label.setAlpha(1);

  const scaleFrom = options.scaleFrom ?? DEFAULT_SCALE_FROM;
  const scaleTo = options.scaleTo ?? DEFAULT_SCALE_TO;
  label.setScale(scaleFrom);

  layer.add(label);

  const floatDistance = options.floatDistance ?? DEFAULT_FLOAT_DISTANCE;
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const ease = options.ease ?? DEFAULT_EASE;
  const halfDuration = Math.floor(durationMs / 2);

  scene.tweens.add({
    targets: label,
    y: options.y - floatDistance,
    alpha: 0,
    duration: durationMs,
    ease,
    onComplete: () => {
      if (label.active) {
        label.destroy();
      }
    },
  });

  if (scaleTo !== scaleFrom) {
    scene.tweens.add({
      targets: label,
      scale: scaleTo,
      duration: halfDuration,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  return label;
}
