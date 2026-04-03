import { describe, expect, it } from 'vitest';
import { getBladePositions, shouldBladeDamageEnemy } from '../src/game/logic/blade.js';

describe('getBladePositions', () => {
  it('returns one blade position when only one blade is unlocked', () => {
    const points = getBladePositions({ x: 50, y: 75 }, 1, 80, 0);

    expect(points).toEqual([{ x: 130, y: 75 }]);
  });

  it('distributes multiple blades evenly around the player', () => {
    const points = getBladePositions({ x: 0, y: 0 }, 2, 60, 0);

    expect(points[0].x).toBeCloseTo(60, 3);
    expect(points[1].x).toBeCloseTo(-60, 3);
  });
});

describe('shouldBladeDamageEnemy', () => {
  it('uses a per-enemy cooldown', () => {
    expect(shouldBladeDamageEnemy(1000, 0)).toBe(true);
    expect(shouldBladeDamageEnemy(1200, 1600)).toBe(false);
  });
});
