import { AudioKey } from "../AudioKeys.js";
import {
  createEnemyDeathSound,
  createEnemyHitSound,
  createPlayerHitSound,
} from "../procedural/combatSfx.js";
import {
  createChestOpenSound,
  createChestTapSound,
} from "../procedural/chestSfx.js";
import {
  createLootPickupSound,
  createLootSpawnSound,
} from "../procedural/lootSfx.js";
import {
  createNarrationTypewriterBeepLongSound,
  createNarrationTypewriterBeepSound,
  createNarrationTypewriterTickSound,
} from "../procedural/narrationSfx.js";

/** @typedef {{ kind: "procedural", generator: (ctx: AudioContext, destination: AudioNode, volume?: number) => void }} ProceduralSoundDefinition */
/** @typedef {{ kind: "asset", key: string, loop?: boolean }} AssetSoundDefinition */
/** @typedef {ProceduralSoundDefinition | AssetSoundDefinition} SoundDefinition */

/** @type {Readonly<Record<string, SoundDefinition>>} */
export const SoundDefinitions = Object.freeze({
  [AudioKey.COMBAT_PLAYER_HIT]: {
    kind: "procedural",
    generator: createPlayerHitSound,
  },
  [AudioKey.COMBAT_ENEMY_HIT]: {
    kind: "procedural",
    generator: createEnemyHitSound,
  },
  [AudioKey.COMBAT_ENEMY_DEATH]: {
    kind: "procedural",
    generator: createEnemyDeathSound,
  },
  [AudioKey.LOOT_SPAWN]: {
    kind: "procedural",
    generator: createLootSpawnSound,
  },
  [AudioKey.LOOT_PICKUP]: {
    kind: "procedural",
    generator: createLootPickupSound,
  },
  [AudioKey.CHEST_TAP]: {
    kind: "procedural",
    generator: createChestTapSound,
  },
  [AudioKey.CHEST_OPEN]: {
    kind: "procedural",
    generator: createChestOpenSound,
  },
  [AudioKey.NARRATION_TYPEWRITER_TICK]: {
    kind: "procedural",
    generator: createNarrationTypewriterTickSound,
  },
  [AudioKey.NARRATION_TYPEWRITER_BEEP]: {
    kind: "procedural",
    generator: createNarrationTypewriterBeepSound,
  },
  [AudioKey.NARRATION_TYPEWRITER_BEEP_LONG]: {
    kind: "procedural",
    generator: createNarrationTypewriterBeepLongSound,
  },
});

/**
 * @param {string} key
 * @returns {SoundDefinition | undefined}
 */
export function getSoundDefinition(key) {
  return SoundDefinitions[key];
}
