import { GameEvents, on } from "../../core/EventBus.js";
import { AudioKey } from "../AudioKeys.js";
import { getAudioManager } from "../AudioManager.js";

/**
 * @returns {() => void}
 */
export function initCombatAudio() {
  const unsubAnim = on(GameEvents.COMBAT_ANIM_REQUEST, (detail) => {
    if (detail?.type !== "enemy_attack") {
      return;
    }

    getAudioManager()?.playSfx(AudioKey.COMBAT_ENEMY_HIT);
  });

  const unsubFeedback = on(GameEvents.COMBAT_FEEDBACK_REQUEST, (detail) => {
    const manager = getAudioManager();
    if (!manager) {
      return;
    }

    if (detail?.type === "enemy_hit") {
      manager.playSfx(AudioKey.COMBAT_PLAYER_HIT);
      return;
    }

    if (detail?.type === "enemy_death") {
      manager.playSfx(AudioKey.COMBAT_ENEMY_DEATH);
    }
  });

  return () => {
    unsubAnim();
    unsubFeedback();
  };
}
