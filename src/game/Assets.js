/** Ключи текстур world-view. */
export const AssetKey = Object.freeze({
  LOBBY_BG: "bg_lobby",
  JUNGLE_ROAD_01: "bg_jungle_road_01",
  JUNGLE_ROAD_02: "bg_jungle_road_02",
  JUNGLE_ROAD_03: "bg_jungle_road_03",
  JUNGLE_ROAD_04: "bg_jungle_road_04",
  JUNGLE_ROAD_05: "bg_jungle_road_05",
  ENEMY_BABOON: "enemy_baboon",
  LOOT_MEDKIT: "loot_medkit",
  LOOT_STIMULATOR: "loot_stimulator",
  LOOT_GRENADE: "loot_grenade",
  CONTAINER_MEDICAL: "container_medical",
  CONTAINER_MILITARY_OLIVE: "container_military_olive",
});

/** Кадры спрайт-листа врага (2 колонки: idle | attack). */
export const EnemyBaboonFrame = Object.freeze({
  IDLE: 0,
  ATTACK: 1,
});

/** Кадры спрайт-листа контейнера (2 колонки: closed | open). */
export const ContainerFrame = Object.freeze({
  CLOSED: 0,
  OPEN: 1,
});

/** @type {Readonly<Record<string, string>>} */
export const ASSET_PATHS = Object.freeze({
  [AssetKey.LOBBY_BG]: "assets/images/lobby.png",
  [AssetKey.JUNGLE_ROAD_01]: "assets/images/locations/jungle/location-jungle-road-01.png",
  [AssetKey.JUNGLE_ROAD_02]: "assets/images/locations/jungle/location-jungle-road-02.png",
  [AssetKey.JUNGLE_ROAD_03]: "assets/images/locations/jungle/location-jungle-road-03.png",
  [AssetKey.JUNGLE_ROAD_04]: "assets/images/locations/jungle/location-jungle-road-04.png",
  [AssetKey.JUNGLE_ROAD_05]: "assets/images/locations/jungle/location-jungle-road-05.png",
});

/** Пул фонов джунглевой дороги для случайного выбора. */
export const JUNGLE_ROAD_BG_KEYS = Object.freeze([
  AssetKey.JUNGLE_ROAD_01,
  AssetKey.JUNGLE_ROAD_02,
  AssetKey.JUNGLE_ROAD_03,
  AssetKey.JUNGLE_ROAD_04,
  AssetKey.JUNGLE_ROAD_05,
]);

/** PNG с chromakey; грузятся через loadKeyedSpritesheet в BootScene. */
export const KEYED_SPRITE_PATHS = Object.freeze({
  [AssetKey.ENEMY_BABOON]: "assets/images/enemies/jungle/enemy-jungle-baboon-01.png",
  [AssetKey.LOOT_MEDKIT]: "assets/images/items/loot/item-loot-medkit-01.png",
  [AssetKey.LOOT_STIMULATOR]: "assets/images/items/loot/item-loot-stimulator-01.png",
  [AssetKey.LOOT_GRENADE]: "assets/images/items/loot/item-loot-grenade-frag-01.png",
  [AssetKey.CONTAINER_MEDICAL]:
    "assets/images/containers/jungle/container-jungle-medical-01.png",
  [AssetKey.CONTAINER_MILITARY_OLIVE]:
    "assets/images/containers/jungle/container-jungle-military-olive-01.png",
});

/** Число колонок spritesheet по ключу (по умолчанию 2). */
export const KEYED_SPRITE_COLUMNS = Object.freeze({
  [AssetKey.LOOT_MEDKIT]: 1,
  [AssetKey.LOOT_STIMULATOR]: 1,
  [AssetKey.LOOT_GRENADE]: 1,
});
