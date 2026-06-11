import { GameSpace } from "../core/GameSpace.js";
import { getCurrentSpace } from "../core/GameState.js";
import { navigateTo } from "../game/GameController.js";
import { getStoryById } from "./config/storyRegistry.js";
import * as NarrationSession from "./NarrationSession.js";

/**
 * @typedef {object} StartStoryOptions
 * @property {string} [exitSpace] — явный целевой game space после истории
 * @property {"return"} [exit] — вернуться в пространство, откуда вызвали
 */

/**
 * @param {import("./config/storyRegistry.js").StoryConfig} story
 * @param {StartStoryOptions} [options]
 * @param {string} returnSpace
 * @returns {string}
 */
export function resolveExitTarget(story, options, returnSpace) {
  if (options?.exitSpace) {
    return options.exitSpace;
  }

  if (options?.exit === "return") {
    return returnSpace;
  }

  if (story.exit?.type === "space") {
    return story.exit.target;
  }

  if (story.exit?.type === "return") {
    return returnSpace;
  }

  return GameSpace.LOBBY;
}

/**
 * @param {string} storyId
 * @param {StartStoryOptions} [options]
 */
export function startStory(storyId, options = {}) {
  const story = getStoryById(storyId);
  if (!story) {
    console.warn(`[Narration] История «${storyId}» не найдена`);
    return;
  }

  const returnSpace = getCurrentSpace();
  NarrationSession.begin(storyId, {
    returnSpace,
    exitSpace: options.exitSpace ?? null,
    exit: options.exit ?? null,
  });
  navigateTo(GameSpace.NARRATION);
}
