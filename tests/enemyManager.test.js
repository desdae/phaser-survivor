import { describe, expect, it, vi } from 'vitest';
import { getEliteModifiers } from '../src/game/logic/eliteWaves.js';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

vi.mock('../src/game/logic/spawn.js', () => ({
  getSpawnPosition: () => ({ x: 120, y: 80 }),
  getSpawnProfile: () => ({
    cooldownMs: 999,
    batchSize: 1,
    weights: {
      basic: 1,
      tough: 0,
      spitter: 0
    }
  })
}));

vi.mock('../src/game/logic/enemyVisuals.js', () => ({
  getAnimatedTextureKey: () => null,
  getEnemyVisualConfig: () => ({
    key: 'zombie',
    frames: ['mob-zombie-0'],
    frameDurationMs: 170,
    scale: 1
  })
}));

describe('EnemyManager', () => {
  it('skips the full enemy self-collider so dense swarms do not pay pairwise physics costs', () => {
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
    expect(collider).not.toHaveBeenCalled();
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

  it('restores the elite tint after the non-lethal flash ends', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const eliteTint = 0xf4bf63;
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
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });
    const enemy = {
      active: true,
      clearTint: vi.fn(),
      eliteTint,
      health: 20,
      isElite: true,
      setTintFill: vi.fn(),
      x: 48,
      y: 72
    };

    const died = manager.damageEnemy(enemy, 6);

    expect(died).toBe(false);
    expect(enemy.setTintFill).toHaveBeenNthCalledWith(1, 0xfff0f0);
    expect(enemy.setTintFill).toHaveBeenNthCalledWith(2, eliteTint);
    expect(enemy.clearTint).not.toHaveBeenCalled();
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

  it('has a very small chance to spawn a heart pickup on death', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const spawnHeart = vi.fn();
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
    const manager = new EnemyManager(
      scene,
      { sprite: { x: 0, y: 0 } },
      { spawnHeart, spawnOrb: vi.fn() },
      null,
      () => 0
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 1,
      setTintFill: vi.fn(),
      x: 64,
      y: 96,
      xpValue: 5
    };

    manager.damageEnemy(enemy, 5);

    expect(spawnHeart).toHaveBeenCalledWith(64, 96, 10);
  });

  it('records actual applied damage for the weapon source instead of overkill', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const damageStats = {
      record: vi.fn()
    };
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
    const manager = new EnemyManager(
      scene,
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnHeart: vi.fn() },
      null,
      () => 1,
      damageStats
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 6,
      setTintFill: vi.fn(),
      x: 10,
      xpValue: 3,
      y: 20
    };

    manager.damageEnemy(enemy, 20, 'meteor');

    expect(damageStats.record).toHaveBeenCalledWith('meteor', 6);
  });

  it('applies elite markers and stronger stats when spawning an elite enemy', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdEnemy = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTintFill: vi.fn()
    };
    const scene = {
      cameras: {
        main: {
          height: 600,
          scrollX: 0,
          scrollY: 0,
          width: 800
        }
      },
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce(enemyGroup)
            .mockReturnValueOnce(projectileGroup)
        }
      }
    };
    enemyGroup.create = vi.fn(() => createdEnemy);
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });
    const modifiers = getEliteModifiers();

    const enemy = manager.spawnEnemy('basic', { elite: true });

    expect(enemy).toBe(createdEnemy);
    expect(enemy.isElite).toBe(true);
    expect(enemy.health).toBe(Math.round(34 * modifiers.healthMultiplier));
    expect(enemy.xpValue).toBe(Math.round(4 * modifiers.xpMultiplier));
    expect(enemy.contactDamage).toBe(Math.round(8 * modifiers.contactDamageMultiplier));
    expect(enemy.setScale).toHaveBeenCalledWith(modifiers.scaleMultiplier);
    expect(enemy.setTintFill).toHaveBeenCalledWith(modifiers.tint);
  });

  it('drops a chest when an elite enemy dies', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const spawnOrb = vi.fn();
    const spawnChest = vi.fn();
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
    const manager = new EnemyManager(
      scene,
      { sprite: { x: 0, y: 0 } },
      { spawnChest, spawnOrb },
      null,
      () => 1
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 10,
      isElite: true,
      setTintFill: vi.fn(),
      type: 'spitter',
      x: 64,
      xpValue: 5,
      y: 96
    };

    const died = manager.damageEnemy(enemy, 12);

    expect(died).toBe(true);
    expect(spawnOrb).toHaveBeenCalledWith(64, 96, 5);
    expect(spawnChest).toHaveBeenCalledWith(64, 96, 'spitter');
    expect(enemy.destroy).toHaveBeenCalledOnce();
  });
});
