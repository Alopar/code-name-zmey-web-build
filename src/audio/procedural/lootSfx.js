/** @typedef {{ durationMs?: number, freqStart?: number, freqEnd?: number, gain?: number }} LootPickupPreset */
/** @typedef {{ note1Freq?: number, note2Freq?: number, note1Gain?: number, note2Gain?: number }} LootSpawnPreset */

const LOOT_SPAWN_PRESET = Object.freeze({
  note1Freq: 640,
  note2Freq: 920,
  note1Gain: 0.1,
  note2Gain: 0.08,
});

const LOOT_PICKUP_PRESET = Object.freeze({
  durationMs: 160,
  freqStart: 520,
  freqEnd: 1180,
  gain: 0.14,
});

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} startSec
 * @param {number} durationSec
 * @param {number} frequency
 * @param {number} gain
 */
function playTone(ctx, destination, startSec, durationSec, frequency, gain) {
  const now = ctx.currentTime + startSec;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.012);
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
function playRisingBlip(ctx, destination, durationSec, startFreq, endFreq, gain) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + durationSec);

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
 * @param {LootSpawnPreset} [preset]
 */
export function createLootSpawnSound(ctx, destination, volume = 1, preset = LOOT_SPAWN_PRESET) {
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playTone(
    ctx,
    output,
    0,
    0.09,
    preset.note1Freq ?? LOOT_SPAWN_PRESET.note1Freq,
    preset.note1Gain ?? LOOT_SPAWN_PRESET.note1Gain,
  );
  playTone(
    ctx,
    output,
    0.055,
    0.11,
    preset.note2Freq ?? LOOT_SPAWN_PRESET.note2Freq,
    preset.note2Gain ?? LOOT_SPAWN_PRESET.note2Gain,
  );
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} [volume]
 * @param {LootPickupPreset} [preset]
 */
export function createLootPickupSound(ctx, destination, volume = 1, preset = LOOT_PICKUP_PRESET) {
  const durationSec = (preset.durationMs ?? LOOT_PICKUP_PRESET.durationMs) / 1000;
  const output = ctx.createGain();
  output.gain.value = volume;
  output.connect(destination);

  playRisingBlip(
    ctx,
    output,
    durationSec,
    preset.freqStart ?? LOOT_PICKUP_PRESET.freqStart,
    preset.freqEnd ?? LOOT_PICKUP_PRESET.freqEnd,
    preset.gain ?? LOOT_PICKUP_PRESET.gain,
  );
}
