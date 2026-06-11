import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";
import { spawnFloatingText } from "../feedback/floatingText/spawnFloatingText.js";

/** Центр нижней панели игрока — цифры вылетают снизу вверх, как из-под HUD. */
const PLAYER_FLOAT_TEXT_X = VIEWPORT_WIDTH / 2;
const PLAYER_FLOAT_TEXT_Y = VIEWPORT_HEIGHT * 0.965;
const PLAYER_FLOAT_DISTANCE = 96;
const PLAYER_FLOAT_DURATION_MS = 900;

/**
 * @param {Phaser.Scene} scene
 * @param {{ preset: string, value: number }} options
 * @returns {Phaser.GameObjects.Text | null}
 */
export function spawnPlayerFloatingText(scene, { preset, value }) {
  return spawnFloatingText(scene, {
    x: PLAYER_FLOAT_TEXT_X,
    y: PLAYER_FLOAT_TEXT_Y,
    preset,
    value,
    originY: 1,
    floatDistance: PLAYER_FLOAT_DISTANCE,
    durationMs: PLAYER_FLOAT_DURATION_MS,
  });
}

export const PLAYER_FLOAT_FEEDBACK_MS = PLAYER_FLOAT_DURATION_MS;
