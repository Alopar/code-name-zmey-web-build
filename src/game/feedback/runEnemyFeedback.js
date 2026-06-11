import { FeedbackSequencer } from "./FeedbackSequencer.js";
import { createEffectRunner } from "./effects/index.js";

/**
 * @param {Phaser.Scene} scene
 * @param {{
 *   sprite: Phaser.GameObjects.Sprite,
 *   pivot: Phaser.GameObjects.Container,
 *   view: Phaser.GameObjects.Container,
 *   shadow?: Phaser.GameObjects.Image | null,
 * }} presentation
 * @param {string[]} effectNames
 * @param {() => void} [onComplete]
 * @param {Record<string, object>} [effectOptions]
 */
export function runEnemyFeedback(scene, presentation, effectNames, onComplete, effectOptions = {}) {
  const ctx = {
    scene,
    sprite: presentation.sprite,
    pivot: presentation.pivot,
    view: presentation.view,
    shadow: presentation.shadow ?? null,
  };

  const runners = effectNames
    .map((name) => createEffectRunner(name, ctx, effectOptions))
    .filter((runner) => runner != null);

  if (runners.length === 0) {
    onComplete?.();
    return;
  }

  void FeedbackSequencer.runParallel(runners).then(() => {
    onComplete?.();
  });
}
