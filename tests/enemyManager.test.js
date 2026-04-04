import { describe, expect, it, vi } from 'vitest';
import { getEliteModifiers } from '../src/game/logic/eliteWaves.js';
import { PickupManager } from '../src/game/systems/PickupManager.js';
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
  advanceVisualFrame: (enemy) => {
    const frames = enemy.visualFrames ?? [];

    if (frames.length <= 1) {
      return frames[0] ?? enemy.texture?.key ?? null;
    }

    enemy.visualFrameIndex = ((enemy.visualFrameIndex ?? 0) + 1) % frames.length;
    return frames[enemy.visualFrameIndex];
  },
  getEnemyVisualConfig: () => ({
    key: 'zombie',
    frames: ['mob-zombie-0'],
    frameDurationMs: 170,
    scale: 1
  })
}));

function createEnemyManagerHarness() {
  const enemyGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };
  const enemyProjectileGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };
  const scene = {
    physics: {
      add: {
        collider: vi.fn(),
        group: vi
          .fn()
          .mockReturnValueOnce(enemyGroup)
          .mockReturnValueOnce(enemyProjectileGroup)
      }
    },
    time: {
      now: 0,
      delayedCall: vi.fn()
    }
  };

  return new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });
}

function makeEnemy({ x = 0, y = 0, speed = 100, visualFrames = ['idle-0'] } = {}) {
  return {
    active: true,
    attackCooldownMs: 0,
    attackRange: 0,
    cachedMoveX: 0,
    cachedMoveY: 0,
    nextShotAt: 0,
    preferredRange: undefined,
    projectileDamage: 0,
    projectileSpeed: 0,
    setTexture: vi.fn(function setTexture(textureKey) {
      this.texture = { key: textureKey };
    }),
    setVelocity: vi.fn(),
    speed,
    texture: { key: visualFrames[0] ?? 'idle-0' },
    visualFrames,
    x,
    y
  };
}

function createEnemySceneHarness() {
  const enemyGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };
  const enemyProjectileGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };

  return {
    physics: {
      add: {
        collider: vi.fn(),
        group: vi
          .fn()
          .mockReturnValueOnce(enemyGroup)
          .mockReturnValueOnce(enemyProjectileGroup)
      }
    },
    time: {
      now: 0,
      delayedCall: vi.fn()
    }
  };
}

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

  it('spawns a temporary powerup pickup through PickupManager', () => {
    const createdPickup = {
      setDepth: vi.fn().mockReturnThis(),
      setDamping: vi.fn().mockReturnThis(),
      setDrag: vi.fn().mockReturnThis(),
      setMaxVelocity: vi.fn().mockReturnThis()
    };
    const pickupManager = new PickupManager(
      {
        physics: {
          add: {
            group: () => ({
              create: vi.fn(() => createdPickup),
              getChildren: () => []
            })
          }
        }
      },
      vi.fn()
    );

    const pickup = pickupManager.spawnPowerup(10, 20, 'frenzy');

    expect(pickup.kind).toBe('powerup');
    expect(pickup.buffKey).toBe('frenzy');
    expect(pickup.setDepth).toHaveBeenCalledWith(2.2);
  });

  it('uses the powerup drop roll for normal and elite enemy deaths', () => {
    const normalManager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnChest: vi.fn(), spawnPowerup: vi.fn() },
      null,
      () => 1
    );
    normalManager.powerupDropRoll = vi.fn().mockReturnValue('overcharge');

    const normalEnemy = {
      active: true,
      destroy: vi.fn(),
      health: 3,
      type: 'basic',
      x: 40,
      xpValue: 4,
      y: 80
    };

    normalManager.damageEnemy(normalEnemy, 10);

    expect(normalManager.powerupDropRoll).toHaveBeenCalledWith({ isElite: false });
    expect(normalManager.pickupManager.spawnPowerup).toHaveBeenCalledWith(40, 80, 'overcharge');

    const eliteManager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnChest: vi.fn(), spawnPowerup: vi.fn() },
      null,
      () => 1
    );
    eliteManager.powerupDropRoll = vi.fn().mockReturnValue(null);

    const eliteEnemy = {
      active: true,
      destroy: vi.fn(),
      health: 3,
      isElite: true,
      type: 'tough',
      x: 10,
      xpValue: 4,
      y: 20
    };

    eliteManager.damageEnemy(eliteEnemy, 10);

    expect(eliteManager.powerupDropRoll).toHaveBeenCalledWith({ isElite: true });
    expect(eliteManager.pickupManager.spawnPowerup).not.toHaveBeenCalled();
  });

  it('reuses an inactive enemy projectile instead of creating a new one', () => {
    const manager = createEnemyManagerHarness();
    const recycled = {
      active: false,
      body: { enable: false, velocity: { x: 0, y: 0 } },
      setActive: vi.fn(function setActive(value) {
        this.active = value;
        return this;
      }),
      setCircle: vi.fn(function setCircle() {
        return this;
      }),
      setDepth: vi.fn(function setDepth() {
        return this;
      }),
      setPosition: vi.fn(function setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      }),
      setTintFill: vi.fn(function setTintFill() {
        return this;
      }),
      setVelocity: vi.fn(function setVelocity(x, y) {
        this.body.velocity = { x, y };
        return this;
      }),
      setVisible: vi.fn(function setVisible(value) {
        this.visible = value;
        return this;
      }),
      visible: false,
      x: 5,
      y: 7
    };
    manager.enemyProjectileGroup.getChildren.mockReturnValue([recycled]);
    manager.enemyProjectileGroup.create = vi.fn(() => {
      throw new Error('should not create a fresh projectile');
    });

    const projectile = manager.fireEnemyProjectile(
      {
        projectileDamage: 9,
        projectileSpeed: 150,
        x: 12,
        y: 16
      },
      1,
      0,
      1000
    );

    expect(projectile).toBe(recycled);
    expect(recycled.active).toBe(true);
    expect(recycled.body.enable).toBe(true);
    expect(recycled.visible).toBe(true);
    expect(recycled.x).toBe(12);
    expect(recycled.y).toBe(16);
  });
});

