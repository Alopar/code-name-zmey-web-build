const DEFAULT_CHARS_PER_SECOND = 48;

/**
 * Посимвольный вывод текста с мигающим курсором.
 */
export class TypewriterText {
  /**
   * @param {HTMLElement} element
   * @param {{ charsPerSecond?: number, onDone?: () => void, onCharacter?: (index: number, char: string) => void }} [options]
   */
  constructor(element, options = {}) {
    this.element = element;
    this.charsPerSecond = options.charsPerSecond ?? DEFAULT_CHARS_PER_SECOND;
    this.onDone = options.onDone ?? null;
    this.onCharacter = options.onCharacter ?? null;
    this.fullText = "";
    this.visibleCount = 0;
    this.running = false;
    this.done = false;
    this.rafId = 0;
    this.lastTimestamp = 0;
    this.accumulator = 0;
  }

  /**
   * @param {string} text
   */
  start(text) {
    this.stop();
    this.fullText = text;
    this.visibleCount = 0;
    this.running = true;
    this.done = false;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.render();
    this.rafId = window.requestAnimationFrame((ts) => this.tick(ts));
  }

  /**
   * @param {number} timestamp
   */
  tick(timestamp) {
    if (!this.running) {
      return;
    }

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulator += delta;

    const msPerChar = 1000 / this.charsPerSecond;
    while (this.accumulator >= msPerChar && this.visibleCount < this.fullText.length) {
      const char = this.fullText[this.visibleCount];
      this.visibleCount += 1;
      this.accumulator -= msPerChar;
      this.onCharacter?.(this.visibleCount - 1, char);
    }

    this.render();

    if (this.visibleCount >= this.fullText.length) {
      this.finish();
      return;
    }

    this.rafId = window.requestAnimationFrame((ts) => this.tick(ts));
  }

  /** Мгновенно показать весь текст. */
  complete() {
    if (this.done) {
      return;
    }

    this.visibleCount = this.fullText.length;
    this.finish();
  }

  isTyping() {
    return this.running && !this.done;
  }

  isComplete() {
    return this.done;
  }

  finish() {
    this.running = false;
    this.done = true;
    this.stopRaf();
    this.render(false);
    this.onDone?.();
  }

  stop() {
    this.running = false;
    this.done = false;
    this.stopRaf();
    this.fullText = "";
    this.visibleCount = 0;
    this.element.textContent = "";
    this.element.classList.remove("is-typing");
  }

  stopRaf() {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  /**
   * @param {boolean} [showCursor]
   */
  render(showCursor = true) {
    const slice = this.fullText.slice(0, this.visibleCount);
    this.element.textContent = slice;

    if (showCursor && this.running && !this.done) {
      this.element.classList.add("is-typing");
    } else {
      this.element.classList.remove("is-typing");
    }
  }
}
