import { describe, expect, it } from 'vitest';
import {
  applySwarmSpacing,
  getEnemyIntent,
  getSpacingNeighbors,
  getSwarmSpacingOffset,
  shouldEnemyShoot
} from '../src/game/logic/enemyBehavior.js';

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

describe('getSwarmSpacingOffset', () => {
  it('limits spacing work to a capped set of nearby active neighbors', () => {
    const enemy = { active: true, x: 0, y: 0 };
    const neighbors = [
      enemy,
      { active: false, x: 1, y: 1 },
      { active: true, x: 80, y: 0 },
      ...Array.from({ length: 12 }, (_, index) => ({
        active: true,
        x: 8 + index,
        y: 4
      }))
    ];

    const spacingNeighbors = getSpacingNeighbors(enemy, neighbors, 42, 8);

    expect(spacingNeighbors).toHaveLength(8);
    expect(spacingNeighbors.every((neighbor) => neighbor.active)).toBe(true);
    expect(spacingNeighbors.includes(enemy)).toBe(false);
    expect(spacingNeighbors.every((neighbor) => Math.hypot(neighbor.x - enemy.x, neighbor.y - enemy.y) < 42)).toBe(true);
  });

  it('pushes an enemy away from close neighbors', () => {
    const offset = getSwarmSpacingOffset(
      { active: true, x: 0, y: 0 },
      [
        { active: true, x: 18, y: 0 },
        { active: true, x: 0, y: 40 }
      ],
      42
    );

    expect(offset.x).toBeLessThan(0);
    expect(offset.y).toBeLessThan(0);
  });
});

describe('applySwarmSpacing', () => {
  it('lightly bends chase movement away from nearby clumps', () => {
    const intent = applySwarmSpacing(
      { moveX: 1, moveY: 0, wantsToShoot: false },
      { active: true, x: 0, y: 0 },
      [
        { active: true, x: 16, y: 0 },
        { active: true, x: 12, y: 10 }
      ]
    );

    expect(intent.moveX).toBeLessThan(1);
    expect(intent.moveX).toBeGreaterThan(0);
    expect(intent.moveY).toBeLessThan(0);
  });
});

describe('shouldEnemyShoot', () => {
  it('fires when a spitter is inside its attack band and cooldown elapsed', () => {
    expect(shouldEnemyShoot({ type: 'spitter', nextShotAt: 0 }, 1000, 220)).toBe(true);
  });
});
