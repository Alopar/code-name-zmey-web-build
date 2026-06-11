import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { getCurrentSpace } from "../core/GameState.js";
import { navigateTo } from "../game/GameController.js";
import { isSceneLoadOverlayVisible } from "../ui/SceneLoadOverlay.js";
import { resetNarrationUI, startStoryUi } from "../ui/NarrationUI.js";
import { getStoryById } from "./config/storyRegistry.js";
import * as NarrationSession from "./NarrationSession.js";
import { resolveExitTarget, startStory } from "./startStory.js";

/** @typedef {import("./config/storyRegistry.js").StoryConfig} StoryConfig */

/** @type {StoryConfig | null} */
let pendingStory = null;

/**
 * @param {import("./NarrationSession.js").NarrationSessionPayload} payload
 * @returns {string}
 */
function resolveExitFromPayload(payload) {
  const story = getStoryById(payload.storyId);
  if (!story) {
    return payload.returnSpace;
  }

  return resolveExitTarget(
    story,
    {
      exitSpace: payload.exitSpaceOverride ?? undefined,
      exit: payload.exitModeOverride ?? undefined,
    },
    payload.returnSpace,
  );
}

function tryStartPendingStory() {
  if (!pendingStory || getCurrentSpace() !== GameSpace.NARRATION) {
    return;
  }

  if (isSceneLoadOverlayVisible()) {
    return;
  }

  const story = pendingStory;
  pendingStory = null;
  startStoryUi(story);
}

function enterNarrationSpace() {
  const payload = NarrationSession.consume();
  if (!payload) {
    console.warn("[Narration] Нет активной сессии, возврат в лобби");
    navigateTo(GameSpace.LOBBY);
    return;
  }

  const story = getStoryById(payload.storyId);
  if (!story) {
    console.warn(`[Narration] История «${payload.storyId}» не найдена`);
    NarrationSession.clear();
    navigateTo(payload.returnSpace);
    return;
  }

  pendingStory = story;
  tryStartPendingStory();
}

/**
 * @returns {() => void}
 */
export function initNarrationController() {
  const startBtn = document.getElementById("btn-start-game");
  startBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    startStory("intro-01");
  });

  const unsubs = [
    on(GameEvents.SCENE_LOAD_OVERLAY_HIDDEN, () => {
      tryStartPendingStory();
    }),

    on(GameEvents.SPACE_CHANGED, (detail) => {
      if (detail?.space === GameSpace.NARRATION) {
        enterNarrationSpace();
      }

      if (detail?.prev === GameSpace.NARRATION && detail?.space !== GameSpace.NARRATION) {
        pendingStory = null;
        resetNarrationUI();
        NarrationSession.clear();
      }
    }),

    on(GameEvents.NARRATION_ENDED, () => {
      const payload = NarrationSession.getActive();
      if (!payload) {
        return;
      }

      const target = resolveExitFromPayload(payload);
      NarrationSession.clear();
      navigateTo(target);
    }),
  ];

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}
