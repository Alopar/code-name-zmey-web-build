import { getResourceConfig } from "../config/resources.js";

export class ResourceStock {
  /** @param {Map<string, number>} counts */
  constructor(counts) {
    this.#counts = counts;
  }

  /** @type {Map<string, number>} */
  #counts;

  /**
   * @param {Readonly<Record<string, number>>} initialResources
   */
  static fromInitial(initialResources) {
    const counts = new Map();
    for (const [resourceId, amount] of Object.entries(initialResources)) {
      getResourceConfig(resourceId);
      counts.set(resourceId, Math.max(0, amount));
    }
    return new ResourceStock(counts);
  }

  /** @param {string} resourceId */
  getCount(resourceId) {
    getResourceConfig(resourceId);
    return this.#counts.get(resourceId) ?? 0;
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  consume(resourceId, amount) {
    if (amount <= 0) {
      throw new Error(`[Party] Нельзя потратить неположительное количество ресурса «${resourceId}»`);
    }

    getResourceConfig(resourceId);
    const current = this.getCount(resourceId);
    if (current < amount) {
      return false;
    }

    this.#counts.set(resourceId, current - amount);
    return true;
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  add(resourceId, amount) {
    if (amount <= 0) {
      throw new Error(`[Party] Нельзя добавить неположительное количество ресурса «${resourceId}»`);
    }

    getResourceConfig(resourceId);
    this.#counts.set(resourceId, this.getCount(resourceId) + amount);
  }

  /**
   * @param {string} resourceId
   * @param {number} count
   */
  setCount(resourceId, count) {
    getResourceConfig(resourceId);
    this.#counts.set(resourceId, Math.max(0, count));
  }

  /** @returns {Array<{ id: string, name: string, type: string, count: number }>} */
  toSnapshot() {
    const resources = [];
    for (const [resourceId, count] of this.#counts.entries()) {
      const config = getResourceConfig(resourceId);
      resources.push({
        id: config.id,
        name: config.name,
        type: config.type,
        count,
      });
    }
    return resources;
  }
}
