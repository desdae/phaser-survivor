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
  it('unlocks tougher enemies over time', () => {
    expect(getSpawnProfile(5).allowTough).toBe(false);
    expect(getSpawnProfile(45).allowTough).toBe(true);
  });

  it('increases spawn pressure over time', () => {
    const early = getSpawnProfile(5);
    const late = getSpawnProfile(90);

    expect(late.batchSize).toBeGreaterThanOrEqual(early.batchSize);
    expect(late.cooldownMs).toBeLessThan(early.cooldownMs);
  });
});
