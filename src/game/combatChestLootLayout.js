import { VIEWPORT_HEIGHT } from "../core/Viewport.js";

/** Вертикальный отступ ряда лута от точки опоры сундука, px. */
export const CHEST_LOOT_ROW_OFFSET = VIEWPORT_HEIGHT * 0.1;

/** Ширина слота под один предмет в ряду (центр спрайта — середина слота). */
export const CHEST_LOOT_SLOT_WIDTH = 200;

/**
 * Горизонтальный ряд позиций лута под сундуком.
 * Каждый предмет занимает слот CHEST_LOOT_SLOT_WIDTH; слоты впритык, ряд по центру сундука.
 * @param {number} chestX
 * @param {number} chestY
 * @param {Array<{ resourceId: string }>} items
 * @returns {{ x: number, y: number }[]}
 */
export function layoutLootBelowChest(chestX, chestY, items) {
  const count = items.length;
  if (count <= 0) {
    return [];
  }

  const rowY = chestY + CHEST_LOOT_ROW_OFFSET;
  const totalSpan = count * CHEST_LOOT_SLOT_WIDTH;
  const rowLeft = chestX - totalSpan / 2;

  return items.map((_, index) => ({
    x: rowLeft + CHEST_LOOT_SLOT_WIDTH * index + CHEST_LOOT_SLOT_WIDTH / 2,
    y: rowY,
  }));
}
