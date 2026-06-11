/** @typedef {{ durationMs?: number, thumpFreq?: number, noiseGain?: number, thumpGain?: number, filterFreq?: number }} ChestTapPreset */
/** @typedef {{ durationMs?: number, thumpFreq?: number, noiseGain?: number, thumpGain?: number, crackDelayMs?: number }} ChestOpenPreset */

const CHEST_TAP_PRESET = Object.freeze({
  durationMs: 85,
  thumpFreq: 130,
  noiseGain: 0.38,
  thumpGain: 0.42,
  filterFreq: 1400,
});

const CHEST_OPEN_PRESET = Object.freeze({
  durationMs: 320,
  thumpFreq: 58,
  noiseGain: 0.48,
  thumpGain: 0.72,
  crackDelayMs: 45,
});

/**
 * @param {AudioContext} ctx
 * @param {number} durationSec
 * @returns {AudioBuffer}
 */
function createNoiseBuffer(ctx, durationSec) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} startSec
 * @param {number} durationSec
 * @param {number} gain
 * @param {number} filterFreq
 */
function playNoiseBurst(ctx, destination, startSec, durationSec, gain, filterFreq) {
  const now = ctx.currentTime + startSec;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, durationSec);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.Q.setValueAtTime(1.1, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);
  source.start(now);
  source.stop(now + durationSec + 0.02);
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} startSec
 * @param {number} durationSec
 * @param {number} frequency
 * @param {number} gain
 */
function playThump(ctx, destination, startSec, durationSec, frequency, gain) {
  const now = ctx.currentTime + startSec;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * 0.55), now + durationSec);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

/**
 * Удар / треск по закрытому ящику.
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {ChestTapPreset} [preset]
 */
export function createChestTapSound(ctx, destination, volume = 1, preset = CHEST_TAP_PRESET) {
  const durationSec = (preset.durationMs ?? CHEST_TAP_PRESET.durationMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playNoiseBurst(
    ctx,
    output,
    0,
    Math.min(0.07, durationSec * 0.55),
    preset.noiseGain ?? CHEST_TAP_PRESET.noiseGain,
    preset.filterFreq ?? CHEST_TAP_PRESET.filterFreq,
  );
  playThump(
    ctx,
    output,
    0,
    durationSec,
    preset.thumpFreq ?? CHEST_TAP_PRESET.thumpFreq,
    preset.thumpGain ?? CHEST_TAP_PRESET.thumpGain,
  );
}

/**
 * Тяжёлое вскрытие — слом замка / крышки.
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {ChestOpenPreset} [preset]
 */
export function createChestOpenSound(ctx, destination, volume = 1, preset = CHEST_OPEN_PRESET) {
  const durationSec = (preset.durationMs ?? CHEST_OPEN_PRESET.durationMs) / 1000;
  const crackDelaySec = (preset.crackDelayMs ?? CHEST_OPEN_PRESET.crackDelayMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playThump(
    ctx,
    output,
    0,
    durationSec * 0.85,
    preset.thumpFreq ?? CHEST_OPEN_PRESET.thumpFreq,
    preset.thumpGain ?? CHEST_OPEN_PRESET.thumpGain,
  );
  playNoiseBurst(ctx, output, 0, durationSec * 0.35, preset.noiseGain ?? CHEST_OPEN_PRESET.noiseGain, 520);
  playNoiseBurst(ctx, output, crackDelaySec, durationSec * 0.4, (preset.noiseGain ?? 0.48) * 0.75, 900);
}
