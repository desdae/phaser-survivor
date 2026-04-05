import { describe, expect, it, vi } from 'vitest';
import { MeteorManager } from '../src/game/systems/MeteorManager.js';
import { getMeteorTargets, resolveMeteorStrike } from '../src/game/logic/meteor.js';

describe('getMeteorTargets', () => {
  it('locks onto the nearest distinct enemies up to the strike count', () => {
    const origin = { x: 0, y: 0 };
    const enemies = [
      { active: true, id: 'a', x: 30, y: 0 },
      { active: true, id: 'b', x: 70, y: 0 },
      { active: true, id: 'c', x: 110, y: 0 }
    ];

    expect(getMeteorTargets(origin, enemies, 2).map((enemy) => enemy.id)).toEqual(['a', 'b']);
  });
});

describe('resolveMeteorStrike', () => {
  it('damages enemies inside the impact radius', () => {
    const damageEnemy = vi.fn();
    const strike = { x: 40, y: 0, radius: 35, damage: 28 };
    const enemies = [
      { active: true, id: 'near', x: 50, y: 10 },
      { active: true, id: 'far', x: 120, y: 0 }
    ];

    resolveMeteorStrike(strike, enemies, { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(damageEnemy.mock.calls[0][0].id).toBe('near');
  });

  it('damages enemies whose hit radius overlaps the impact radius even if their center sits outside it', () => {
    const damageEnemy = vi.fn();
    const strike = { x: 0, y: 0, radius: 40, damage: 28 };
    const enemies = [
      { active: true, id: 'edge', x: 50, y: 0, hitRadius: 14 },
      { active: true, id: 'far', x: 70, y: 0, hitRadius: 10 }
    ];

    resolveMeteorStrike(strike, enemies, { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(damageEnemy.mock.calls[0][0].id).toBe('edge');
  });

  it('accepts enemy query objects as the source during live gameplay updates', () => {
    const damageEnemy = vi.fn();
    const strike = { x: 0, y: 0, radius: 40, damage: 28 };
    const enemies = {
      enemies: [{ active: true, id: 'query-hit', x: 20, y: 0, hitRadius: 12 }]
    };

    resolveMeteorStrike(strike, enemies, { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(damageEnemy.mock.calls[0][0].id).toBe('query-hit');
  });
});

describe('MeteorManager', () => {
  it('queues falling meteor strikes and lands them after the warning delay with a large explosion', () => {
    const createdSprites = [];
    const sprite = {
      active: true,
      x: 0,
      y: 0,
      texture: { key: '' },
      setAlpha() { return this; },
      setDepth() { return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; },
      setRotation(value) { this.rotation = value; return this; },
      setScale() { return this; },
      setTintFill() { return this; },
      clearTint() { return this; },
      destroy() { this.active = false; }
    };
    const tweenCalls = [];
    const manager = new MeteorManager({
      add: {
        image: (x, y, key) => {
          const created = { ...sprite, x, y, texture: { key } };
          createdSprites.push(created);
          return created;
        }
      },
      tweens: {
        add: vi.fn((config) => {
          tweenCalls.push(config);
          return config;
        })
      }
    });
    const damageEnemy = vi.fn();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      meteorUnlocked: true,
      meteorCount: 1,
      meteorDamage: 28,
      meteorRadius: 40,
      meteorCooldownMs: 1200
    };
    const enemy = { active: true, id: 'target', x: 45, y: 0 };

    manager.update(player, stats, 1000, [enemy], { damageEnemy });
    manager.update(player, stats, 1500, [enemy], { damageEnemy });
    manager.update(player, stats, 1720, [enemy], { damageEnemy });

    expect(createdSprites.some((entry) => entry.texture.key === 'meteor-fall')).toBe(true);
    expect(createdSprites.some((entry) => entry.texture.key === 'meteor-explosion')).toBe(true);
    expect(tweenCalls.some((config) => config.targets?.texture?.key === 'meteor-fall')).toBe(true);
    expect(tweenCalls.some((config) => config.targets?.texture?.key === 'meteor-explosion')).toBe(true);
    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(damageEnemy.mock.calls[0][0].id).toBe('target');
  });
});
