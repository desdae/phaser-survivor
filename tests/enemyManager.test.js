import { describe, expect, it, vi } from 'vitest';
import { createBossVisualState } from '../src/game/logic/bossVisuals.js';
import { getEliteModifiers } from '../src/game/logic/eliteWaves.js';
import { PickupManager } from '../src/game/systems/PickupManager.js';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

vi.mock('../src/game/logic/spawn.js', () => ({
  getSpawnPosition: () => ({ x: 120, y: 80 }),
  getSpawnProfile: () => ({
    cooldownMs: 999,
    batchSize: 1,
    weights: {
      skeleton: 1,
      zombie: 0,
      bat: 0,
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
    key: 'skeleton',
    frames: ['mob-skeleton-0'],
    frameDurationMs: 150,
    scale: 0.98
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

function makeBossLayerSprite() {
  return {
    destroy: vi.fn(),
    setAlpha: vi.fn(function setAlpha(value) {
      this.alpha = value;
      return this;
    }),
    setDepth: vi.fn(function setDepth(value) {
      this.depth = value;
      return this;
    }),
    setOrigin: vi.fn(function setOrigin(x, y) {
      this.origin = { x, y };
      return this;
    }),
    setPosition: vi.fn(function setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }),
    setScale: vi.fn(function setScale(value) {
      this.scale = value;
      return this;
    }),
    setVisible: vi.fn(function setVisible(value) {
      this.visible = value;
      return this;
    }),
    visible: false
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
    const makeBarRect = () => ({
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn()
    });
    const createdEnemy = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTintFill: vi.fn()
    };
    const scene = {
      add: {
        rectangle: vi.fn(() => makeBarRect())
      },
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

    const enemy = manager.spawnEnemy('skeleton', { elite: true });

    expect(enemy).toBe(createdEnemy);
    expect(enemy.isElite).toBe(true);
    expect(enemy.health).toBe(Math.round(34 * modifiers.healthMultiplier));
    expect(enemy.xpValue).toBe(Math.round(4 * modifiers.xpMultiplier));
    expect(enemy.contactDamage).toBe(Math.round(8 * modifiers.contactDamageMultiplier));
    expect(enemy.setScale).toHaveBeenCalledWith(0.98 * modifiers.scaleMultiplier);
    expect(enemy.setTintFill).toHaveBeenCalledWith(modifiers.tint);
    expect(enemy.eliteHealthBarFrame).toBeTruthy();
    expect(enemy.eliteHealthBarFill).toBeTruthy();
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

  it('cleans up elite hp bar visuals when an elite dies', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const eliteHealthBarFrame = { destroy: vi.fn() };
    const eliteHealthBarFill = { destroy: vi.fn() };
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
      { spawnChest: vi.fn(), spawnOrb: vi.fn() },
      null,
      () => 1
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      eliteHealthBarFill,
      eliteHealthBarFrame,
      health: 10,
      isElite: true,
      setTintFill: vi.fn(),
      type: 'spitter',
      x: 64,
      xpValue: 5,
      y: 96
    };

    manager.damageEnemy(enemy, 12);

    expect(eliteHealthBarFrame.destroy).toHaveBeenCalledOnce();
    expect(eliteHealthBarFill.destroy).toHaveBeenCalledOnce();
  });

  it('spawns a necromancer boss with boss markers and large health', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setVelocity: vi.fn(),
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
    enemyGroup.create = vi.fn((x, y) => {
      createdBoss.x = x;
      createdBoss.y = y;
      return createdBoss;
    });
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    const boss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    expect(boss.isBoss).toBe(true);
    expect(boss.bossName).toBe('Necromancer');
    expect(boss.health).toBeGreaterThanOrEqual(1400);
    expect(boss.maxHealth).toBe(boss.health);
    expect(boss.setScale).toHaveBeenCalledWith(0.98 * 1.5);
    expect(boss.setScale.mock.calls.at(-1)?.[0]).toBeGreaterThan(1.4);
    expect(boss.setTintFill).not.toHaveBeenCalled();
  });

  it('does not apply the necromancer scale boost to a different boss-shaped spawn', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setVelocity: vi.fn(),
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
    enemyGroup.create = vi.fn((x, y) => {
      createdBoss.x = x;
      createdBoss.y = y;
      return createdBoss;
    });
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    manager.spawnEnemy('skeleton', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    expect(createdBoss.setScale).toHaveBeenCalledWith(0.98);
    expect(createdBoss.setScale.mock.calls.at(-1)?.[0]).toBeLessThan(1.4);
    expect(createdBoss.bossName).toBeUndefined();
    expect(createdBoss.setTintFill).not.toHaveBeenCalled();
    expect(createdBoss.auraSprite).toBeUndefined();
    expect(createdBoss.visualState).toBeUndefined();
  });

  it('does not run necromancer boss combat patterns for a generic boss-shaped spawn', () => {
    const manager = createEnemyManagerHarness();
    const boss = makeEnemy({ x: 320, y: 160, speed: 92, visualFrames: ['mob-skeleton-0'] });
    boss.attackCooldownMs = 1400;
    boss.bossName = 'Necromancer';
    boss.cachedWantsToShoot = false;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextGravePulseAt = 0;
    boss.nextShotAt = 0;
    boss.nextSummonAt = 0;
    boss.preferredRange = undefined;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'skeleton';
    manager.fireEnemyProjectile = vi.fn();
    manager.spawnEnemy = vi.fn();
    manager.playBossBurst = vi.fn();
    manager.player.sprite = { x: 320, y: 160 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 400);

    expect(manager.fireEnemyProjectile).not.toHaveBeenCalled();
    expect(manager.spawnEnemy).not.toHaveBeenCalled();
    expect(manager.playBossBurst).not.toHaveBeenCalled();
    expect(manager.player.takeDamage).not.toHaveBeenCalled();
    expect(boss.visualState).toBeUndefined();
  });

  it('creates necromancer boss visual layers in idle state when spawning', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setVelocity: vi.fn(),
      setTintFill: vi.fn()
    };
    const imageSprites = [];
    const scene = {
      add: {
        image: vi.fn((x, y, key) => {
          const sprite = makeBossLayerSprite();
          sprite.key = key;
          sprite.setPosition(x, y);
          imageSprites.push(sprite);
          return sprite;
        })
      },
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
      },
      time: {
        now: 1234
      }
    };
    enemyGroup.create = vi.fn((x, y) => {
      createdBoss.x = x;
      createdBoss.y = y;
      return createdBoss;
    });
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    const boss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    expect(boss.visualState).toEqual(createBossVisualState('necromancerBoss', 1234));
    expect(scene.add.image).toHaveBeenCalledTimes(3);
    expect(boss.auraSprite).toBe(imageSprites[0]);
    expect(boss.eyeGlowSprite).toBe(imageSprites[1]);
    expect(boss.chestGlowSprite).toBe(imageSprites[2]);
    expect(boss.auraSprite.visible).toBe(true);
    expect(boss.eyeGlowSprite.visible).toBe(true);
    expect(boss.chestGlowSprite.visible).toBe(true);
  });

  it('keeps dedicated eye and chest glow layer keys for the necromancer overlays', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setVelocity: vi.fn(),
      setTintFill: vi.fn()
    };
    const scene = {
      add: {
        image: vi.fn(() => makeBossLayerSprite())
      },
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
      },
      textures: {
        exists: vi.fn((key) =>
          ['boss-necro-aura', 'boss-necro-eyes', 'boss-necro-chest'].includes(key)
        )
      },
      time: {
        now: 1234
      }
    };
    enemyGroup.create = vi.fn((x, y) => {
      createdBoss.x = x;
      createdBoss.y = y;
      return createdBoss;
    });

    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    expect(scene.add.image).toHaveBeenNthCalledWith(1, 320, 160, 'boss-necro-aura');
    expect(scene.add.image).toHaveBeenNthCalledWith(2, 320, 160, 'boss-necro-eyes');
    expect(scene.add.image).toHaveBeenNthCalledWith(3, 320, 160, 'boss-necro-chest');
  });

  it('updates necromancer boss visual layers with the boss position and a light pulse', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setTintFill: vi.fn(),
      setVelocity: vi.fn()
    };
    const manager = new EnemyManager(
      {
        add: {
          image: vi.fn(() => makeBossLayerSprite())
        },
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
          now: 0
        }
      },
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn() }
    );
    manager.enemyProjectileGroup.children = {
      iterate: vi.fn()
    };
    enemyGroup.create = vi.fn((x, y) => {
      createdBoss.x = x;
      createdBoss.y = y;
      return createdBoss;
    });
    const boss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 100, y: 120 }
    });

    boss.active = true;
    boss.x = 132;
    boss.y = 144;
    boss.nextShotAt = Number.POSITIVE_INFINITY;
    boss.nextSummonAt = Number.POSITIVE_INFINITY;
    boss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 60, 1800);

    expect(boss.auraSprite).toBeTruthy();
    expect(boss.eyeGlowSprite).toBeTruthy();
    expect(boss.chestGlowSprite).toBeTruthy();
    expect(boss.auraSprite.setPosition).toHaveBeenLastCalledWith(132, 144);
    expect(boss.eyeGlowSprite.setPosition).toHaveBeenLastCalledWith(132, 144);
    expect(boss.chestGlowSprite.setPosition).toHaveBeenLastCalledWith(132, 144);
    expect(boss.auraSprite.setAlpha).toHaveBeenCalled();
    expect(boss.eyeGlowSprite.setScale).toHaveBeenCalled();
    expect(boss.chestGlowSprite.setAlpha).toHaveBeenCalled();
  });

  it('destroys necromancer boss visual layers on death', () => {
    const enemyGroup = { id: 'enemies' };
    const projectileGroup = { id: 'enemy-projectiles' };
    const scheduledCalls = [];
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setTintFill: vi.fn()
    };
    const scene = {
      add: {
        image: vi.fn(() => makeBossLayerSprite())
      },
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
        delayedCall: vi.fn((delay, callback) => {
          scheduledCalls.push({ callback, delay });
        })
      }
    };
    enemyGroup.create = vi.fn(() => createdBoss);
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });
    const boss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    const auraSprite = boss.auraSprite;
    const eyeGlowSprite = boss.eyeGlowSprite;
    const chestGlowSprite = boss.chestGlowSprite;
    boss.active = true;
    boss.health = 1;

    const died = manager.damageEnemy(boss, 10);

    expect(died).toBe(true);
    expect(auraSprite).toBeTruthy();
    expect(eyeGlowSprite).toBeTruthy();
    expect(chestGlowSprite).toBeTruthy();
    const deathCleanup = scheduledCalls.find((entry) => entry.delay === 700);

    expect(deathCleanup).toBeTruthy();
    expect(auraSprite.destroy).not.toHaveBeenCalled();
    expect(eyeGlowSprite.destroy).not.toHaveBeenCalled();
    expect(chestGlowSprite.destroy).not.toHaveBeenCalled();

    deathCleanup.callback();

    expect(auraSprite.destroy).toHaveBeenCalledOnce();
    expect(eyeGlowSprite.destroy).toHaveBeenCalledOnce();
    expect(chestGlowSprite.destroy).toHaveBeenCalledOnce();
    expect(boss.auraSprite).toBeNull();
    expect(boss.eyeGlowSprite).toBeNull();
    expect(boss.chestGlowSprite).toBeNull();
  });

  it('marks boss death separately from normal elite cleanup', () => {
    const manager = createEnemyManagerHarness();
    manager.playBossBurst = vi.fn();
    const boss = {
      active: true,
      bossName: 'Necromancer',
      destroy: vi.fn(),
      health: 10,
      isBoss: true,
      setTintFill: vi.fn(),
      type: 'necromancerBoss',
      x: 64,
      xpValue: 20,
      y: 96
    };

    manager.damageEnemy(boss, 12, 'meteor');

    expect(manager.lastBossDeath).toBeUndefined();
    expect(manager.playBossBurst).toHaveBeenCalledWith(
      'boss-necro-death-burst',
      64,
      96,
      expect.objectContaining({
        tint: 0xffb1d8
      })
    );
    expect(manager.scene.time.delayedCall).toHaveBeenCalledOnce();

    const [, deathCleanupCallback] = manager.scene.time.delayedCall.mock.calls[0];
    deathCleanupCallback();

    expect(manager.lastBossDeath).toMatchObject({ type: 'necromancerBoss', x: 64, y: 96 });
  });

  it('does not play the necromancer death burst for a generic boss-shaped spawn', () => {
    const manager = createEnemyManagerHarness();
    manager.playBossBurst = vi.fn();
    const boss = {
      active: true,
      destroy: vi.fn(),
      health: 10,
      isBoss: true,
      setTintFill: vi.fn(),
      type: 'skeleton',
      x: 64,
      xpValue: 20,
      y: 96
    };

    const died = manager.damageEnemy(boss, 12, 'meteor');

    expect(died).toBe(true);
    expect(manager.playBossBurst).not.toHaveBeenCalledWith(
      'boss-necro-death-burst',
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(manager.lastBossDeath).toMatchObject({ type: 'skeleton', x: 64, y: 96 });
  });

  it('splits a poison blob into two mini poison blobs on death', () => {
    const manager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnHeart: vi.fn() },
      null,
      () => 1
    );
    manager.spawnEnemy = vi.fn();
    const enemy = {
      active: true,
      canSplit: true,
      destroy: vi.fn(),
      health: 1,
      setTintFill: vi.fn(),
      type: 'poisonBlob',
      x: 160,
      xpValue: 10,
      y: 220
    };

    manager.damageEnemy(enemy, 5);

    expect(manager.spawnEnemy).toHaveBeenCalledTimes(2);
    expect(manager.spawnEnemy).toHaveBeenNthCalledWith(
      1,
      'miniPoisonBlob',
      expect.objectContaining({
        discover: false,
        position: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
      })
    );
    expect(manager.spawnEnemy).toHaveBeenNthCalledWith(
      2,
      'miniPoisonBlob',
      expect.objectContaining({
        discover: false,
        position: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
      })
    );
  });

  it('does not split mini poison blobs further on death', () => {
    const manager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnHeart: vi.fn() },
      null,
      () => 1
    );
    manager.spawnEnemy = vi.fn();
    const enemy = {
      active: true,
      canSplit: false,
      destroy: vi.fn(),
      health: 1,
      setTintFill: vi.fn(),
      type: 'miniPoisonBlob',
      x: 160,
      xpValue: 4,
      y: 220
    };

    manager.damageEnemy(enemy, 5);

    expect(manager.spawnEnemy).not.toHaveBeenCalled();
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
        type: 'skeleton',
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

  it('uses boss-dark-bolt only for the necromancer boss projectile art', () => {
    const manager = createEnemyManagerHarness();
    const necromancerProjectile = {
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
      setTexture: vi.fn(function setTexture(textureKey) {
        this.texture = { key: textureKey };
        return this;
      }),
      setTintFill: vi.fn(function setTintFill(value) {
        this.tint = value;
        return this;
      }),
      setVelocity: vi.fn(function setVelocity(x, y) {
        this.velocity = { x, y };
        return this;
      })
    };
    const genericBossProjectile = {
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
      setTexture: vi.fn(function setTexture(textureKey) {
        this.texture = { key: textureKey };
        return this;
      }),
      setTintFill: vi.fn(function setTintFill(value) {
        this.tint = value;
        return this;
      }),
      setVelocity: vi.fn(function setVelocity(x, y) {
        this.velocity = { x, y };
        return this;
      })
    };
    manager.getReusableEnemyProjectile = vi
      .fn()
      .mockReturnValueOnce(necromancerProjectile)
      .mockReturnValueOnce(genericBossProjectile);

    manager.fireEnemyProjectile(
      {
        bossName: 'Necromancer',
        isBoss: true,
        projectileDamage: 16,
        projectileSpeed: 220,
        type: 'necromancerBoss',
        x: 40,
        y: 50
      },
      1,
      0,
      1000
    );
    manager.fireEnemyProjectile(
      {
        bossName: 'Necromancer',
        isBoss: true,
        projectileDamage: 10,
        projectileSpeed: 180,
        type: 'skeleton',
        x: 60,
        y: 70
      },
      0,
      1,
      1000
    );

    expect(necromancerProjectile.setTexture).toHaveBeenCalledWith('boss-dark-bolt');
    expect(necromancerProjectile.setTintFill).toHaveBeenCalledWith(0xd4b8ff);
    expect(genericBossProjectile.setTexture).toHaveBeenCalledWith('projectile');
    expect(genericBossProjectile.setTintFill).toHaveBeenCalledWith(0xffa2a2);
  });

  it('keeps necromancer death visuals active until the death presentation window ends before cleanup', () => {
    const now = 1500;
    const scheduledCalls = [];
    const auraSprite = { destroy: vi.fn() };
    const eyeGlowSprite = { destroy: vi.fn() };
    const chestGlowSprite = { destroy: vi.fn() };
    const scene = {
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
        }
      },
      time: {
        now,
        delayedCall: vi.fn((delay, callback) => {
          scheduledCalls.push({ callback, delay });
        })
      }
    };
    const manager = new EnemyManager(
      scene,
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnChest: vi.fn(), spawnPowerup: vi.fn(), spawnHeart: vi.fn() },
      {
        spawnDeathSplash: vi.fn(),
        spawnHitSplash: vi.fn(),
        spawnPuddle: vi.fn()
      },
      () => 1
    );
    manager.playBossBurst = vi.fn();
    const enemy = {
      active: true,
      auraSprite,
      bossHealthBarFill: { destroy: vi.fn() },
      bossHealthBarFrame: { destroy: vi.fn() },
      bossName: 'Necromancer',
      chestGlowSprite,
      destroy: vi.fn(function destroy() {
        this.active = false;
      }),
      eyeGlowSprite,
      health: 8,
      isBoss: true,
      setTexture: vi.fn(function setTexture(textureKey) {
        this.texture = { key: textureKey };
        return this;
      }),
      setTintFill: vi.fn(),
      texture: { key: 'boss-necromancer-idle' },
      type: 'necromancerBoss',
      visualFrames: ['boss-necromancer-idle', 'boss-necromancer-idle-1'],
      visualFrameIndex: 0,
      visualState: createBossVisualState('necromancerBoss', now),
      x: 320,
      xpValue: 40,
      y: 160
    };

    const died = manager.damageEnemy(enemy, 8);

    expect(died).toBe(true);
    expect(enemy.active).toBe(true);
    expect(enemy.setTexture).toHaveBeenCalledWith('boss-necromancer-death');
    expect(enemy.visualState.mode).toBe('death');
    expect(enemy.visualState.untilMs).toBe(now + 700);
    expect(enemy.destroy).not.toHaveBeenCalled();
    expect(auraSprite.destroy).not.toHaveBeenCalled();
    expect(eyeGlowSprite.destroy).not.toHaveBeenCalled();
    expect(chestGlowSprite.destroy).not.toHaveBeenCalled();
    expect(scheduledCalls).toHaveLength(1);
    expect(scheduledCalls[0].delay).toBe(700);

    scheduledCalls[0].callback();

    expect(enemy.destroy).toHaveBeenCalledOnce();
    expect(enemy.active).toBe(false);
    expect(auraSprite.destroy).toHaveBeenCalledOnce();
    expect(eyeGlowSprite.destroy).toHaveBeenCalledOnce();
    expect(chestGlowSprite.destroy).toHaveBeenCalledOnce();
  });

  it('keeps the dying necromancer as the active boss until the delayed death handoff fires', () => {
    const now = 2400;
    const scheduledCalls = [];
    const scene = {
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
        }
      },
      time: {
        now,
        delayedCall: vi.fn((delay, callback) => {
          scheduledCalls.push({ callback, delay });
        })
      }
    };
    const manager = new EnemyManager(
      scene,
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnChest: vi.fn(), spawnPowerup: vi.fn(), spawnHeart: vi.fn() },
      {
        spawnDeathSplash: vi.fn(),
        spawnHitSplash: vi.fn(),
        spawnPuddle: vi.fn()
      },
      () => 1
    );
    const boss = {
      active: true,
      body: { enable: true },
      bossName: 'Necromancer',
      destroy: vi.fn(function destroy() {
        this.active = false;
      }),
      health: 8,
      isBoss: true,
      nextGravePulseAt: 0,
      nextShotAt: 0,
      nextSummonAt: 0,
      setTexture: vi.fn(function setTexture(textureKey) {
        this.texture = { key: textureKey };
        return this;
      }),
      setTintFill: vi.fn(),
      setVelocity: vi.fn(),
      texture: { key: 'boss-necromancer-idle' },
      type: 'necromancerBoss',
      visualFrames: ['boss-necromancer-idle', 'boss-necromancer-idle-1'],
      visualFrameIndex: 0,
      visualState: createBossVisualState('necromancerBoss', now),
      x: 320,
      xpValue: 40,
      y: 160
    };
    manager.group.getChildren.mockReturnValue([boss]);

    manager.damageEnemy(boss, 8);

    expect(boss.isDying).toBe(true);
    expect(boss.contactDamage).toBe(0);
    expect(boss.nextShotAt).toBe(Number.POSITIVE_INFINITY);
    expect(boss.nextSummonAt).toBe(Number.POSITIVE_INFINITY);
    expect(boss.nextGravePulseAt).toBe(Number.POSITIVE_INFINITY);
    expect(boss.body.enable).toBe(false);
    expect(boss.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(manager.getLivingEnemies()).toEqual([]);
    expect(manager.getActiveBoss()).toBe(boss);
    expect(manager.consumeBossDeath()).toBeNull();

    scheduledCalls[0].callback();

    expect(manager.getActiveBoss()).toBeNull();
    expect(manager.consumeBossDeath()).toMatchObject({
      bossName: 'Necromancer',
      type: 'necromancerBoss',
      x: 320,
      y: 160
    });
  });

  it('destroys boss burst layers when tween completion fires', () => {
    const outerBurst = {
      destroy: vi.fn(),
      setAlpha: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis()
    };
    const innerBurst = {
      destroy: vi.fn(),
      setAlpha: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis()
    };
    const tweensAdd = vi.fn((config) => {
      config.onComplete?.();
      return config;
    });
    const scene = {
      add: {
        image: vi
          .fn()
          .mockReturnValueOnce(outerBurst)
          .mockReturnValueOnce(innerBurst)
      },
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
        }
      },
      tweens: {
        add: tweensAdd
      }
    };
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    manager.playBossBurst('boss-necro-summon-burst', 100, 120);

    expect(scene.add.image).toHaveBeenCalledTimes(2);
    expect(tweensAdd).toHaveBeenCalledTimes(2);
    expect(outerBurst.destroy).toHaveBeenCalledOnce();
    expect(innerBurst.destroy).toHaveBeenCalledOnce();
  });

  it('falls back to delayed cleanup when tweens are unavailable', () => {
    const outerBurst = {
      destroy: vi.fn(),
      setAlpha: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis()
    };
    const innerBurst = {
      destroy: vi.fn(),
      setAlpha: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis()
    };
    const delayedCall = vi.fn((_, callback) => callback());
    const scene = {
      add: {
        image: vi
          .fn()
          .mockReturnValueOnce(outerBurst)
          .mockReturnValueOnce(innerBurst)
      },
      physics: {
        add: {
          collider: vi.fn(),
          group: vi
            .fn()
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
            .mockReturnValueOnce({
              children: { iterate: vi.fn() },
              getChildren: vi.fn().mockReturnValue([])
            })
        }
      },
      time: {
        delayedCall
      }
    };
    const manager = new EnemyManager(scene, { sprite: { x: 0, y: 0 } }, { spawnOrb: vi.fn() });

    manager.playBossBurst('boss-necro-pulse-ring', 80, 90);

    expect(scene.add.image).toHaveBeenCalledTimes(2);
    expect(delayedCall).toHaveBeenCalledTimes(2);
    expect(outerBurst.destroy).toHaveBeenCalledOnce();
    expect(innerBurst.destroy).toHaveBeenCalledOnce();
  });
});

