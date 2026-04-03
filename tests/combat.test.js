import { describe, expect, it } from 'vitest';
import {
  getNearestEnemy,
  getProjectileVelocity,
  getRicochetTarget,
  getShotDirections
} from '../src/game/logic/combat.js';

describe('getNearestEnemy', () => {
  it('returns the closest living enemy', () => {
    const player = { x: 0, y: 0 };
    const enemies = [
      { active: true, x: 100, y: 0, id: 'far' },
      { active: true, x: 25, y: 0, id: 'near' },
      { active: false, x: 5, y: 0, id: 'inactive' }
    ];

    expect(getNearestEnemy(player, enemies)?.id).toBe('near');
  });

  it('returns null when no active enemies exist', () => {
    expect(getNearestEnemy({ x: 0, y: 0 }, [{ active: false, x: 5, y: 5 }])).toBeNull();
  });
});

describe('getProjectileVelocity', () => {
  it('returns normalized velocity scaled by projectile speed', () => {
    expect(getProjectileVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 500)).toEqual({
      x: 300,
      y: 400
    });
  });
});

describe('getShotDirections', () => {
  it('returns one angle for a single-shot weapon', () => {
    expect(getShotDirections({ x: 1, y: 0 }, 1, 14)).toEqual([{ x: 1, y: 0 }]);
  });

  it('returns a symmetric spread for multishot', () => {
    const directions = getShotDirections({ x: 1, y: 0 }, 3, 20);

    expect(directions).toHaveLength(3);
    expect(directions[1].x).toBeCloseTo(1, 3);
  });
});

describe('getRicochetTarget', () => {
  it('finds a new nearby enemy that is not the one just hit', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const nextEnemy = { x: 130, y: 110, active: true, id: 'second' };

    expect(getRicochetTarget(currentEnemy, [currentEnemy, nextEnemy], 80)?.id).toBe('second');
  });
});
