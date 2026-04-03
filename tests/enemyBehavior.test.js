import { describe, expect, it } from 'vitest';
import { getEnemyIntent, shouldEnemyShoot } from '../src/game/logic/enemyBehavior.js';

describe('getEnemyIntent', () => {
  it('makes spitters back away when too close to the player', () => {
    const intent = getEnemyIntent(
      { type: 'spitter', preferredRange: 240 },
      { x: 80, y: 0 },
      { x: 0, y: 0 }
    );

    expect(intent.moveX).toBeGreaterThan(0);
  });
});

describe('shouldEnemyShoot', () => {
  it('fires when a spitter is inside its attack band and cooldown elapsed', () => {
    expect(shouldEnemyShoot({ type: 'spitter', nextShotAt: 0 }, 1000, 220)).toBe(true);
  });
});
