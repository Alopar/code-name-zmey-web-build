/**
 * @typedef {import("../entities/MapNode.js").MapNodeType} MapNodeType
 */

/**
 * @typedef {object} MapNodeMetaEntry
 * @property {MapNodeType} [type]
 * @property {number} [enemyCount]
 * @property {string} [label]
 */

/**
 * @typedef {Record<string, MapNodeMetaEntry>} MapNodeMetaConfig
 */

/**
 * @param {number} depth
 */
function defaultEnemyCount(depth) {
  if (depth <= 1) {
    return 1;
  }
  if (depth <= 3) {
    return 2;
  }
  return 3;
}

/**
 * @param {import("./parseMapMaskGrid.js").ParsedMapMask} mask
 * @param {MapNodeMetaConfig} meta
 * @param {Map<string, number>} depths
 * @param {string} nodeId
 */
export function resolveNodeMeta(mask, meta, depths, nodeId) {
  const cell = mask.nodesById.get(nodeId);
  if (!cell) {
    throw new Error(`[MapMeta] Нода ${nodeId} отсутствует на маске.`);
  }

  const coordKey = `${cell.row},${cell.col}`;
  const entry = meta[coordKey];

  if (entry && !mask.nodesById.has(nodeId)) {
    throw new Error(`[MapMeta] Мета для ${coordKey} ссылается на отсутствующую ноду.`);
  }

  if (entry && entry.type === "start" && cell.kind !== "start") {
    throw new Error(`[MapMeta] ${coordKey}: type=start, но на маске это не старт.`);
  }

  if (entry && entry.type === "final" && cell.kind !== "exit") {
    throw new Error(`[MapMeta] ${coordKey}: type=final, но на маске это не выход.`);
  }

  /** @type {MapNodeType} */
  let type = "combat";

  if (cell.kind === "start") {
    type = "start";
  } else if (cell.kind === "exit") {
    type = "final";
  } else if (entry?.type) {
    type = entry.type;
  }

  let enemyCount = 0;
  if (type === "combat" || type === "final") {
    enemyCount = entry?.enemyCount ?? defaultEnemyCount(depths.get(nodeId) ?? 1);
  }

  return {
    type,
    enemyCount,
    label: entry?.label,
  };
}

/**
 * @param {MapNodeMetaConfig} meta
 * @param {import("./parseMapMaskGrid.js").ParsedMapMask} mask
 */
export function validateMapMeta(meta, mask) {
  for (const [coordKey, entry] of Object.entries(meta)) {
    const [rowText, colText] = coordKey.split(",");
    const row = Number(rowText);
    const col = Number(colText);

    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new Error(`[MapMeta] Некорректный ключ координаты: ${coordKey}`);
    }

    const cell = mask.cells[row]?.[col];
    if (!cell || (cell.kind !== "location" && cell.kind !== "start" && cell.kind !== "exit")) {
      throw new Error(`[MapMeta] Координата ${coordKey} не содержит игровую ноду на маске.`);
    }

    if (entry.enemyCount != null && entry.enemyCount < 0) {
      throw new Error(`[MapMeta] ${coordKey}: enemyCount не может быть отрицательным.`);
    }
  }
}
