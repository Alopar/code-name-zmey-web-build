/**
 * Смещения в конфиге visual.sprite / visual.shadow — px исходного кадра:
 * offsetX — вбок от центра, offsetY — вверх от низа (ног).
 */

/**
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} baseScale
 * @returns {{ x: number, y: number }}
 */
export function spriteFrameOffsetToView(offsetX, offsetY, baseScale) {
  return {
    x: offsetX * baseScale,
    y: -offsetY * baseScale,
  };
}

/**
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} baseScale
 * @returns {{ x: number, y: number }}
 */
export function shadowFrameOffsetToView(offsetX, offsetY, baseScale) {
  return {
    x: -offsetX * baseScale,
    y: -offsetY * baseScale,
  };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} baseScale
 * @returns {{ offsetX: number, offsetY: number }}
 */
export function spriteViewOffsetToFrame(x, y, baseScale) {
  if (baseScale <= 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  return {
    offsetX: Math.round(x / baseScale),
    offsetY: Math.round(-y / baseScale),
  };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} baseScale
 * @returns {{ offsetX: number, offsetY: number }}
 */
export function shadowViewOffsetToFrame(x, y, baseScale) {
  if (baseScale <= 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  return {
    offsetX: Math.round(-x / baseScale),
    offsetY: Math.round(-y / baseScale),
  };
}
