import { isDebugEnabled } from "./DebugSettings.js";

/**
 * @param {Phaser.Input.Pointer} pointer
 * @returns {boolean}
 */
export function isGamePointerButton(pointer) {
  if (isDebugEnabled()) {
    return pointer.button === 0;
  }

  return true;
}
