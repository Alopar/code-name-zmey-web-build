import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../core/Viewport.js";

export const SCREEN_CENTER_X = VIEWPORT_WIDTH / 2;
export const SCREEN_CENTER_Y = VIEWPORT_HEIGHT / 2;

/** Базовая линия спавна ≈ COMBAT_BASE_Y относительно центра экрана. */
export const DEFAULT_LINE_OFFSET_Y = Math.round(VIEWPORT_HEIGHT * 0.68 - SCREEN_CENTER_Y);
