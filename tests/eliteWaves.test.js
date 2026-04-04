import { describe, expect, it } from 'vitest';
import {
  ELITE_WAVE_INTERVAL_MS,
  ELITE_WARNING_DURATION_MS,
  consumePendingElite,
  createEliteState,
  advanceEliteWaveState,
  getEliteModifiers
} from '../src/game/logic/eliteWaves.js';
import { EliteWaveSystem } from '../src/game/systems/EliteWaveSystem.js';

describe('advanceEliteWaveState', () => {
  it('marks a pending elite wave once the interval is reached', () => {
    const state = createEliteState();

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS - 1);
    expect(state.pendingElite).toBe(false);

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS);
    expect(state.pendingElite).toBe(true);
    expect(state.nextEliteAtMs).toBe(ELITE_WAVE_INTERVAL_MS * 2);
    expect(state.warningUntilMs).toBe(ELITE_WAVE_INTERVAL_MS + ELITE_WARNING_DURATION_MS);
  });

  it('skips ahead to the first interval after a large elapsed jump', () => {
    const state = createEliteState();

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS * 3 + 25);

    expect(state.pendingElite).toBe(true);
    expect(state.nextEliteAtMs).toBe(ELITE_WAVE_INTERVAL_MS * 4);
    expect(state.warningUntilMs).toBe(ELITE_WAVE_INTERVAL_MS * 3 + 25 + ELITE_WARNING_DURATION_MS);
  });

  it('does not retrigger early', () => {
    const state = createEliteState();

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS);
    const nextEliteAtMs = state.nextEliteAtMs;
    const warningUntilMs = state.warningUntilMs;

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS + 1);

    expect(state.pendingElite).toBe(true);
    expect(state.nextEliteAtMs).toBe(nextEliteAtMs);
    expect(state.warningUntilMs).toBe(warningUntilMs);
  });
});

describe('consumePendingElite', () => {
  it('clears only the pending flag', () => {
    const state = createEliteState();

    advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS);
    const nextEliteAtMs = state.nextEliteAtMs;
    const warningUntilMs = state.warningUntilMs;

    consumePendingElite(state);

    expect(state.pendingElite).toBe(false);
    expect(state.nextEliteAtMs).toBe(nextEliteAtMs);
    expect(state.warningUntilMs).toBe(warningUntilMs);
  });
});

describe('getEliteModifiers', () => {
  it('returns the elite modifier set', () => {
    expect(getEliteModifiers()).toEqual({
      healthMultiplier: 4,
      contactDamageMultiplier: 1.5,
      xpMultiplier: 1.6,
      scaleMultiplier: 1.32,
      tint: 0xf4bf63
    });
  });
});

describe('EliteWaveSystem', () => {
  it('wraps elite wave state and warning timing', () => {
    const system = new EliteWaveSystem();

    expect(system.isWarningActive(0)).toBe(false);

    expect(system.update(ELITE_WAVE_INTERVAL_MS)).toBe(system.state);
    expect(system.isWarningActive(ELITE_WAVE_INTERVAL_MS)).toBe(true);

    system.consumeSpawn();
    expect(system.isWarningActive(ELITE_WAVE_INTERVAL_MS)).toBe(true);
    expect(system.isWarningActive(ELITE_WAVE_INTERVAL_MS + ELITE_WARNING_DURATION_MS + 1)).toBe(false);
  });
});
