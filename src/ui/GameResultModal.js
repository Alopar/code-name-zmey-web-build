import { GameSpace } from "../core/GameSpace.js";
import { navigateTo } from "../game/GameController.js";
import * as HeroSession from "../hero/HeroSession.js";
import * as MapSession from "../map/MapSession.js";
import * as PartySession from "../party/PartySession.js";
import { openModal } from "./ModalManager.js";

const MODAL_ID = "game-result";

/** @typedef {"defeat" | "victory"} GameResultOutcome */

/** @type {Record<GameResultOutcome, { title: string, body: string }>} */
const CONTENT = {
  defeat: {
    title: "Поражение",
    body:
      "Zmey потерпел поражение в джунглях. Операция сорвана — придётся начать путь заново.",
  },
  victory: {
    title: "Победа",
    body:
      "Zmey пробрался через джунгли и достиг деревни. Продолжение следует.",
  },
};

/**
 * @param {GameResultOutcome} outcome
 * @returns {Promise<void>}
 */
export function showGameResultModal(outcome) {
  const content = CONTENT[outcome];
  const titleEl = document.getElementById("modal-game-result-title");
  const bodyEl = document.getElementById("modal-game-result-body");

  if (titleEl) {
    titleEl.textContent = content.title;
  }
  if (bodyEl) {
    bodyEl.textContent = content.body;
  }

  return openModal(MODAL_ID);
}

function finishRun() {
  MapSession.reset();
  HeroSession.reset();
  PartySession.reset();
  navigateTo(GameSpace.LOBBY);
}

export function initGameResultModal() {
  const finishBtn = document.getElementById("btn-game-result-finish");
  finishBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    finishRun();
  });
}
