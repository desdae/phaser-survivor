import { describe, expect, it, vi } from 'vitest';
import { NovaManager } from '../src/game/systems/NovaManager.js';
import { getNovaTargets, queueNovaBursts } from '../src/game/logic/nova.js';

describe('getNovaTargets', () => {
  it('returns only enemies inside the pulse radius', () => {
    const enemies = [
      { active: true, id: 'near', x: 40, y: 10 },
      { active: true, id: 'edge', x: 70, y: 0 },
      { active: true, id: 'far', x: 120, y: 0 }
    ];

    expect(getNovaTargets({ x: 0, y: 0 }, enemies, 75).map((enemy) => enemy.id)).toEqual(['near', 'edge']);
  });
});

describe('queueNovaBursts', () => {
  it('schedules one immediate burst plus delayed echoes', () => {
    expect(queueNovaBursts(1000, 3, 180)).toEqual([1000, 1180, 1360]);
  });
});

describe('NovaManager', () => {
  it('casts a pulse and resolves queued echoes over time', () => {
    const ring = { setDepth() { return this; }, setAlpha() { return this; }, setScale() { return this; }, setPosition() { return this; }, setVisible() { return this; }, destroy() {} };
    const manager = new NovaManager({
      add: { image: () => ring },
      tweens: { add: vi.fn() }
    });
    const damageEnemy = vi.fn();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      novaUnlocked: true,
      novaDamage: 11,
      novaRadius: 90,
      novaCooldownMs: 1000,
      novaEchoCount: 2
    };
    const enemies = [{ active: true, id: 'near', x: 50, y: 0 }];

    manager.update(player, stats, 1000, enemies, { damageEnemy });
    manager.update(player, stats, 1179, enemies, { damageEnemy });
    manager.update(player, stats, 1180, enemies, { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(2);
    expect(damageEnemy.mock.calls.every(([, damage]) => damage === 11)).toBe(true);
  });
});
