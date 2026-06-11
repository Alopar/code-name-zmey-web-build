/** @type {(() => void) | null} */
let animCompleteHandler = null;

/**
 * @param {() => void} handler
 */
export function setAnimCompleteHandler(handler) {
  animCompleteHandler = handler;
}

export function notifyAnimComplete() {
  const handler = animCompleteHandler;
  animCompleteHandler = null;
  handler?.();
}

export function clearAnimBridge() {
  animCompleteHandler = null;
}
