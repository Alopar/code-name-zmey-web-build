import { INTRO_01_STORY } from "./stories/intro-01.js";

/**
 * @typedef {"text"} StoryStepKind
 * Текущий тип шага. В будущем: "cutscene" (image + lines[]).
 */

/**
 * @typedef {object} StoryTextStep
 * @property {"text"} kind
 * @property {string} text
 */

/**
 * @typedef {object} StoryCutsceneStep
 * @property {"cutscene"} kind
 * @property {string} [image]
 * @property {string[]} [lines]
 */

/** @typedef {StoryTextStep | StoryCutsceneStep} StoryStep */

/**
 * @typedef {object} StoryExitSpace
 * @property {"space"} type
 * @property {string} target
 */

/**
 * @typedef {object} StoryExitReturn
 * @property {"return"} type
 */

/** @typedef {StoryExitSpace | StoryExitReturn} StoryExit */

/**
 * @typedef {object} StoryConfig
 * @property {string} id
 * @property {string} [title]
 * @property {readonly StoryStep[]} steps
 * @property {StoryExit} [exit]
 */

/** @type {Readonly<Record<string, StoryConfig>>} */
const STORY_REGISTRY = Object.freeze({
  [INTRO_01_STORY.id]: INTRO_01_STORY,
});

/**
 * @param {string} id
 * @returns {StoryConfig | null}
 */
export function getStoryById(id) {
  return STORY_REGISTRY[id] ?? null;
}

export { STORY_REGISTRY };
