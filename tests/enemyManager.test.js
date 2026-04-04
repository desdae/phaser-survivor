import { describe, expect, it, vi } from 'vitest';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

describe('EnemyManager', () => {
  it('registers a self-collider so mobs separate instead of stacking', () => {
    const enemyGroup = { id: 'enemies' };
    const enemyProjectileGroup = { id: 'enemy-projectiles' };
    const groupFactory = vi
      .fn()
      .mockReturnValueOnce(enemyGroup)
      .mockReturnValueOnce(enemyProjectileGroup);
    const collider = vi.fn();
    const scene = {
      physics: {
        add: {
          collider,
          group: groupFactory
        }
      }
    };

    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    expect(manager.group).toBe(enemyGroup);
    expect(collider).toHaveBeenCalledWith(enemyGroup, enemyGroup);
  });

  it('triggers a small blood splash on non-lethal hits', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const scene = {
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce(enemyGroup)
            .mockReturnValueOnce(projectileGroup)
        }
      },
      time: {
        delayedCall: vi.fn((_, callback) => callback())
      }
    };
    const effects = {
      spawnDeathSplash: vi.fn(),
      spawnHitSplash: vi.fn(),
      spawnPuddle: vi.fn()
    };
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() }, effects);
    const enemy = {
      active: true,
      clearTint: vi.fn(),
      health: 20,
      setTintFill: vi.fn(),
      x: 48,
      y: 72
    };

    const died = manager.damageEnemy(enemy, 6);

    expect(died).toBe(false);
    expect(effects.spawnHitSplash).toHaveBeenCalledWith(enemy, false);
    expect(effects.spawnDeathSplash).not.toHaveBeenCalled();
    expect(effects.spawnPuddle).not.toHaveBeenCalled();
  });

  it('triggers a bigger death splash and puddle when an enemy dies', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const spawnOrb = vi.fn();
    const scene = {
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce(enemyGroup)
            .mockReturnValueOnce(projectileGroup)
        }
      },
      time: {
        delayedCall: vi.fn()
      }
    };
    const effects = {
      spawnDeathSplash: vi.fn(),
      spawnHitSplash: vi.fn(),
      spawnPuddle: vi.fn()
    };
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb }, effects);
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 10,
      setTintFill: vi.fn(),
      x: 64,
      y: 96,
      xpValue: 5
    };

    const died = manager.damageEnemy(enemy, 12);

    expect(died).toBe(true);
    expect(spawnOrb).toHaveBeenCalledWith(64, 96, 5);
    expect(effects.spawnDeathSplash).toHaveBeenCalledWith(enemy);
    expect(effects.spawnPuddle).toHaveBeenCalledWith(enemy);
    expect(effects.spawnHitSplash).not.toHaveBeenCalled();
    expect(enemy.destroy).toHaveBeenCalledOnce();
  });
});
