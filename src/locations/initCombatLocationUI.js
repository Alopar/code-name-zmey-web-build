import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as CombatSession from "../combat/CombatSession.js";
import { executeCombatLocationAction } from "./executeCombatLocationAction.js";
import { resolveCombatLocationActions } from "./resolveCombatLocationActions.js";

export function initCombatLocationUI() {
  const container = document.getElementById("combat-location-actions");
  if (!container) {
    return;
  }

  /** @type {string | null} */
  let locationId = null;
  let showLeave = false;
  /** @type {string | undefined} */
  let currentPhase;
  /** @type {Array<{ hp?: number }> | undefined} */
  let currentEnemies;

  function clearContainer() {
    container.replaceChildren();
    container.hidden = true;
  }

  function renderActions() {
    const actions = resolveCombatLocationActions({
      locationId: locationId ?? undefined,
      phase: currentPhase,
      enemies: currentEnemies,
      showLeave,
    });

    container.replaceChildren();

    if (!actions.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ui-btn ui-btn--location-action ui-hit";
      button.textContent = action.label;
      button.disabled = !action.canUse;
      button.classList.toggle("is-disabled", !action.canUse);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        executeCombatLocationAction(action.id, {
          engine: CombatSession.getEngine(),
        });
      });
      container.appendChild(button);
    }
  }

  function resetState() {
    locationId = null;
    showLeave = false;
    currentPhase = undefined;
    currentEnemies = undefined;
    clearContainer();
  }

  on(GameEvents.COMBAT_STARTED, (detail) => {
    locationId = detail?.encounter?.location?.id ?? null;
    showLeave = false;
    currentPhase = undefined;
    currentEnemies = detail?.encounter?.enemies;
    renderActions();
  });

  on(GameEvents.COMBAT_STATE, (detail) => {
    currentPhase = detail?.phase;
    currentEnemies = detail?.enemies;
    renderActions();
  });

  on(GameEvents.COMBAT_OUTCOME, (detail) => {
    showLeave = Boolean(detail?.leaveToMap);
    currentPhase = "ended";
    renderActions();
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.prev === GameSpace.COMBAT) {
      resetState();
    }
  });
}
