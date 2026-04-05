import { describe, expect, it, vi } from 'vitest';
import { ChainManager } from '../src/game/systems/ChainManager.js';
import { buildLightningBoltSegments, getChainTargets } from '../src/game/logic/chain.js';

describe('getChainTargets', () => {
  it('starts at the nearest enemy and chains to nearby unseen targets', () => {
    const enemies = [
      { active: true, id: 'near', x: 40, y: 0 },
      { active: true, id: 'chain-1', x: 90, y: 5 },
      { active: true, id: 'chain-2', x: 140, y: 10 },
      { active: true, id: 'far', x: 400, y: 0 }
    ];

    const targets = getChainTargets({ x: 0, y: 0 }, enemies, 3, 70);

    expect(targets.map((enemy) => enemy.id)).toEqual(['near', 'chain-1', 'chain-2']);
  });
});

describe('buildLightningBoltSegments', () => {
  it('creates a jagged bolt path with anchored ends and short branch tendrils', () => {
    const bolt = buildLightningBoltSegments(
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      () => 0.75
    );

    expect(bolt.mainPoints[0]).toEqual({ x: 0, y: 0 });
    expect(bolt.mainPoints.at(-1)).toEqual({ x: 120, y: 0 });
    expect(bolt.mainPoints.length).toBeGreaterThan(4);
    expect(bolt.mainPoints.some((point) => point.y !== 0)).toBe(true);
    expect(bolt.branches.length).toBeGreaterThan(0);
    expect(bolt.branches.every((branch) => branch.length >= 2)).toBe(true);
  });
});

describe('ChainManager', () => {
  it('damages each chain target once and respects cooldowns', () => {
    const lineStyle = vi.fn();
    const moveTo = vi.fn();
    const lineTo = vi.fn();
    const strokePath = vi.fn();
    const graphics = {
      clear() {},
      lineStyle,
      beginPath() {},
      moveTo,
      lineTo,
      strokePath,
      destroy() {}
    };
    const manager = new ChainManager({
      add: { graphics: () => graphics },
      time: { delayedCall: vi.fn((_, callback) => callback()) }
    });
    const enemyA = { active: true, id: 'a', x: 30, y: 0 };
    const enemyB = { active: true, id: 'b', x: 80, y: 0 };
    const enemyC = { active: true, id: 'c', x: 140, y: 0 };
    const damageEnemy = vi.fn();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      chainUnlocked: true,
      chainDamage: 14,
      chainLinks: 3,
      chainRange: 65,
      chainCooldownMs: 900
    };

    const firstCast = manager.update(player, stats, 1000, [enemyA, enemyB, enemyC], { damageEnemy });
    const secondCast = manager.update(player, stats, 1200, [enemyA, enemyB, enemyC], { damageEnemy });

    expect(firstCast).toBe(true);
    expect(secondCast).toBe(false);
    expect(damageEnemy.mock.calls.map(([enemy, damage]) => [enemy.id, damage])).toEqual([
      ['a', 14],
      ['b', 14],
      ['c', 14]
    ]);
    expect(lineStyle.mock.calls.length).toBeGreaterThanOrEqual(9);
    expect(strokePath.mock.calls.length).toBe(lineStyle.mock.calls.length);
    expect(moveTo).toHaveBeenCalled();
    expect(lineTo.mock.calls.length).toBeGreaterThan(9);
  });
});