describe('PickupManager update', () => {
  it('forwards buffKey when a temporary powerup is collected', () => {
    const onCollect = vi.fn().mockReturnValue(false);
    const pickups = [];
    const scene = {
      physics: {
        add: {
          group: () => ({
            create: vi.fn((x, y, texture) => {
              const pickup = {
              active: true,
              buffKey: 'frenzy',
              destroy: vi.fn(),
              kind: 'powerup',
              rewardSeed: undefined,
              setDamping: vi.fn(),
              setDepth: vi.fn(),
              setDrag: vi.fn(),
              setMaxVelocity: vi.fn(),
              value: 0,
              x,
              y
              };

              pickups.push(pickup);
              return pickup;
            }),
            getChildren: () => pickups
          })
        }
      }
    };
    const manager = new PickupManager(scene, onCollect);
    const pickup = manager.spawnPowerup(100, 100, 'frenzy');

    manager.update({ x: 100, y: 100 }, 48);

    expect(pickup.buffKey).toBe('frenzy');
    expect(onCollect).toHaveBeenCalledWith({
      kind: 'powerup',
      value: 0,
      buffKey: 'frenzy'
    });
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

  it('drops poison trails that tick the player and expire after five seconds', () => {
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
    const puddleSprite = {
      scene: { sys: {} },
      setAlpha: vi.fn(function setAlpha() {
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
      setScale: vi.fn(function setScale() {
        return this;
      }),
      setVisible: vi.fn(function setVisible(value) {
        this.visible = value;
        return this;
      }),
      visible: false
    };
    const scene = {
      add: {
        image: vi.fn(() => puddleSprite)
      },
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
    const player = {
      sprite: { x: 200, y: 200 },
      takeDamage: vi.fn(() => false)
    };
    const manager = new EnemyManager(scene, player, { spawnOrb: vi.fn() });
    manager.spawnBatch = vi.fn();
    const poisonBlob = {
      active: true,
      cachedMoveX: 0,
      cachedMoveY: 0,
      cachedWantsToShoot: false,
      health: 96,
      hitRadius: 18,
      poisonTickDamage: 2,
      setVelocity: vi.fn(),
      speed: 42,
      texture: { key: 'mob-poison-0' },
      trailDropIntervalMs: 650,
      visualFrames: ['mob-poison-0'],
      x: 200,
      y: 200
    };
    manager.getLivingEnemies = vi
      .fn()
      .mockReturnValueOnce([poisonBlob])
      .mockReturnValueOnce([poisonBlob])
      .mockReturnValueOnce([]);

    manager.update(700, 100, 700);
    manager.update(700, 100, 1400);
    manager.update(5000, 100, 6400);

    expect(manager.poisonPuddles).toHaveLength(1);
    expect(player.takeDamage).toHaveBeenCalledWith(2);
    expect(manager.poisonPuddles[0].active).toBe(false);
    expect(puddleSprite.visible).toBe(false);
  });

  it('applies a one-time frost slow to nearby enemies and lets it expire naturally', () => {
    const manager = createEnemyManagerHarness();
    const nearbyEnemy = makeEnemy({ x: 80, y: 0, speed: 100 });
    nearbyEnemy.cachedMoveX = 1;
    nearbyEnemy.cachedMoveY = 0;
    nearbyEnemy.cachedWantsToShoot = false;
    const farEnemy = makeEnemy({ x: 400, y: 0, speed: 100 });
    farEnemy.cachedMoveX = 1;
    farEnemy.cachedMoveY = 0;
    farEnemy.cachedWantsToShoot = false;
    manager.getLivingEnemies = vi
      .fn()
      .mockReturnValueOnce([nearbyEnemy, farEnemy])
      .mockReturnValueOnce([nearbyEnemy, farEnemy])
      .mockReturnValueOnce([nearbyEnemy, farEnemy]);

    const affectedCount = manager.applyAreaSlow(0, 0, 200, 1000, 20000, 0.5);

    manager.update(16, 60, 1000);
    manager.update(16, 60, 15000);
    manager.update(16, 60, 21001);

    expect(affectedCount).toBe(1);
    expect(nearbyEnemy.setVelocity).toHaveBeenNthCalledWith(1, 50, 0);
    expect(nearbyEnemy.setVelocity).toHaveBeenNthCalledWith(2, 50, 0);
    expect(nearbyEnemy.setVelocity).toHaveBeenNthCalledWith(3, 100, 0);
    expect(farEnemy.setVelocity).toHaveBeenNthCalledWith(1, 100, 0);
    expect(farEnemy.setVelocity).toHaveBeenNthCalledWith(2, 100, 0);
    expect(farEnemy.setVelocity).toHaveBeenNthCalledWith(3, 100, 0);
  });

  it('fires dark bolt volleys and summons minions on cadence', () => {
    const manager = createEnemyManagerHarness();
    manager.playBossBurst = vi.fn();
    manager.player.takeDamage = vi.fn(() => false);
    const boss = makeEnemy({ x: 0, y: 0, speed: 52, visualFrames: ['mob-necromancer-0'] });
    boss.attackCooldownMs = 1400;
    boss.contactDamage = 10;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextGravePulseAt = 0;
    boss.nextShotAt = 0;
    boss.nextSummonAt = 0;
    boss.preferredRange = 260;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'necromancerBoss';
    manager.fireEnemyProjectile = vi.fn();
    manager.spawnEnemy = vi.fn();
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 241000);

    expect(manager.fireEnemyProjectile).toHaveBeenCalled();
    expect(manager.playBossBurst).toHaveBeenCalledWith(
      'boss-necro-summon-burst',
      0,
      0,
      expect.objectContaining({
        tint: 0xbe8bff
      })
    );
    expect(manager.playBossBurst).toHaveBeenCalledWith(
      'boss-necro-pulse-ring',
      0,
      0,
      expect.objectContaining({
        tint: 0xdcb8ff
      })
    );
    expect(manager.spawnEnemy).toHaveBeenCalledWith(
      expect.stringMatching(/skeleton|zombie/),
      expect.objectContaining({ discover: false, summonedByBoss: true })
    );
  });

  it('switches the necromancer into cast mode before firing dark bolts and returns to idle after the cast window', () => {
    const manager = createEnemyManagerHarness();
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setTintFill: vi.fn(),
      setVelocity: vi.fn()
    };
    manager.scene.add = {
      image: vi.fn((x, y, key) => {
        const sprite = makeBossLayerSprite();
        sprite.key = key;
        sprite.setPosition(x, y);
        return sprite;
      })
    };
    manager.group.create = vi.fn(() => createdBoss);
    manager.scene.time.now = 100;
    const fireModes = [];
    manager.fireEnemyProjectile = vi.fn(() => {
      fireModes.push(boss.visualState?.mode);
    });
    manager.getLivingEnemies = vi.fn().mockReturnValue([]);
    const boss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    boss.active = true;
    boss.visualFrames = ['boss-necromancer-idle', 'boss-necromancer-idle-1', 'boss-necromancer-idle-2'];
    boss.nextShotAt = 100;
    boss.nextSummonAt = Number.POSITIVE_INFINITY;
    boss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 100);

    expect(manager.fireEnemyProjectile).toHaveBeenCalledTimes(3);
    expect(fireModes).toEqual(['cast', 'cast', 'cast']);
    expect(boss.visualState.mode).toBe('cast');
    expect(boss.visualState.untilMs).toBe(360);
    expect(boss.setTexture).toHaveBeenCalledWith('boss-necromancer-cast');

    manager.update(16, 240, 361);

    expect(boss.visualState.mode).toBe('idle');
    expect(boss.visualState.effect).toBe('idleAura');
    expect(boss.setTexture).toHaveBeenCalledWith('boss-necromancer-idle');
  });

  it('switches the necromancer into summon mode when summoning and returns to idle after the summon window', () => {
    const manager = createEnemyManagerHarness();
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setTintFill: vi.fn(),
      setVelocity: vi.fn()
    };
    manager.scene.add = {
      image: vi.fn(() => makeBossLayerSprite())
    };
    let createCount = 0;
    manager.group.create = vi.fn(() => {
      createCount += 1;

      if (createCount === 1) {
        return createdBoss;
      }

      return {
        setCircle: vi.fn(),
        setDepth: vi.fn(),
        setScale: vi.fn(),
        setTexture: vi.fn(),
        setVelocity: vi.fn()
      };
    });
    manager.scene.time.now = 200;
    const originalSpawnEnemy = manager.spawnEnemy.bind(manager);
    manager.spawnEnemy = vi.fn((...args) => originalSpawnEnemy(...args));
    manager.fireEnemyProjectile = vi.fn();
    const spawnedBoss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    spawnedBoss.active = true;
    spawnedBoss.visualFrames = ['boss-necromancer-idle', 'boss-necromancer-idle-1', 'boss-necromancer-idle-2'];
    spawnedBoss.nextShotAt = Number.POSITIVE_INFINITY;
    spawnedBoss.nextSummonAt = 200;
    spawnedBoss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    manager.getLivingEnemies = vi.fn().mockReturnValue([spawnedBoss]);

    manager.update(16, 240, 200);

    expect(manager.spawnEnemy).toHaveBeenCalledTimes(3);
    expect(spawnedBoss.visualState.mode).toBe('summon');
    expect(spawnedBoss.visualState.untilMs).toBe(620);
    expect(spawnedBoss.setTexture).toHaveBeenCalledWith('boss-necromancer-summon');

    spawnedBoss.nextShotAt = Number.POSITIVE_INFINITY;
    spawnedBoss.nextSummonAt = Number.POSITIVE_INFINITY;
    spawnedBoss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    manager.update(16, 240, 621);

    expect(spawnedBoss.visualState.mode).toBe('idle');
    expect(spawnedBoss.visualState.effect).toBe('idleAura');
    expect(spawnedBoss.setTexture).toHaveBeenCalledWith('boss-necromancer-idle');
  });

  it('switches the necromancer into pulse mode when grave pulse triggers and returns to idle after the pulse window', () => {
    const manager = createEnemyManagerHarness();
    const createdBoss = {
      clearTint: vi.fn(),
      setCircle: vi.fn(),
      setDepth: vi.fn(),
      setScale: vi.fn(),
      setTexture: vi.fn(),
      setTintFill: vi.fn(),
      setVelocity: vi.fn()
    };
    manager.scene.add = {
      image: vi.fn(() => makeBossLayerSprite())
    };
    manager.group.create = vi.fn(() => createdBoss);
    manager.scene.time.now = 300;
    manager.fireEnemyProjectile = vi.fn();
    const spawnedBoss = manager.spawnEnemy('necromancerBoss', {
      boss: true,
      position: { x: 320, y: 160 }
    });

    spawnedBoss.active = true;
    spawnedBoss.visualFrames = ['boss-necromancer-idle', 'boss-necromancer-idle-1', 'boss-necromancer-idle-2'];
    spawnedBoss.nextShotAt = Number.POSITIVE_INFINITY;
    spawnedBoss.nextSummonAt = Number.POSITIVE_INFINITY;
    spawnedBoss.nextGravePulseAt = 300;
    spawnedBoss.gravePulseRadius = 82;
    spawnedBoss.gravePulseDamage = 14;
    manager.player.sprite = { x: 320, y: 160 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([spawnedBoss]);

    manager.update(16, 240, 300);

    expect(manager.player.takeDamage).toHaveBeenCalledWith(14);
    expect(spawnedBoss.visualState.mode).toBe('pulse');
    expect(spawnedBoss.visualState.untilMs).toBe(520);
    expect(spawnedBoss.setTexture).toHaveBeenCalledWith('boss-necromancer-pulse');

    manager.update(16, 240, 521);

    expect(spawnedBoss.visualState.mode).toBe('idle');
    expect(spawnedBoss.visualState.effect).toBe('idleAura');
    expect(spawnedBoss.setTexture).toHaveBeenCalledWith('boss-necromancer-idle');
  });

  it('keeps overlapped boss actions on the pulse visual priority when multiple abilities are due together', () => {
    const manager = createEnemyManagerHarness();
    const boss = makeEnemy({ x: 320, y: 160, speed: 52, visualFrames: ['mob-necromancer-0'] });
    const fireModes = [];
    const summonModes = [];
    boss.attackCooldownMs = 1400;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextShotAt = 400;
    boss.nextSummonAt = 400;
    boss.nextGravePulseAt = 400;
    boss.preferredRange = 260;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'necromancerBoss';
    manager.fireEnemyProjectile = vi.fn(() => {
      fireModes.push(boss.visualState?.mode);
    });
    manager.spawnEnemy = vi.fn(() => {
      summonModes.push(boss.visualState?.mode);
    });
    manager.player.sprite = { x: 320, y: 160 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 400);

    expect(fireModes).toEqual(['pulse', 'pulse', 'pulse']);
    expect(summonModes).toEqual(['pulse', 'pulse']);
    expect(manager.player.takeDamage).toHaveBeenCalledWith(14);
    expect(manager.fireEnemyProjectile).toHaveBeenCalledTimes(3);
    expect(manager.spawnEnemy).toHaveBeenCalledTimes(2);
    expect(boss.visualState.mode).toBe('pulse');
    expect(boss.visualState.untilMs).toBe(620);
  });

  it('keeps overlapped cast and summon actions on summon visual priority when pulse is not due', () => {
    const manager = createEnemyManagerHarness();
    const boss = makeEnemy({ x: 320, y: 160, speed: 52, visualFrames: ['mob-necromancer-0'] });
    const fireModes = [];
    const summonModes = [];
    boss.attackCooldownMs = 1400;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextShotAt = 400;
    boss.nextSummonAt = 400;
    boss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    boss.preferredRange = 260;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'necromancerBoss';
    manager.fireEnemyProjectile = vi.fn(() => {
      fireModes.push(boss.visualState?.mode);
    });
    manager.spawnEnemy = vi.fn(() => {
      summonModes.push(boss.visualState?.mode);
    });
    manager.player.sprite = { x: 1000, y: 1000 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 400);

    expect(fireModes).toEqual(['summon', 'summon', 'summon']);
    expect(summonModes).toEqual(['summon', 'summon']);
    expect(manager.player.takeDamage).not.toHaveBeenCalled();
    expect(manager.fireEnemyProjectile).toHaveBeenCalledTimes(3);
    expect(manager.spawnEnemy).toHaveBeenCalledTimes(2);
    expect(boss.visualState.mode).toBe('summon');
    expect(boss.visualState.untilMs).toBe(820);
  });

  it('keeps an active pulse visual sticky when lower-priority cast and summon triggers fire later', () => {
    const manager = createEnemyManagerHarness();
    const boss = makeEnemy({ x: 320, y: 160, speed: 52, visualFrames: ['mob-necromancer-0'] });
    const actionModes = [];
    boss.attackCooldownMs = 1400;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextShotAt = 400;
    boss.nextSummonAt = 400;
    boss.nextGravePulseAt = 400;
    boss.preferredRange = 260;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'necromancerBoss';
    manager.fireEnemyProjectile = vi.fn(() => {
      actionModes.push(boss.visualState?.mode);
    });
    manager.spawnEnemy = vi.fn(() => {
      actionModes.push(boss.visualState?.mode);
    });
    manager.player.sprite = { x: 320, y: 160 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 400);

    boss.nextShotAt = 500;
    boss.nextSummonAt = 500;
    boss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    actionModes.length = 0;

    manager.update(16, 240, 500);

    expect(actionModes).toEqual(['pulse', 'pulse', 'pulse', 'pulse', 'pulse']);
    expect(boss.visualState.mode).toBe('pulse');
    expect(boss.visualState.untilMs).toBe(620);
  });

  it('lets a later higher-priority pulse override an active summon visual', () => {
    const manager = createEnemyManagerHarness();
    const boss = makeEnemy({ x: 320, y: 160, speed: 52, visualFrames: ['mob-necromancer-0'] });
    boss.attackCooldownMs = 1400;
    boss.gravePulseCooldownMs = 3200;
    boss.gravePulseDamage = 14;
    boss.gravePulseRadius = 82;
    boss.isBoss = true;
    boss.nextShotAt = Number.POSITIVE_INFINITY;
    boss.nextSummonAt = 400;
    boss.nextGravePulseAt = Number.POSITIVE_INFINITY;
    boss.preferredRange = 260;
    boss.projectileDamage = 16;
    boss.projectileSpeed = 220;
    boss.summonCooldownMs = 5000;
    boss.type = 'necromancerBoss';
    manager.fireEnemyProjectile = vi.fn();
    manager.spawnEnemy = vi.fn();
    manager.player.sprite = { x: 320, y: 160 };
    manager.player.takeDamage = vi.fn(() => false);
    manager.getLivingEnemies = vi.fn().mockReturnValue([boss]);

    manager.update(16, 240, 400);

    expect(boss.visualState.mode).toBe('summon');
    expect(boss.visualState.untilMs).toBe(820);

    boss.nextSummonAt = Number.POSITIVE_INFINITY;
    boss.nextGravePulseAt = 500;

    manager.update(16, 240, 500);

    expect(manager.player.takeDamage).toHaveBeenCalledWith(14);
    expect(boss.visualState.mode).toBe('pulse');
    expect(boss.visualState.untilMs).toBe(720);
  });
});
