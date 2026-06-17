import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as CombatSession from "../combat/CombatSession.js";
import { setCombatButtonState } from "../ui/combatButtonState.js";
import { executeCombatLocationAction } from "./executeCombatLocationAction.js";
import { resolveCombatLocationActions } from "./resolveCombatLocationActions.js";

/** @typedef {"none" | "busy" | "turn"} ActionsLock */

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
  /** @type {ActionsLock} */
  let currentActionsLock = "turn";

  /** @type {Map<string, HTMLButtonElement>} */
  const buttonsById = new Map();

  /** @type {Map<string, boolean>} */
  const lastPlayerAvailability = new Map();

  function clearContainer() {
    for (const button of buttonsById.values()) {
      button.remove();
    }
    buttonsById.clear();
    lastPlayerAvailability.clear();
    container.replaceChildren();
    container.hidden = true;
  }

  /**
   * @param {string} actionId
   * @returns {HTMLButtonElement}
   */
  function createActionButton(actionId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ui-btn ui-btn--location-action ui-hit";
    button.dataset.locationActionId = actionId;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      executeCombatLocationAction(actionId, {
        engine: CombatSession.getEngine(),
      });
    });
    return button;
  }

  /**
   * @param {{ id: string, label: string, canUse: boolean }} action
   * @param {ActionsLock} actionsLock
   */
  function applyActionButtonState(action, actionsLock) {
    const button = buttonsById.get(action.id);
    if (!button) {
      return;
    }

    button.textContent = action.label;

    if (actionsLock === "busy") {
      const wasAvailable = lastPlayerAvailability.get(action.id) ?? false;
      setCombatButtonState(
        button,
        wasAvailable ? { busy: true } : { unavailable: true },
      );
      return;
    }

    setCombatButtonState(button, { unavailable: !action.canUse });

    if (actionsLock === "none" && action.canUse) {
      lastPlayerAvailability.set(action.id, true);
    } else if (actionsLock === "none") {
      lastPlayerAvailability.set(action.id, false);
    }
  }

  /**
   * @param {ActionsLock} [actionsLock]
   */
  function renderActions(actionsLock = currentActionsLock) {
    currentActionsLock = actionsLock;

    const actions = resolveCombatLocationActions({
      locationId: locationId ?? undefined,
      phase: currentPhase,
      enemies: currentEnemies,
      showLeave,
    });

    const nextIds = new Set(actions.map((action) => action.id));

    for (const [actionId, button] of buttonsById) {
      if (!nextIds.has(actionId)) {
        button.remove();
        buttonsById.delete(actionId);
        lastPlayerAvailability.delete(actionId);
      }
    }

    if (!actions.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    for (const action of actions) {
      let button = buttonsById.get(action.id);
      if (!button) {
        button = createActionButton(action.id);
        buttonsById.set(action.id, button);
        container.appendChild(button);
      }

      applyActionButtonState(action, actionsLock);
    }
  }

  function resetState() {
    locationId = null;
    showLeave = false;
    currentPhase = undefined;
    currentEnemies = undefined;
    currentActionsLock = "turn";
    clearContainer();
  }

  on(GameEvents.COMBAT_STARTED, (detail) => {
    locationId = detail?.encounter?.location?.id ?? null;
    showLeave = false;
    currentPhase = undefined;
    currentEnemies = detail?.encounter?.enemies;
    renderActions("turn");
  });

  on(GameEvents.COMBAT_STATE, (detail) => {
    currentPhase = detail?.phase;
    currentEnemies = detail?.enemies;
    const actionsLock = detail?.actionsLock ?? (detail?.canAct ? "none" : "turn");
    renderActions(actionsLock);
  });

  on(GameEvents.COMBAT_OUTCOME, (detail) => {
    showLeave = Boolean(detail?.leaveToMap);
    currentPhase = "ended";
    renderActions("none");
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.prev === GameSpace.COMBAT) {
      resetState();
    }
  });
}
