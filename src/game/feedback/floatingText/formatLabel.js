/**
 * @param {string} format
 * @param {number | string | undefined} value
 */
export function formatLabelText(format, value) {
  const numericValue = Number(value);
  const hasNumericValue = value != null && !Number.isNaN(numericValue);
  const sign = hasNumericValue && numericValue > 0 ? "+" : "";

  return format
    .replace(/\{sign\}/g, sign)
    .replace(/\{value\}/g, hasNumericValue ? String(Math.abs(numericValue)) : String(value ?? ""));
}

/**
 * @param {{
 *   text?: string,
 *   preset?: string,
 *   value?: number | string,
 *   format?: string,
 * }} options
 * @param {import("./presets.js").FloatingTextStyle | null} preset
 */
export function resolveFloatingLabelText(options, preset) {
  if (typeof options.text === "string" && options.text.length > 0) {
    return options.text;
  }

  const format = options.format ?? preset?.format;
  if (typeof format === "string") {
    return formatLabelText(format, options.value);
  }

  if (typeof preset?.text === "string") {
    return preset.text;
  }

  return "";
}
