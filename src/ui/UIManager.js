import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { getCurrentSpace } from "../core/GameState.js";
import { navigateTo } from "../game/GameController.js";

/** @type {Map<string, HTMLElement>} */
const panels = new Map();

/**
 * @param {string} space
 */
function showPanel(space) {
  for (const [key, el] of panels) {
    const active = key === space;
    el.hidden = !active;
    el.classList.toggle("is-active", active);
  }
}

export function initUIManager() {
  document.querySelectorAll(".ui-panel[data-space]").forEach((el) => {
    panels.set(el.dataset.space, el);
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.space) {
      showPanel(detail.space);
    }
  });

  document.querySelectorAll("[data-navigate]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = btn.getAttribute("data-navigate");
      if (target) {
        navigateTo(target);
      }
    });
  });

  showPanel(getCurrentSpace());
}
