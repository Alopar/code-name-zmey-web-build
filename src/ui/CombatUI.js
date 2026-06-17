import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import * as CombatSession from "../combat/CombatSession.js";
import { setCombatButtonState } from "./combatButtonState.js";

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

/**
 * @param {{ current?: number, max?: number } | undefined} actionPoints
 */
function renderActionPoints(actionPoints) {
  const block = document.getElementById("combat-player-ap");
  const container = document.getElementById("combat-player-ap-points");

  if (!block || !container) {
    return;
  }

  if (!actionPoints || actionPoints.max == null || actionPoints.current == null) {
    block.hidden = true;
    return;
  }

  block.hidden = false;
  const { current, max } = actionPoints;

  while (container.children.length < max) {
    const dot = document.createElement("span");
    dot.className = "ui-ap-point";
    container.appendChild(dot);
  }

  while (container.children.length > max) {
    container.lastChild?.remove();
  }

  for (let index = 0; index < max; index += 1) {
    const dot = container.children[index];
    if (!(dot instanceof HTMLElement)) {
      continue;
    }

    const isActive = index < current;
    dot.classList.toggle("is-active", isActive);
    dot.classList.toggle("is-spent", !isActive);
    dot.setAttribute("aria-hidden", isActive ? "false" : "true");
  }

  block.setAttribute("aria-label", `Очки действия: ${current} из ${max}`);
}

/** @type {Readonly<Record<string, { button: HTMLElement | null }>>} */
const WEAPON_ATTACK_UI = Object.freeze({
  primary: {
    button: document.getElementById("btn-attack-primary"),
  },
  secondary: {
    button: document.getElementById("btn-attack-secondary"),
  },
});

/** @type {Readonly<Record<string, { button: HTMLElement | null, label: HTMLElement | null, countEl: HTMLElement | null }>>} */
const COMBAT_ABILITY_UI = Object.freeze({
  stimulator: {
    button: document.getElementById("btn-combat-stimulator"),
    label: document.getElementById("combat-stimulator-label"),
    countEl: document.querySelector("#combat-stimulator-count strong"),
  },
  grenade: {
    button: document.getElementById("btn-combat-grenade"),
    label: document.getElementById("combat-grenade-label"),
    countEl: document.querySelector("#combat-grenade-count strong"),
  },
});

