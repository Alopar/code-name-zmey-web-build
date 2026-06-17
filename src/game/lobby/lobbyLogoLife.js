import { GameEvents, on } from "../../core/EventBus.js";
import { GameSpace } from "../../core/GameSpace.js";
import { getCurrentSpace } from "../../core/GameState.js";
import { isLobbyPresentationEnabled } from "./lobbyPresentationState.js";

const LOGO_SELECTOR = ".ui-lobby-logo";
const STYLE_ROOT_ID = "app-viewport";

/** Длительность цикла float (с). */
const FLOAT_DURATION_SEC = 5.8;

/** Длительность цикла glow (с). */
const GLOW_DURATION_SEC = 3.8;

/** Сдвиг вверх на пике float (px; отрицательное = вверх). */
const FLOAT_TRANSLATE_Y = -5;

/** Масштаб на пике float. */
const FLOAT_SCALE = 1.007;

/** Базовая тень в покое. */
const FILTER_REST = "drop-shadow(0 6px 20px rgba(0, 0, 0, 0.75))";

/** Тень на пике glow: глубина. */
const SHADOW_GLOW_DEPTH = "0 8px 26px rgba(0, 0, 0, 0.82)";

/** Размытие хаки-ореола (px). */
const GLOW_BLUR = 22;

/** Прозрачность хаки-ореола (0…1). */
const GLOW_OPACITY = 0.24;

/** Размытие внешнего ореола (px). */
const GLOW_OUTER_BLUR = 42;

/** Прозрачность внешнего ореола (0…1). */
const GLOW_OUTER_OPACITY = 0.1;

/** Цвет хаки-ореола (RGB без alpha). */
const GLOW_COLOR = "196, 181, 116";

/** Цвет внешнего ореола (RGB без alpha). */
const GLOW_OUTER_COLOR = "232, 215, 138";

const FILTER_GLOW_PEAK = [
  `drop-shadow(${SHADOW_GLOW_DEPTH})`,
  `drop-shadow(0 0 ${GLOW_BLUR}px rgba(${GLOW_COLOR}, ${GLOW_OPACITY}))`,
  `drop-shadow(0 0 ${GLOW_OUTER_BLUR}px rgba(${GLOW_OUTER_COLOR}, ${GLOW_OUTER_OPACITY}))`,
].join(" ");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Пробрасывает константы анимации в CSS-переменные (см. styles/lobby-logo-life.css).
 */
function applyLobbyLogoLifeStyleTokens() {
  const root = document.getElementById(STYLE_ROOT_ID);
  if (!root) {
    return;
  }

  root.style.setProperty("--lobby-logo-float-duration", `${FLOAT_DURATION_SEC}s`);
  root.style.setProperty("--lobby-logo-glow-duration", `${GLOW_DURATION_SEC}s`);
  root.style.setProperty("--lobby-logo-float-y", `${FLOAT_TRANSLATE_Y}px`);
  root.style.setProperty("--lobby-logo-float-scale", String(FLOAT_SCALE));
  root.style.setProperty("--lobby-logo-filter-rest", FILTER_REST);
  root.style.setProperty("--lobby-logo-filter-glow-peak", FILTER_GLOW_PEAK);
}

/**
 * @param {boolean} active
 */
function setLogoAlive(active) {
  const logo = document.querySelector(LOGO_SELECTOR);
  if (!logo) {
    return;
  }

  logo.classList.toggle(
    "is-alive",
    active && !prefersReducedMotion() && isLobbyPresentationEnabled(),
  );
}

/** Синхронизирует анимацию логотипа с текущим пространством и настройками. */
export function syncLobbyLogoLife() {
  setLogoAlive(getCurrentSpace() === GameSpace.LOBBY);
}

/**
 * Лёгкая анимация логотипа на главном экране (float + glow).
 * @returns {() => void}
 */
export function initLobbyLogoLife() {
  applyLobbyLogoLifeStyleTokens();

  const unsubSpace = on(GameEvents.SPACE_CHANGED, (detail) => {
    setLogoAlive(detail?.space === GameSpace.LOBBY);
  });

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotionPreferenceChange = () => {
    syncLobbyLogoLife();
  };

  motionQuery.addEventListener("change", onMotionPreferenceChange);
  syncLobbyLogoLife();

  return () => {
    unsubSpace();
    motionQuery.removeEventListener("change", onMotionPreferenceChange);
    setLogoAlive(false);
  };
}
