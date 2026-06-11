/** @typedef {{ durationMs?: number, freq?: number, gain?: number }} RadioBeepPreset */
/** @typedef {{ noiseMs?: number, thumpFreq?: number, noiseGain?: number, thumpGain?: number }} TypewriterTickPreset */

const TYPEWRITER_TICK_PRESET = Object.freeze({
  noiseMs: 12,
  thumpFreq: 920,
  noiseGain: 0.22,
  thumpGain: 0.18,
});

const RADIO_BEEP_PRESET = Object.freeze({
  durationMs: 42,
  freq: 880,
  gain: 0.16,
});

const RADIO_BEEP_LONG_PRESET = Object.freeze({
  durationMs: 110,
  freq: 660,
  gain: 0.14,
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
 * @param {number} durationSec
 * @param {number} gain
 * @param {number} filterFreq
 */
function playNoiseBurst(ctx, destination, durationSec, gain, filterFreq) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, durationSec);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.Q.setValueAtTime(1.2, now);

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
 * @param {number} durationSec
 * @param {number} frequency
 * @param {number} gain
 */
function playThump(ctx, destination, durationSec, frequency, gain) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(120, frequency * 0.75), now + durationSec);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {RadioBeepPreset} preset
 */
function playRadioBeep(ctx, destination, preset) {
  const durationSec = (preset.durationMs ?? RADIO_BEEP_PRESET.durationMs) / 1000;
  const freq = preset.freq ?? RADIO_BEEP_PRESET.freq;
  const gain = preset.gain ?? RADIO_BEEP_PRESET.gain;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, now);
  filter.Q.setValueAtTime(8, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  playNoiseBurst(ctx, destination, Math.min(0.025, durationSec * 0.35), gain * 0.35, freq * 1.4);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

/**
 * Короткое клацанье клавиши — шум + щелчок.
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {TypewriterTickPreset} [preset]
 */
export function createNarrationTypewriterTickSound(
  ctx,
  destination,
  volume = 1,
  preset = TYPEWRITER_TICK_PRESET,
) {
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  const noiseSec = (preset.noiseMs ?? TYPEWRITER_TICK_PRESET.noiseMs) / 1000;
  playNoiseBurst(
    ctx,
    output,
    noiseSec,
    preset.noiseGain ?? TYPEWRITER_TICK_PRESET.noiseGain,
    3200,
  );
  playThump(
    ctx,
    output,
    noiseSec * 1.4,
    preset.thumpFreq ?? TYPEWRITER_TICK_PRESET.thumpFreq,
    preset.thumpGain ?? TYPEWRITER_TICK_PRESET.thumpGain,
  );
}

/**
 * Короткий радиосигнал «пи».
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 */
export function createNarrationTypewriterBeepSound(ctx, destination, volume = 1) {
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);
  playRadioBeep(ctx, output, RADIO_BEEP_PRESET);
}

/**
 * Длинный радиосигнал «piii».
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 */
export function createNarrationTypewriterBeepLongSound(ctx, destination, volume = 1) {
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);
  playRadioBeep(ctx, output, RADIO_BEEP_LONG_PRESET);
}
