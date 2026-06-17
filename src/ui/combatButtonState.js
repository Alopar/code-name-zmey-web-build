/**
 * @param {HTMLElement | null} btn
 * @param {{ busy?: boolean, unavailable?: boolean }} [state]
 */
export function setCombatButtonState(btn, { busy = false, unavailable = false } = {}) {
  if (!btn || btn.hidden) {
    return;
  }

  btn.disabled = busy || unavailable;
  btn.classList.toggle("is-busy", busy);
  btn.classList.toggle("is-disabled", unavailable);
}