export function initCombatUI() {
  const waitBtn = document.getElementById("btn-wait");
  const playerFill = document.getElementById("combat-player-hp-fill");
  const playerBar = document.getElementById("combat-player-hp-bar");
  const heroNameEl = document.getElementById("combat-hero-name");

  const weaponAttackButtons = Object.values(WEAPON_ATTACK_UI)
    .map((ui) => ui.button)
    .filter((btn) => btn instanceof HTMLElement);
  const abilityButtons = Object.values(COMBAT_ABILITY_UI)
    .map((ui) => ui.button)
    .filter((btn) => btn instanceof HTMLElement);
  const combatActionButtons = [...weaponAttackButtons, waitBtn, ...abilityButtons];

  function applyBusyLock(detail) {
    setCombatButtonState(waitBtn, { busy: true });
    updateWeaponAttackButtons(detail.weaponAttacks, { mode: "busy" });
    updateAbilityButtons(detail.abilities, { mode: "busy" });
  }

  function resetCombatFooter() {
    for (const btn of combatActionButtons) {
      if (!btn) {
        continue;
      }
      btn.hidden = false;
      btn.disabled = false;
      btn.classList.remove("is-disabled", "is-busy");
    }
  }

  function lockPostCombatActions() {
    for (const btn of combatActionButtons) {
      setCombatButtonState(btn, { unavailable: true });
      if (btn) {
        btn.hidden = false;
      }
    }
  }

  function lockCombatActionsForTurn() {
    for (const btn of combatActionButtons) {
      setCombatButtonState(btn, { unavailable: true });
    }
  }

  /**
   * @param {string} slot
   * @param {{ slot: string, name: string, canUse: boolean, canUseReady?: boolean }} weaponAttack
   * @param {{ mode?: "busy" | "turn", unavailable?: boolean }} [lock]
   */
  function updateWeaponAttackButton(slot, weaponAttack, lock = {}) {
    const ui = WEAPON_ATTACK_UI[slot];
    if (!ui?.button) {
      return;
    }

    ui.button.hidden = false;
    ui.button.textContent = weaponAttack.name;
    ui.button.setAttribute("aria-label", weaponAttack.name);

    if (lock.mode === "busy") {
      const canUseReady = weaponAttack.canUseReady ?? false;
      setCombatButtonState(
        ui.button,
        canUseReady ? { busy: true } : { unavailable: true },
      );
      return;
    }

    setCombatButtonState(ui.button, {
      unavailable: lock.unavailable || lock.mode === "turn" || !weaponAttack.canUse,
    });
  }

  /**
   * @param {Array<{ slot: string, name: string, canUse: boolean, canUseReady?: boolean }>} [weaponAttacks]
   * @param {{ mode?: "busy" | "turn", unavailable?: boolean }} [lock]
   */
  function updateWeaponAttackButtons(weaponAttacks, lock = {}) {
    const attackSlots = new Set(weaponAttacks?.map((attack) => attack.slot) ?? []);

    for (const [slot, ui] of Object.entries(WEAPON_ATTACK_UI)) {
      if (!ui.button) {
        continue;
      }

      if (!attackSlots.has(slot)) {
        ui.button.hidden = true;
      }
    }

    if (!weaponAttacks?.length) {
      return;
    }

    for (const weaponAttack of weaponAttacks) {
      updateWeaponAttackButton(weaponAttack.slot, weaponAttack, lock);
    }
  }

  /**
   * @param {string} abilityId
   * @param {{ id: string, name: string, resourceCount?: number, cooldownRemaining: number, canUse: boolean, canUseReady?: boolean }} ability
   * @param {{ mode?: "busy" | "turn", unavailable?: boolean }} [lock]
   */
  function updateAbilityButton(abilityId, ability, lock = {}) {
    const ui = COMBAT_ABILITY_UI[abilityId];
    if (!ui?.button) {
      return;
    }

    ui.button.hidden = false;

    const onCooldown = ability.cooldownRemaining > 0;
    const label = onCooldown
      ? `${ability.name} (${ability.cooldownRemaining})`
      : ability.name;

    if (ui.label) {
      ui.label.textContent = label;
    }

    if (ui.countEl) {
      ui.countEl.textContent = String(ability.resourceCount ?? 0);
    }

    ui.button.classList.toggle("is-on-cooldown", onCooldown);

    if (lock.mode === "busy") {
      const canUseReady = ability.canUseReady ?? false;
      setCombatButtonState(
        ui.button,
        canUseReady ? { busy: true } : { unavailable: true },
      );
      return;
    }

    setCombatButtonState(ui.button, {
      unavailable: lock.unavailable || lock.mode === "turn" || !ability.canUse,
    });
  }

  /**
   * @param {Array<{ id: string, name: string, resourceCount?: number, cooldownRemaining: number, canUse: boolean }>} [abilities]
   * @param {{ mode?: "busy" | "turn", unavailable?: boolean }} [lock]
   */
  function updateAbilityButtons(abilities, lock = {}) {
    if (!abilities?.length) {
      return;
    }

    const abilityIds = new Set(abilities.map((ability) => ability.id));

    for (const [abilityId, ui] of Object.entries(COMBAT_ABILITY_UI)) {
      if (!ui.button) {
        continue;
      }

      if (!abilityIds.has(abilityId)) {
        ui.button.hidden = true;
      }
    }

    for (const ability of abilities) {
      updateAbilityButton(ability.id, ability, lock);
    }
  }

  /**
   * @param {{
   *   phase?: string,
   *   canAct?: boolean,
   *   actionsLock?: "none" | "busy" | "turn",
   *   actionPoints?: { current: number, max: number },
   *   player?: { name?: string, hpPercent: number },
   *   weaponAttacks?: Array<{ slot: string, name: string, canUse: boolean, canUseReady?: boolean }>,
   *   abilities?: Array<{ id: string, name: string, resourceCount?: number, cooldownRemaining: number, canUse: boolean }>
   * }} detail
   */
  function applyCombatState(detail) {
    if (detail?.player) {
      if (heroNameEl && detail.player.name) {
        heroNameEl.textContent = detail.player.name;
      }
      setHpBar(playerBar, playerFill, detail.player.hpPercent);
    }

    renderActionPoints(detail?.actionPoints);

    if (detail?.phase === "ended") {
      lockPostCombatActions();
      updateWeaponAttackButtons(detail.weaponAttacks, { mode: "turn" });
      updateAbilityButtons(detail.abilities, { mode: "turn" });
      return;
    }

    const actionsLock = detail?.actionsLock ?? (detail?.canAct ? "none" : "turn");

    if (actionsLock === "busy") {
      applyBusyLock(detail);
      return;
    }

    if (actionsLock === "turn") {
      lockCombatActionsForTurn();
      updateWeaponAttackButtons(detail.weaponAttacks, { mode: "turn" });
      updateAbilityButtons(detail.abilities, { mode: "turn" });
      return;
    }

    updateWeaponAttackButtons(detail?.weaponAttacks);
    setCombatButtonState(waitBtn, { unavailable: false });
    updateAbilityButtons(detail.abilities);
  }

  on(GameEvents.COMBAT_STARTED, (detail) => {
    resetCombatFooter();
    const player = detail?.encounter?.player;
    if (player) {
      applyCombatState({ player, canAct: false, actionsLock: "turn" });
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

  for (const [slot, ui] of Object.entries(WEAPON_ATTACK_UI)) {
    ui.button?.addEventListener("click", (event) => {
      event.stopPropagation();
      CombatSession.getEngine()?.requestPlayerWeaponAttack(slot);
    });
  }

  waitBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    CombatSession.getEngine()?.requestPlayerWait();
  });

  for (const [abilityId, ui] of Object.entries(COMBAT_ABILITY_UI)) {
    ui.button?.addEventListener("click", (event) => {
      event.stopPropagation();
      CombatSession.getEngine()?.requestPlayerAbility(abilityId);
    });
  }
}
