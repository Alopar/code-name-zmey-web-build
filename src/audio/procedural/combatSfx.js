/** @typedef {{ durationMs?: number, thumpFreq?: number, noiseGain?: number, thumpGain?: number }} PlayerHitPreset */
/** @typedef {{ durationMs?: number, thumpFreq?: number, noiseGain?: number, thumpGain?: number }} EnemyHitPreset */
/** @typedef {{ durationMs?: number, sweepStart?: number, sweepEnd?: number, noiseGain?: number }} EnemyDeathPreset */

const PLAYER_HIT_PRESET = Object.freeze({
  durationMs: 110,
  thumpFreq: 180,
  noiseGain: 0.35,
  thumpGain: 0.55,
});

const ENEMY_HIT_PRESET = Object.freeze({
  durationMs: 140,
  thumpFreq: 95,
  noiseGain: 0.45,
  thumpGain: 0.7,
});

const ENEMY_DEATH_PRESET = Object.freeze({
  durationMs: 420,
  sweepStart: 420,
  sweepEnd: 60,
  noiseGain: 0.3,
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
 * @param {number} [filterFreq]
 */
function playNoiseBurst(ctx, destination, durationSec, gain, filterFreq = 1200) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, durationSec);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.Q.setValueAtTime(0.8, now);

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
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.6), now + durationSec);

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
 * @param {number} durationSec
 * @param {number} startFreq
 * @param {number} endFreq
 * @param {number} gain
 */
function playSweep(ctx, destination, durationSec, startFreq, endFreq, gain) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + durationSec);

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
 * @param {number} [volume]
 * @param {PlayerHitPreset} [preset]
 */
export function createPlayerHitSound(ctx, destination, volume = 1, preset = PLAYER_HIT_PRESET) {
  const durationSec = (preset.durationMs ?? PLAYER_HIT_PRESET.durationMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playNoiseBurst(
    ctx,
    output,
    Math.min(0.06, durationSec * 0.5),
    preset.noiseGain ?? PLAYER_HIT_PRESET.noiseGain,
    1800,
  );
  playThump(
    ctx,
    output,
    durationSec,
    preset.thumpFreq ?? PLAYER_HIT_PRESET.thumpFreq,
    preset.thumpGain ?? PLAYER_HIT_PRESET.thumpGain,
  );
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {EnemyHitPreset} [preset]
 */
export function createEnemyHitSound(ctx, destination, volume = 1, preset = ENEMY_HIT_PRESET) {
  const durationSec = (preset.durationMs ?? ENEMY_HIT_PRESET.durationMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playNoiseBurst(
    ctx,
    output,
    Math.min(0.08, durationSec * 0.45),
    preset.noiseGain ?? ENEMY_HIT_PRESET.noiseGain,
    700,
  );
  playThump(
    ctx,
    output,
    durationSec,
    preset.thumpFreq ?? ENEMY_HIT_PRESET.thumpFreq,
    preset.thumpGain ?? ENEMY_HIT_PRESET.thumpGain,
  );
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {EnemyDeathPreset} [preset]
 */
export function createEnemyDeathSound(ctx, destination, volume = 1, preset = ENEMY_DEATH_PRESET) {
  const durationSec = (preset.durationMs ?? ENEMY_DEATH_PRESET.durationMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playSweep(
    ctx,
    output,
    durationSec * 0.7,
    preset.sweepStart ?? ENEMY_DEATH_PRESET.sweepStart,
    preset.sweepEnd ?? ENEMY_DEATH_PRESET.sweepEnd,
    0.22,
  );
  playNoiseBurst(
    ctx,
    output,
    durationSec,
    preset.noiseGain ?? ENEMY_DEATH_PRESET.noiseGain,
    400,
  );
}
