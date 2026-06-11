import { loadKeyedImage } from "./chromaKey.js";

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Не удалось загрузить: ${url}`));
    img.src = url;
  });
}

/**
 * @typedef {import("./chromaKey.js").ChromaKeyOptions} ChromaKeyOptions
 * @typedef {object} LoadKeyedSpritesheetOptions
 * @property {Phaser.Scene} scene
 * @property {string} key
 * @property {string} url
 * @property {ChromaKeyOptions} chroma
 * @property {number} [columns]
 */

/**
 * Убирает chromakey и регистрирует горизонтальный spritesheet в TextureManager сцены.
 * @param {LoadKeyedSpritesheetOptions} options
 * @returns {Promise<{ frameWidth: number, frameHeight: number, frameCount: number }>}
 */
export async function loadKeyedSpritesheet(options) {
  const { scene, key, url, chroma, columns = 2 } = options;
  const blobUrl = await loadKeyedImage(url, chroma);

  try {
    const img = await loadImageElement(blobUrl);
    const frameWidth = Math.floor(img.naturalWidth / columns);
    const frameHeight = img.naturalHeight;

    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }

    scene.textures.addSpriteSheet(key, img, { frameWidth, frameHeight });

    return { frameWidth, frameHeight, frameCount: columns };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
