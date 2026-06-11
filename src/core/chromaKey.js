/**
 * @typedef {object} ChromaKeyOptions
 * @property {{ r: number, g: number, b: number }} key
 * @property {number} tolerance
 * @property {number} softness
 * @property {number} [despill]
 */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {number} edge0
 * @param {number} edge1
 * @param {number} x
 */
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * @param {ImageData} imageData
 * @param {ChromaKeyOptions} options
 */
export function applyChromaKey(imageData, options) {
  const { key, tolerance, softness, despill = 0 } = options;
  const data = imageData.data;
  const soft = Math.max(1, softness);
  const inner = tolerance - soft;
  const outer = tolerance + soft;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dr = r - key.r;
    const dg = g - key.g;
    const db = b - key.b;
    const dist = Math.hypot(dr * 0.9, dg * 1.25, db * 0.9);

    const alpha = smoothstep(inner, outer, dist);
    data[i + 3] = Math.round(alpha * 255);

    if (despill > 0 && alpha > 0.02) {
      const greenSpill = Math.max(0, g - Math.max(r, b));
      const strength = despill * (1 - alpha);
      data[i + 1] = Math.round(g - greenSpill * strength);
    }
  }
}

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Не удалось загрузить: ${url}`));
    img.src = url;
  });
}

/**
 * Загружает PNG/JPG с chromakey и возвращает blob:-URL с альфой.
 * @param {string} url
 * @param {ChromaKeyOptions} options
 * @returns {Promise<string>}
 */
export async function loadKeyedImage(url, options) {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas 2D недоступен");
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyChromaKey(imageData, options);
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("toBlob не вернул данные"));
      }
    }, "image/png");
  });

  return URL.createObjectURL(blob);
}
