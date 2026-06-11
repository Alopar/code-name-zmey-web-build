import { isDebugEnabled, setDebugEnabled } from "../DebugSettings.js";

const CHECKBOX_ID = "debug-enabled";

/**
 * @returns {() => void}
 */
export function initDebugLobbyCheckbox() {
  const checkbox = document.getElementById(CHECKBOX_ID);
  if (!(checkbox instanceof HTMLInputElement)) {
    console.warn("[Debug] Чекбокс debug не найден");
    return () => {};
  }

  checkbox.checked = isDebugEnabled();

  const onChange = () => {
    setDebugEnabled(checkbox.checked);
  };

  checkbox.addEventListener("change", onChange);

  return () => {
    checkbox.removeEventListener("change", onChange);
  };
}
