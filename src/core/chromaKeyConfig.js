/**
 * Настройки chromakey при загрузке UI-спрайтов.
 * Подбирайте tolerance / softness / despill, если виден зелёный ореол.
 *
 * Для сотен спрайтов лучше печь альфу в PNG на билде;
 * для редкого UI (логотип, баннеры) — runtime keying удобен.
 */
/** Цвет фона #00B140 (типичный green screen). */
export const GREEN_SCREEN_CHROMA = Object.freeze({
  key: { r: 0, g: 177, b: 64 },
  tolerance: 56,
  softness: 40,
  despill: 0.85,
});

export const LOBBY_LOGO_CHROMA = GREEN_SCREEN_CHROMA;
export const ENEMY_SPRITE_CHROMA = GREEN_SCREEN_CHROMA;
