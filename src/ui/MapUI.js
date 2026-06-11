import { GameEvents, on } from "../core/EventBus.js";
import { GameSpace } from "../core/GameSpace.js";
import { getCurrentSpace } from "../core/GameState.js";
import * as HeroSession from "../hero/HeroSession.js";
import * as PartySession from "../party/PartySession.js";

const MEDKIT_RESOURCE_ID = "medkit";

/** @type {string | null} */
let activeSpace = getCurrentSpace();

/**
 * @param {ReturnType<typeof PartySession.snapshot>} partySnapshot
 */
function getMedkitCount(partySnapshot) {
  const medkit = partySnapshot.resources.find((resource) => resource.id === MEDKIT_RESOURCE_ID);
  return medkit?.count ?? 0;
}

export function initMapUI() {
  const healBtn = document.getElementById("btn-map-heal");
  const medkitCountEl = document.querySelector("#map-heal-medkit-count strong");

  /** @param {boolean} disabled */
  function setHealButtonDisabled(disabled) {
    if (!healBtn) {
      return;
    }

    healBtn.disabled = disabled;
    healBtn.classList.toggle("is-disabled", disabled);
  }

  function updateHealButton() {
    if (!healBtn || !medkitCountEl) {
      return;
    }

    const partySnapshot = PartySession.snapshot();
    const heroSnapshot = HeroSession.snapshot();
    const medkitCount = getMedkitCount(partySnapshot);

    medkitCountEl.textContent = String(medkitCount);

    const onMap = activeSpace === GameSpace.WORLD_MAP;
    const hasMedkit = medkitCount > 0;
    const needsHeal = heroSnapshot.hp < heroSnapshot.maxHp;

    setHealButtonDisabled(!onMap || !hasMedkit || !needsHeal);
  }

  on(GameEvents.SPACE_CHANGED, (detail) => {
    activeSpace = detail?.space ?? null;
    updateHealButton();
  });

  on(GameEvents.PARTY_STATE_CHANGED, () => {
    updateHealButton();
  });

  on(GameEvents.HERO_STATE_CHANGED, () => {
    updateHealButton();
  });

  if (healBtn) {
    healBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      PartySession.useStrategicAbility("heal");
    });
  }

  updateHealButton();
}
