/** @type {(() => void) | null} */
let feedbackCompleteHandler = null;

/**
 * @param {() => void} handler
 */
export function setFeedbackCompleteHandler(handler) {
  feedbackCompleteHandler = handler;
}

export function notifyFeedbackComplete() {
  const handler = feedbackCompleteHandler;
  feedbackCompleteHandler = null;
  handler?.();
}

export function clearFeedbackBridge() {
  feedbackCompleteHandler = null;
}
