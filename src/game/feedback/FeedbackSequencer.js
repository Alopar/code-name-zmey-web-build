/**
 * Небольшой секвенсор для визуального фидбека (эффекты комбинируются).
 */
export class FeedbackSequencer {
  /**
   * Параллельный запуск; завершение — когда все эффекты вызвали done.
   * @param {Array<(done: () => void) => void>} runners
   * @returns {Promise<void>}
   */
  static runParallel(runners) {
    if (runners.length === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let remaining = runners.length;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) {
          resolve();
        }
      };

      for (const run of runners) {
        run(done);
      }
    });
  }

  /**
   * @param {Array<(done: () => void) => void>} runners
   * @returns {Promise<void>}
   */
  static runSequential(runners) {
    return runners.reduce(
      (chain, run) => chain.then(() => new Promise((resolve) => run(resolve))),
      Promise.resolve(),
    );
  }
}
