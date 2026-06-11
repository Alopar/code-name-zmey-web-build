/** @typedef {"start" | "combat" | "final" | "loot" | "rest" | "story"} MapNodeType */

/**
 * @typedef {object} MapGridCoord
 * @property {number} row
 * @property {number} col
 */

/**
 * @typedef {object} MapNodeData
 * @property {string} id
 * @property {MapNodeType} type
 * @property {number} enemyCount
 * @property {MapGridCoord} grid
 * @property {{ x: number, y: number }} position
 * @property {string[]} connections
 * @property {string} [label]
 */

export class MapNode {
  /**
   * @param {MapNodeData} data
   */
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.enemyCount = data.enemyCount;
    this.grid = Object.freeze({ ...data.grid });
    this.position = Object.freeze({ ...data.position });
    this.connections = Object.freeze([...data.connections]);
    this.label = data.label;
  }

  /**
   * @param {MapNodeData} data
   */
  static fromConfig(data) {
    return new MapNode(data);
  }
}
