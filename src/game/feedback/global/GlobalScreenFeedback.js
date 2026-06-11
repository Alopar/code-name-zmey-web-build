import Phaser from "phaser";

/** Максимальная сила красной виньетки при 0 HP (ниже 50% HP нарастает линейно). */
const LOW_HP_VIGNETTE_MAX = 0.19;
const LOW_HP_THRESHOLD_PERCENT = 50;

const DEFAULT_SHAKE = Object.freeze({
  duration: 70,
  intensity: 0.0035,
});

const DEFAULT_FLASH = Object.freeze({
  duration: 120,
  color: 0xffffff,
});

const DEFAULT_DARKEN = Object.freeze({
  duration: 280,
  holdMs: 0,
});

/**
 * radius должен покрывать углы экрана (~0.71 от центра), иначе шейдер Vignette
 * вне круга даёт mix=1 без градиента — жёсткие «треугольники» по углам.
 */
const DEFAULT_RED_VIGNETTE = Object.freeze({
  x: 0.5,
  y: 0.5,
  radius: 1,
  color: 0x621818,
  blendMode: Phaser.BlendModes.NORMAL,
});

/**
 * Глобальный screen feedback через main camera (Phaser filters / camera FX).
 */
export class GlobalScreenFeedback {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    /** @type {Phaser.Filters.Vignette | null} */
    this._redVignette = null;
    /** @type {Phaser.Tweens.Tween | null} */
    this._redVignetteTween = null;
  }

  /**
   * @param {{
   *   duration?: number,
   *   intensity?: number,
   * }} [options]
   */
  shake(options = {}) {
    const duration = options.duration ?? DEFAULT_SHAKE.duration;
    const intensity = options.intensity ?? DEFAULT_SHAKE.intensity;
    this.camera.shake(duration, intensity);
  }

  /**
   * @param {{
   *   duration?: number,
   *   color?: number,
   * }} [options]
   */
  flash(options = {}) {
    const duration = options.duration ?? DEFAULT_FLASH.duration;
    const color = options.color ?? DEFAULT_FLASH.color;
    const parsed = Phaser.Display.Color.IntegerToColor(color);
    this.camera.flash(duration, parsed.red, parsed.green, parsed.blue, true);
  }

  /**
   * @param {{
   *   duration?: number,
   *   holdMs?: number,
   * }} [options]
   */
  darken(options = {}) {
    const duration = options.duration ?? DEFAULT_DARKEN.duration;
    const holdMs = options.holdMs ?? DEFAULT_DARKEN.holdMs;

    this.camera.fadeOut(duration, 0, 0, 0);
    this.scene.time.delayedCall(duration + holdMs, () => {
      if (this.camera.scene) {
        this.camera.fadeIn(duration);
      }
    });
  }

  /**
   * @returns {Phaser.Filters.Vignette | null}
   */
  ensureRedVignette() {
    if (this._redVignette) {
      return this._redVignette;
    }

    const external = this.camera.filters?.external;
    if (!external?.addVignette) {
      return null;
    }

    const cfg = DEFAULT_RED_VIGNETTE;
    this._redVignette = external.addVignette(
      cfg.x,
      cfg.y,
      cfg.radius,
      0,
      cfg.color,
      cfg.blendMode,
    );
    this._redVignette.active = false;
    this._redVignette.strength = 0;
    this._redVignette.radius = cfg.radius;

    return this._redVignette;
  }

  /**
   * @param {number} intensity 0..1
   * @param {number} [durationMs]
   */
  setRedVignetteIntensity(intensity, durationMs = 400) {
    const vignette = this.ensureRedVignette();
    if (!vignette) {
      return;
    }

    const target = Phaser.Math.Clamp(intensity, 0, 1);
    this._redVignetteTween?.stop();
    this._redVignetteTween = null;

    if (durationMs <= 0) {
      vignette.strength = target;
      vignette.active = target > 0.001;
      return;
    }

    if (!vignette.active && target > 0.001) {
      vignette.strength = 0;
      vignette.active = true;
    }

    this._redVignetteTween = this.scene.tweens.add({
      targets: vignette,
      strength: target,
      duration: durationMs,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (target <= 0.001) {
          vignette.active = false;
          vignette.strength = 0;
        }
      },
    });
  }

  /**
   * Красная виньетка по HP: 0 выше 50%, нарастает к 0 HP.
   * @param {number} hpPercent
   * @param {number} [durationMs]
   */
  updateLowHpVignette(hpPercent, durationMs = 450) {
    let target = 0;

    if (hpPercent <= LOW_HP_THRESHOLD_PERCENT) {
      const t = (LOW_HP_THRESHOLD_PERCENT - hpPercent) / LOW_HP_THRESHOLD_PERCENT;
      target = t * LOW_HP_VIGNETTE_MAX;
    }

    this.setRedVignetteIntensity(target, durationMs);
  }

  reset() {
    this._redVignetteTween?.stop();
    this._redVignetteTween = null;

    if (this._redVignette) {
      this._redVignette.strength = 0;
      this._redVignette.active = false;
    }
  }

  destroy() {
    this.reset();

    const external = this.camera.filters?.external;
    if (this._redVignette && external?.remove) {
      external.remove(this._redVignette);
    }

    this._redVignette = null;
  }
}
