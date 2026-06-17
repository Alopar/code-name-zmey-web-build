let presentationEnabled = true;

/**
 * @returns {boolean}
 */
export function isLobbyPresentationEnabled() {
  return presentationEnabled;
}

/**
 * @param {boolean} enabled
 */
export function setLobbyPresentationEnabled(enabled) {
  presentationEnabled = enabled;
}
