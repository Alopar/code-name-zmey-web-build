/**
 * Последовательное выполнение шагов боя (sync и async).
 */
export class CombatSequencer {
  constructor() {
    /** @type {Array<{ run: Function, async?: boolean }>} */
    this.queue = [];
    this.running = false;
  }

  /**
   * @param {Array<{ run: (ctx: unknown, done?: (result?: { stop?: boolean }) => void) => { stop?: boolean } | void, async?: boolean }>} steps
   */
  enqueue(steps) {
    this.queue.push(...steps);
  }

  /**
   * @param {unknown} ctx
   * @returns {Promise<void>}
   */
  async run(ctx) {
    if (this.running) {
      return;
    }

    this.running = true;

    while (this.queue.length > 0) {
      const step = this.queue.shift();
      if (!step) {
        break;
      }

      const stop = await this.#runStep(step, ctx);
      if (stop) {
        break;
      }
    }

    this.running = false;
  }

  /**
   * @param {{ run: Function, async?: boolean }} step
   * @param {unknown} ctx
   * @returns {Promise<boolean>}
   */
  #runStep(step, ctx) {
    if (step.async) {
      return new Promise((resolve) => {
        let settled = false;
        const done = (result) => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(Boolean(result?.stop));
        };

        const immediate = step.run(ctx, done);
        if (immediate?.stop) {
          done(immediate);
        }
      });
    }

    const result = step.run(ctx);
    return Promise.resolve(Boolean(result?.stop));
  }
}