describe('EnemyManager update', () => {
  it('stores enemy tiers and builds a near-only query for local combat systems', () => {
    const manager = createEnemyManagerHarness();
    const nearEnemy = makeEnemy({ x: 80, y: 0 });
    const farEnemy = makeEnemy({ x: 1400, y: 0 });
    manager.getLivingEnemies = vi.fn().mockReturnValue([nearEnemy, farEnemy]);

    manager.update(16, 60, 1000);

    expect(nearEnemy.lodTier).toBe('near');
    expect(farEnemy.lodTier).toBe('far');
    expect(manager.getNearEnemyQuery().enemies.every((enemy) => enemy.lodTier === 'near')).toBe(true);
  });

  it('deactivates expired enemy projectiles so pooled bodies stop overlapping the player', () => {
    const manager = createEnemyManagerHarness();
    const projectile = {
      active: true,
      body: { enable: true, velocity: { x: 50, y: -10 } },
      expiresAt: 10,
      setActive: vi.fn(function setActive(value) {
        this.active = value;
        return this;
      }),
      setVelocity: vi.fn(function setVelocity(x, y) {
        this.body.velocity = { x, y };
        return this;
      }),
      setVisible: vi.fn(function setVisible(value) {
        this.visible = value;
        return this;
      }),
      visible: true
    };
    manager.enemyProjectileGroup.children.iterate.mockImplementation((callback) => callback(projectile));
    manager.getLivingEnemies = vi.fn().mockReturnValue([]);

    manager.update(16, 60, 10);

    expect(projectile.active).toBe(false);
    expect(projectile.body.enable).toBe(false);
    expect(projectile.visible).toBe(false);
  });

  it('computes initial intent immediately for newly seen distant enemies', () => {
    const manager = createEnemyManagerHarness();
    const farEnemy = makeEnemy({ x: 1400, y: 0, speed: 100 });
    delete farEnemy.cachedMoveX;
    delete farEnemy.cachedMoveY;
    delete farEnemy.cachedWantsToShoot;
    manager.getLivingEnemies = vi.fn().mockReturnValue([farEnemy]);

    manager.update(16, 60, 1000);

    expect(farEnemy.setVelocity).toHaveBeenCalledWith(-100, 0);
  });

  it('reuses cached intent for far enemies between cadence ticks', () => {
    const manager = createEnemyManagerHarness();
    const farEnemy = makeEnemy({ x: 1400, y: 0 });
    farEnemy.cachedMoveX = -0.4;
    farEnemy.cachedMoveY = 0.2;
    manager.getLivingEnemies = vi.fn().mockReturnValue([farEnemy]);

    manager.frameIndex = 1;
    manager.update(16, 60, 1000);

    expect(farEnemy.setVelocity).toHaveBeenCalledWith(
      farEnemy.cachedMoveX * farEnemy.speed,
      farEnemy.cachedMoveY * farEnemy.speed
    );
  });

  it('only advances animated textures when the animation timer ticks', () => {
    const manager = createEnemyManagerHarness();
    const enemy = makeEnemy({ x: 80, y: 0, visualFrames: ['a', 'b', 'c'] });
    manager.getLivingEnemies = vi.fn().mockReturnValue([enemy]);

    manager.nextAnimationStepAt = 1000;
    manager.update(16, 60, 999);
    manager.update(16, 60, 1000);

    expect(enemy.setTexture).toHaveBeenCalledTimes(1);
  });

  it('keeps the initial spawn frame visible until the first shared animation step elapses', () => {
    const manager = createEnemyManagerHarness();
    const enemy = makeEnemy({ x: 80, y: 0, visualFrames: ['a', 'b', 'c'] });
    manager.getLivingEnemies = vi.fn().mockReturnValue([enemy]);

    manager.update(16, 60, 0);
    manager.update(16, 60, 119);
    manager.update(16, 60, 120);

    expect(enemy.setTexture).toHaveBeenCalledTimes(1);
    expect(enemy.setTexture).toHaveBeenCalledWith('b');
  });
});
