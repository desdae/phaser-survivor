import { describe, expect, it } from 'vitest';
import { getSpawnPosition, getSpawnProfile } from '../src/game/logic/spawn.js';

describe('getSpawnPosition', () => {
  it('spawns outside the current camera view', () => {
    const view = { left: 0, right: 100, top: 0, bottom: 100 };
    const point = getSpawnPosition(view, 24, () => 0.1, () => 0.8, () => 0.3);
    const outsideX = point.x < view.left || point.x > view.right;
    const outsideY = point.y < view.top || point.y > view.bottom;

    expect(outsideX || outsideY).toBe(true);
  });
});

describe('getSpawnProfile', () => {
  it('shifts the roster toward tougher enemies over time', () => {
    expect(getSpawnProfile(5).weights.tough).toBe(0);
    expect(getSpawnProfile(45).weights.tough).toBeGreaterThan(0);
  });

  it('adds spitters to the roster in later waves', () => {
    expect(getSpawnProfile(20).weights.spitter).toBe(0);
    expect(getSpawnProfile(90).weights.spitter).toBeGreaterThan(0);
  });

  it('adds poison blobs to later waves after the early game', () => {
    expect(getSpawnProfile(45).weights.poisonBlob ?? 0).toBe(0);
    expect(getSpawnProfile(95).weights.poisonBlob ?? 0).toBeGreaterThan(0);
  });

  it('increases spawn pressure over time', () => {
    const early = getSpawnProfile(5);
    const late = getSpawnProfile(90);

    expect(late.batchSize).toBeGreaterThanOrEqual(early.batchSize);
    expect(late.cooldownMs).toBeLessThan(early.cooldownMs);
  });

  it('keeps early pressure much gentler through the first ninety seconds', () => {
    const thirtySeconds = getSpawnProfile(30);
    const ninetySeconds = getSpawnProfile(90);

    expect(thirtySeconds.cooldownMs).toBeGreaterThanOrEqual(850);
    expect(thirtySeconds.batchSize).toBe(1);
    expect(ninetySeconds.cooldownMs).toBeGreaterThanOrEqual(620);
    expect(ninetySeconds.batchSize).toBeLessThanOrEqual(3);
  });

  it('still ramps hard after the calmer early game', () => {
    const ninetySeconds = getSpawnProfile(90);
    const late = getSpawnProfile(180);

    expect(late.batchSize).toBeGreaterThan(ninetySeconds.batchSize);
    expect(late.cooldownMs).toBeLessThan(ninetySeconds.cooldownMs);
  });
});
