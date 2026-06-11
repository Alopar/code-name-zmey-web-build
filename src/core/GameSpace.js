/** Идентификаторы игровых пространств (game spaces). */
export const GameSpace = Object.freeze({
  LOBBY: "lobby",
  WORLD_MAP: "world_map",
  COMBAT: "combat",
  NARRATION: "narration",
});

/** Ключи Phaser-сцен, соответствующие пространствам. */
export const SceneKey = Object.freeze({
  BOOT: "BootScene",
  LOBBY: "LobbyScene",
  WORLD_MAP: "WorldMapScene",
  COMBAT: "CombatScene",
  NARRATION: "NarrationScene",
});

/** @type {Readonly<Record<string, string>>} */
export const SPACE_TO_SCENE = Object.freeze({
  [GameSpace.LOBBY]: SceneKey.LOBBY,
  [GameSpace.WORLD_MAP]: SceneKey.WORLD_MAP,
  [GameSpace.COMBAT]: SceneKey.COMBAT,
  [GameSpace.NARRATION]: SceneKey.NARRATION,
});

/** @type {Readonly<Record<string, string>>} */
export const SCENE_TO_SPACE = Object.freeze({
  [SceneKey.LOBBY]: GameSpace.LOBBY,
  [SceneKey.WORLD_MAP]: GameSpace.WORLD_MAP,
  [SceneKey.COMBAT]: GameSpace.COMBAT,
  [SceneKey.NARRATION]: GameSpace.NARRATION,
});
