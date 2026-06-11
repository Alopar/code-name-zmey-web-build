import { GameEvents, emit, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { TypewriterText } from "../narration/presentation/TypewriterText.js";
import {
  playNarrationTypewriterSound,
  resetNarrationTypewriterSound,
} from "../narration/presentation/narrationTypewriterAudio.js";

/** @typedef {import("../narration/config/storyRegistry.js").StoryConfig} StoryConfig */
/** @typedef {import("../narration/config/storyRegistry.js").StoryStep} StoryStep */

/** @type {HTMLElement | null} */
let titleEl = null;

/** @type {HTMLElement | null} */
let stepEl = null;

/** @type {HTMLElement | null} */
let bodyEl = null;

/** @type {HTMLButtonElement | null} */
let nextBtn = null;

/** @type {HTMLButtonElement | null} */
let skipBtn = null;

/** @type {TypewriterText | null} */
let typewriter = null;

/** @type {StoryConfig | null} */
let activeStory = null;

/** @type {number} */
let stepIndex = 0;

/**
 * @param {StoryStep} step
 * @returns {string | null}
 */
function getStepText(step) {
  if (step.kind === "text") {
    return step.text;
  }

  console.warn(`[NarrationUI] Неподдерживаемый тип шага: ${step.kind}`);
  return null;
}

function updateStepIndicator() {
  if (!stepEl || !activeStory) {
    return;
  }

  stepEl.textContent = `${stepIndex + 1} / ${activeStory.steps.length}`;
}

function showCurrentStep() {
  if (!activeStory || !bodyEl) {
    return;
  }

  const step = activeStory.steps[stepIndex];
  if (!step) {
    finishStory(false);
    return;
  }

  const text = getStepText(step);
  if (text === null) {
    advanceStep();
    return;
  }

  updateStepIndicator();
  resetNarrationTypewriterSound();
  typewriter?.start(text);
}

function advanceStep() {
  if (!activeStory) {
    return;
  }

  if (stepIndex >= activeStory.steps.length - 1) {
    finishStory(false);
    return;
  }

  stepIndex += 1;
  showCurrentStep();
}

function finishStory(skipped) {
  if (!activeStory) {
    return;
  }

  typewriter?.stop();
  emit(GameEvents.NARRATION_ENDED, {
    storyId: activeStory.id,
    skipped,
    lastStepIndex: stepIndex,
  });
}

function handleNextClick() {
  if (!activeStory || !typewriter) {
    return;
  }

  if (typewriter.isTyping()) {
    typewriter.complete();
    return;
  }

  advanceStep();
}

function handleSkipClick() {
  finishStory(true);
}

function resetUi() {
  typewriter?.stop();
  resetNarrationTypewriterSound();
  activeStory = null;
  stepIndex = 0;

  if (titleEl) {
    titleEl.textContent = "";
  }
  if (stepEl) {
    stepEl.textContent = "";
  }
  if (bodyEl) {
    bodyEl.textContent = "";
    bodyEl.classList.remove("is-typing");
  }
}

/**
 * @param {StoryConfig} story
 */
export function startStoryUi(story) {
  resetUi();
  activeStory = story;
  stepIndex = 0;

  if (titleEl) {
    titleEl.textContent = story.title ?? "История";
  }

  if (!bodyEl) {
    return;
  }

  typewriter = new TypewriterText(bodyEl, {
    onCharacter: playNarrationTypewriterSound,
  });
  showCurrentStep();
}

export function initNarrationUI() {
  titleEl = document.getElementById("narration-title");
  stepEl = document.getElementById("narration-step");
  bodyEl = document.getElementById("narration-body");
  nextBtn = document.getElementById("btn-narration-next");
  skipBtn = document.getElementById("btn-narration-skip");

  nextBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleNextClick();
  });

  skipBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleSkipClick();
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.prev === GameSpace.NARRATION && detail?.space !== GameSpace.NARRATION) {
      resetUi();
    }
  });
}

export function resetNarrationUI() {
  resetUi();
}
