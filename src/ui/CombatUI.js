import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as CombatSession from "../combat/CombatSession.js";

/**
 * @param {HTMLElement | null} bar
 * @param {HTMLElement | null} fill
 * @param {number} percent
 */
function setHpBar(bar, fill, percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  if (fill) {
    fill.style.width = `${clamped}%`;
  }
  if (bar) {
    bar.setAttribute("aria-valuenow", String(clamped));
  }
}

const STIMULATOR_ABILITY_ID = "stimulator";

export function initCombatUI() {
  const attackBtn = document.getElementById("btn-attack");
  const waitBtn = document.getElementById("btn-wait");
  const stimulatorBtn = document.getElementById("btn-combat-stimulator");
  const stimulatorLabel = document.getElementById("combat-stimulator-label");
  const stimulatorCountEl = document.querySelector("#combat-stimulator-count strong");
  const playerFill = document.getElementById("combat-player-hp-fill");
  const playerBar = document.getElementById("combat-player-hp-bar");
  const heroNameEl = document.getElementById("combat-hero-name");

  const combatActionButtons = [attackBtn, waitBtn, stimulatorBtn];

  function resetCombatFooter() {
    for (const btn of combatActionButtons) {
      if (!btn) {
        continue;
      }
      btn.hidden = false;
      btn.disabled = false;
      btn.classList.remove("is-disabled");
    }
  }

  function lockPostCombatActions() {
    for (const btn of combatActionButtons) {
      if (!btn) {
        continue;
      }
      btn.hidden = false;
      btn.disabled = true;
      btn.classList.add("is-disabled");
    }
  }

  /** @param {boolean} disabled */
  function setCombatActionsDisabled(disabled) {
    for (const btn of [attackBtn, waitBtn, stimulatorBtn]) {
      if (!btn || btn.hidden) {
        continue;
      }
      btn.disabled = disabled;
      btn.classList.toggle("is-disabled", disabled);
    }
  }

  /**
   * @param {Array<{ id: string, name: string, resourceCount?: number, cooldownRemaining: number, canUse: boolean }>} [abilities]
   * @param {boolean} [actionsLocked]
   */
  function updateAbilityButtons(abilities, actionsLocked = false) {
    if (!stimulatorBtn || stimulatorBtn.hidden || !abilities?.length) {
      return;
    }

    const stimulator = abilities.find((ability) => ability.id === STIMULATOR_ABILITY_ID);
    if (!stimulator) {
      stimulatorBtn.hidden = true;
      return;
    }

    stimulatorBtn.hidden = false;

    const onCooldown = stimulator.cooldownRemaining > 0;
    const label = onCooldown
      ? `${stimulator.name} (${stimulator.cooldownRemaining})`
      : stimulator.name;

    if (stimulatorLabel) {
      stimulatorLabel.textContent = label;
    }

    if (stimulatorCountEl) {
      stimulatorCountEl.textContent = String(stimulator.resourceCount ?? 0);
    }

    const disabled = actionsLocked || !stimulator.canUse;
    stimulatorBtn.disabled = disabled;
    stimulatorBtn.classList.toggle("is-disabled", disabled);
    stimulatorBtn.classList.toggle("is-on-cooldown", onCooldown);
  }

  /**
   * @param {{ phase?: string, canAct?: boolean, player?: { name?: string, hpPercent: number }, abilities?: Array<{ id: string, name: string, resourceCount?: number, cooldownRemaining: number, canUse: boolean }> }} detail
   */
  function applyCombatState(detail) {
    if (detail?.player) {
      if (heroNameEl && detail.player.name) {
        heroNameEl.textContent = detail.player.name;
      }
      setHpBar(playerBar, playerFill, detail.player.hpPercent);
    }

    if (detail?.phase === "ended") {
      lockPostCombatActions();
      updateAbilityButtons(detail.abilities, true);
      return;
    }

    const actionsLocked = !detail?.canAct;
    setCombatActionsDisabled(actionsLocked);
    updateAbilityButtons(detail.abilities, actionsLocked);
  }

  on(GameEvents.COMBAT_STARTED, (detail) => {
    resetCombatFooter();
    const player = detail?.encounter?.player;
    if (player) {
      applyCombatState({ player, canAct: false });
    }
  });

  on(GameEvents.COMBAT_STATE, (detail) => {
    applyCombatState(detail);
  });

  on(GameEvents.COMBAT_OUTCOME, () => {
    lockPostCombatActions();
  });

  on(GameEvents.SPACE_CHANGED, (detail) => {
    if (detail?.prev === GameSpace.COMBAT) {
      CombatSession.clear();
      resetCombatFooter();
    }
  });

  attackBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    CombatSession.getEngine()?.requestPlayerAttack();
  });

  waitBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    CombatSession.getEngine()?.requestPlayerWait();
  });

  stimulatorBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    CombatSession.getEngine()?.requestPlayerAbility(STIMULATOR_ABILITY_ID);
  });
}
