import { GameEvents, on } from "../core/EventBus.js";

/**
 * @returns {() => void}
 */
export function initLootController() {
  const unsub = on(GameEvents.COMBAT_ENDED, () => {
    // Лут выдаётся только с поля боя (подбор по клику), не при завершении боя.
  });

  return () => {
    unsub();
  };
}
