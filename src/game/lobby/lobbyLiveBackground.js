import Phaser from "phaser";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";
import { AssetKey } from "../Assets.js";

/** На сколько увеличиваем фон относительно viewport — запас для смещения без чёрных полей. */
const OVERSCAN_SCALE = 1.04;

/** Макс. сдвиг от курсора (px). */
const MOUSE_SHIFT_MAX_X = 14;
const MOUSE_SHIFT_MAX_Y = 8;

/** Сглаживание следования за курсором. */
const MOUSE_LERP = 0.055;

/**
 * Живой фон главного экрана: лёгкий overscan и мягкий параллакс от курсора.
 * @param {Phaser.Scene} scene
 * @returns {{ bg: Phaser.GameObjects.Image, cleanup: () => void }}
 */
export function setupLobbyLiveBackground(scene) {
  const centerX = VIEWPORT_WIDTH / 2;
  const centerY = VIEWPORT_HEIGHT / 2;

  const bg = scene.add.image(centerX, centerY, AssetKey.LOBBY_BG);
  bg.setDisplaySize(
    VIEWPORT_WIDTH * OVERSCAN_SCALE,
    VIEWPORT_HEIGHT * OVERSCAN_SCALE,
  );
  bg.setDepth(0);

  let mouseOffsetX = 0;
  let mouseOffsetY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  const onPointerMove = (pointer) => {
    const nx = (pointer.x / VIEWPORT_WIDTH - 0.5) * 2;
    const ny = (pointer.y / VIEWPORT_HEIGHT - 0.5) * 2;
    targetMouseX = nx * MOUSE_SHIFT_MAX_X;
    targetMouseY = ny * MOUSE_SHIFT_MAX_Y;
  };

  const onUpdate = () => {
    mouseOffsetX += (targetMouseX - mouseOffsetX) * MOUSE_LERP;
    mouseOffsetY += (targetMouseY - mouseOffsetY) * MOUSE_LERP;

    bg.x = centerX + mouseOffsetX;
    bg.y = centerY + mouseOffsetY;
  };

  const cleanup = () => {
    scene.events.off("update", onUpdate);
    scene.input.off("pointermove", onPointerMove);
  };

  scene.input.on("pointermove", onPointerMove);
  scene.events.on("update", onUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  return { bg, cleanup };
}
