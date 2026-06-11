import { emit, GameEvents } from "./EventBus.js";
import { GameSpace } from "./GameSpace.js";

let currentSpace = GameSpace.LOBBY;

export function getCurrentSpace() {
  return currentSpace;
}

/**
 * @param {string} space
 */
export function setSpace(space) {
  if (space === currentSpace) {
    return;
  }
  const prev = currentSpace;
  currentSpace = space;
  emit(GameEvents.SPACE_CHANGED, { space, prev });
}
