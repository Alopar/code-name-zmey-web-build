import { DEFAULT_HERO_ID } from "../../hero/config/defaultHero.js";

/** @type {Readonly<{ memberIds: readonly string[], initialResources: Readonly<Record<string, number>> }>} */
export const DEFAULT_PARTY_CONFIG = Object.freeze({
  memberIds: Object.freeze([DEFAULT_HERO_ID]),
  initialResources: Object.freeze({
    medkit: 3,
    stimulator: 3,
  }),
});
