import { parseMapMaskPixels } from "./parseMapMaskGrid.js";

/**
 * @param {string} url
 * @returns {Promise<import("./parseMapMaskGrid.js").ParsedMapMask>}
 */
export function loadMapMaskImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          reject(new Error("[MapMask] Canvas 2D context недоступен."));
          return;
        }

        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        resolve(parseMapMaskPixels(imageData.data, canvas.width, canvas.height));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error(`[MapMask] Не удалось загрузить маску: ${url}`));
    };

    image.src = url;
  });
}
