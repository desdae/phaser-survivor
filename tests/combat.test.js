import { describe, expect, it } from 'vitest';
import { getNearestEnemy, getProjectileVelocity } from '../src/game/logic/combat.js';

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
