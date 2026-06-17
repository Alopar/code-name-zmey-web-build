/**
 * @returns {Promise<boolean>}
 */
export async function tryLockLandscapeOrientation() {
  const orientation = screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") {
    return false;
  }

  try {
    await orientation.lock("landscape");
    return true;
  } catch (error) {
    console.warn("[OrientationLock] Не удалось заблокировать landscape:", error);
    return false;
  }
}

/**
 * @returns {Promise<void>}
 */
export async function tryUnlockOrientation() {
  const orientation = screen.orientation;
  if (!orientation || typeof orientation.unlock !== "function") {
    return;
  }

  try {
    orientation.unlock();
  } catch (error) {
    console.warn("[OrientationLock] Не удалось разблокировать ориентацию:", error);
  }
}
