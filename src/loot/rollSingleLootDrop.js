import { getResourceConfig } from "../party/config/resources.js";

/**
 * Бросает не более одного предмета из таблицы (первый успешный по порядку).
 * @param {{ drops: ReadonlyArray<{ resourceId: string, chance: number, amount: number }> } | null | undefined} lootTable
 * @returns {{ resourceId: string, amount: number } | null}
 */
export function rollSingleLootDrop(lootTable) {
  if (!lootTable?.drops?.length) {
    return null;
  }

  for (const drop of lootTable.drops) {
    getResourceConfig(drop.resourceId);

    if (Math.random() < drop.chance) {
      return { resourceId: drop.resourceId, amount: drop.amount };
    }
  }

  return null;
}
