import { ResourceStock } from "./ResourceStock.js";

export class Party {
  /**
   * @param {{
   *   memberIds: readonly string[],
   *   resources: ResourceStock,
   * }} data
   */
  constructor({ memberIds, resources }) {
    this.memberIds = [...memberIds];
    this.resources = resources;
  }

  /**
   * @param {Readonly<{ memberIds: readonly string[], initialResources: Readonly<Record<string, number>> }>} config
   */
  static fromConfig(config) {
    return new Party({
      memberIds: config.memberIds,
      resources: ResourceStock.fromInitial(config.initialResources),
    });
  }

  /** @param {string} resourceId */
  getResourceCount(resourceId) {
    return this.resources.getCount(resourceId);
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  consumeResource(resourceId, amount) {
    return this.resources.consume(resourceId, amount);
  }

  /**
   * @param {string} resourceId
   * @param {number} amount
   */
  addResource(resourceId, amount) {
    this.resources.add(resourceId, amount);
  }

  /**
   * @param {string} resourceId
   * @param {number} count
   */
  setResourceCount(resourceId, count) {
    this.resources.setCount(resourceId, count);
  }

  /** @returns {{ memberIds: string[], resources: ReturnType<ResourceStock["toSnapshot"]> }} */
  toSnapshot() {
    return {
      memberIds: [...this.memberIds],
      resources: this.resources.toSnapshot(),
    };
  }
}
