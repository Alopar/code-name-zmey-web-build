import { AssetKey, EnemyBaboonFrame } from "../../game/Assets.js";

/** @type {Readonly<Record<string, object>>} */
export const ENEMY_CONFIGS = Object.freeze({
  baboon: Object.freeze({
    id: "baboon",
    name: "Бабуин",
    hp: 8,
    maxHp: 8,
    weaponId: "claws",
    loot: Object.freeze({
      drops: Object.freeze([
        Object.freeze({ resourceId: "medkit", chance: 0.25, amount: 1 }),
        Object.freeze({ resourceId: "stimulator", chance: 0.75, amount: 5 }),
      ]),
    }),
    visual: Object.freeze({
      assetKey: AssetKey.ENEMY_BABOON,
      idle: EnemyBaboonFrame.IDLE,
      attack: EnemyBaboonFrame.ATTACK,
      /** offsetY — центр тени (px кадра вверх от низа); widthScale/heightScale — размер; alpha — плотность */
      shadow: Object.freeze({
        offsetY: 160,
        widthScale: 0.9,
        heightScale: 0.3,
        alpha: 0.65,
      }),
      /**
       * Кровь при ударе: spawnOffset — центр burst (px кадра от низа, offsetX вбок);
       * jitterRadius — радиус разброса (px кадра).
       */
      bloodSplash: Object.freeze({
        spawnOffsetX: 0,
        spawnOffsetY: 600,
        jitterRadius: 36,
      }),
      /**
       * Точка всплытия всех текстовых фидбеков (px кадра от низа, offsetX вбок).
       * Одна на врага — форма и пропорции спрайта могут отличаться.
       */
      textFeedback: Object.freeze({
        spawnOffsetX: 0,
        spawnOffsetY: 520,
      }),
      feedback: Object.freeze({
        onHit: Object.freeze(["redBlink", "shake", "bloodSplash", "floatingText"]),
        onDeath: Object.freeze([
          "bloodBurnDissolve",
          "shadowShrink",
          "bloodBurstLoop",
        ]),
        effectOptions: Object.freeze({
          bloodSplash: Object.freeze({
            count: 12,
          }),
          floatingText: Object.freeze({
            preset: "damage",
          }),
          bloodBurnDissolve: Object.freeze({
            durationMs: 1500,
          }),
          shadowShrink: Object.freeze({
            durationMs: 1500,
          }),
          bloodBurstLoop: Object.freeze({
            durationMs: 1250,
            intervalMs: 250,
            bloodSplash: Object.freeze({
              count: 18,
            }),
          }),
        }),
      }),
    }),
  }),
});

/**
 * @param {string} enemyId
 */
export function getEnemyConfig(enemyId) {
  const config = ENEMY_CONFIGS[enemyId];
  if (!config) {
    throw new Error(`[Combat] Неизвестный враг: ${enemyId}`);
  }
  return config;
}

/**
 * Опции bloodSplash: позиция из visual + параметры частиц из feedback.effectOptions.
 * @param {object} enemyConfig
 */
export function getBloodSplashEffectOptions(enemyConfig) {
  const visual = enemyConfig.visual ?? {};
  const particleOpts = visual.feedback?.effectOptions?.bloodSplash ?? {};

  return {
    ...(visual.bloodSplash ?? {}),
    ...particleOpts,
  };
}

/**
 * Якорь текстового фидбека: visual.textFeedback + опциональный override в feedback.textFeedback.
 * @param {object} enemyConfig
 */
export function getTextFeedbackAnchor(enemyConfig) {
  const visual = enemyConfig.visual ?? {};
  const feedbackAnchor = visual.feedback?.textFeedback ?? {};

  return {
    ...(visual.textFeedback ?? {}),
    ...feedbackAnchor,
  };
}

/**
 * Опции floatingText: якорь + параметры из feedback.effectOptions (без дублирования позиции).
 * @param {object} enemyConfig
 * @param {number} [damage]
 */
export function getFloatingTextEffectOptions(enemyConfig, damage) {
  const visual = enemyConfig.visual ?? {};
  const textOpts = visual.feedback?.effectOptions?.floatingText ?? {};

  return {
    anchor: getTextFeedbackAnchor(enemyConfig),
    ...textOpts,
    ...(damage != null ? { damage } : {}),
  };
}

/**
 * @param {object} enemyConfig
 * @returns {{ drops: ReadonlyArray<{ resourceId: string, chance: number, amount: number }> } | null}
 */
export function getEnemyLootTable(enemyConfig) {
  return enemyConfig.loot ?? null;
}

/**
 * @param {object} enemyConfig
 * @returns {readonly string[]}
 */
export function getOnDeathEffects(enemyConfig) {
  const visual = enemyConfig.visual ?? {};
  return visual.feedback?.onDeath ?? ["bloodBurnDissolve", "shadowShrink", "bloodBurstLoop"];
}

/**
 * Опции эффектов смерти: общие duration + bloodSplash с позицией врага.
 * @param {object} enemyConfig
 */
export function getOnDeathEffectOptions(enemyConfig) {
  const visual = enemyConfig.visual ?? {};
  const effectOptions = visual.feedback?.effectOptions ?? {};
  const bloodSplashBase = getBloodSplashEffectOptions(enemyConfig);
  const burstSplash = effectOptions.bloodBurstLoop?.bloodSplash ?? {};

  return {
    ...effectOptions,
    bloodBurstLoop: {
      ...effectOptions.bloodBurstLoop,
      bloodSplash: {
        ...bloodSplashBase,
        ...burstSplash,
      },
    },
  };
}
