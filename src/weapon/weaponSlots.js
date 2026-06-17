/** @typedef {"primary" | "secondary"} WeaponSlot */

export const WEAPON_SLOTS = Object.freeze({
  primary: "primary",
  secondary: "secondary",
});

/** @type {readonly WeaponSlot[]} */
export const WEAPON_SLOT_ORDER = Object.freeze([
  WEAPON_SLOTS.primary,
  WEAPON_SLOTS.secondary,
]);
