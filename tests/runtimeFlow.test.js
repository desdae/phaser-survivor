import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {},
    Input: {
      Keyboard: {
        JustDown: () => false,
        KeyCodes: {}
      }
    },
    Scale: {
      RESIZE: 'RESIZE',
      CENTER_BOTH: 'CENTER_BOTH'
    }
  }
}));

import { GameScene } from '../src/game/scenes/GameScene.js';
import { PickupManager } from '../src/game/systems/PickupManager.js';
import { ELITE_WAVE_INTERVAL_MS } from '../src/game/logic/eliteWaves.js';

describe('GameScene createTextures', () => {
  it('generates the reward chest texture', () => {
    const generateTexture = vi.fn();
    const graphics = {
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillCircle: vi.fn(),
      fillEllipse: vi.fn(),
      fillRect: vi.fn(),
      fillTriangle: vi.fn(),
      lineBetween: vi.fn(),
      lineStyle: vi.fn(),
      strokeRect: vi.fn(),
      strokeCircle: vi.fn(),
      strokeTriangle: vi.fn(),
      generateTexture,
      destroy: vi.fn()
    };
    const sceneLike = {
      add: {
        graphics: () => graphics
      },
      textures: {
        exists: () => false
      }
    };

    GameScene.prototype.createTextures.call(sceneLike);

    expect(generateTexture).toHaveBeenCalledWith('reward-chest', 28, 22);
  });
});

describe('GameScene openLevelUp', () => {
  it('pauses gameplay without zeroing in-flight projectiles', () => {
    const sceneLike = {
      isGameplayPaused: false,
      physics: {
        world: {
          pause: vi.fn()
        }
      },
      player: {
        stats: { level: 2 },
        stop: vi.fn()
      },
      enemyManager: {
        stopAll: vi.fn()
      },
      projectileManager: {
        stopAll: vi.fn()
      },
      levelUpOverlay: {
        show: vi.fn()
      },
      upgradeSystem: {
        getChoices: vi.fn().mockReturnValue([{ key: 'damage' }])
      }
    };

    GameScene.prototype.openLevelUp.call(sceneLike);

    expect(sceneLike.physics.world.pause).toHaveBeenCalledOnce();
    expect(sceneLike.player.stop).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.stopAll).not.toHaveBeenCalled();
    expect(sceneLike.projectileManager.stopAll).not.toHaveBeenCalled();
    expect(sceneLike.levelUpOverlay.show).toHaveBeenCalledWith([{ key: 'damage' }]);
  });
});

describe('GameScene openChestReward', () => {
  it('pauses gameplay and shows rolled chest rewards', () => {
    const sceneLike = {
      isGameplayPaused: false,
      physics: {
        world: {
          pause: vi.fn()
        }
      },
      player: {
        stats: { level: 2 },
        stop: vi.fn()
      },
      enemyManager: {
        stopAll: vi.fn()
      },
      projectileManager: {
        stopAll: vi.fn()
      },
      chestOverlay: {
        show: vi.fn()
      },
      chestRewardSystem: {
        getChoices: vi.fn().mockReturnValue([{ key: 'arsenalDraft' }])
      }
    };

    GameScene.prototype.openChestReward.call(sceneLike);

    expect(sceneLike.isGameplayPaused).toBe(true);
    expect(sceneLike.physics.world.pause).toHaveBeenCalledOnce();
    expect(sceneLike.player.stop).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.stopAll).not.toHaveBeenCalled();
    expect(sceneLike.projectileManager.stopAll).not.toHaveBeenCalled();
    expect(sceneLike.chestOverlay.show).toHaveBeenCalledWith([{ key: 'arsenalDraft' }]);
  });
});

describe('GameScene handlePickupCollected', () => {
  it('does not open the chest reward overlay while another pause overlay is active', () => {
    const sceneLike = {
      activePauseOverlay: 'levelUp',
      audioManager: {
        playChestOpen: vi.fn()
      },
      isGameOver: false,
      isGameplayPaused: true,
      openChestReward: vi.fn(),
      player: {
        heal: vi.fn(),
        gainXp: vi.fn()
      },
      refreshHud: vi.fn()
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'chest',
      rewardSeed: 'ogre'
    });

    expect(result).toBe(false);
    expect(sceneLike.audioManager.playChestOpen).not.toHaveBeenCalled();
    expect(sceneLike.openChestReward).not.toHaveBeenCalled();
  });

  it('special-cases chest pickups and opens the chest reward overlay', () => {
    const sceneLike = {
      audioManager: {
        playChestOpen: vi.fn()
      },
      isGameOver: false,
      openChestReward: vi.fn(),
      player: {
        heal: vi.fn(),
        gainXp: vi.fn()
      },
      refreshHud: vi.fn()
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'chest',
      rewardSeed: 'ogre'
    });

    expect(result).toBe(true);
    expect(sceneLike.audioManager.playChestOpen).toHaveBeenCalledOnce();
    expect(sceneLike.openChestReward).toHaveBeenCalledWith({ kind: 'chest', rewardSeed: 'ogre' });
    expect(sceneLike.player.heal).not.toHaveBeenCalled();
    expect(sceneLike.player.gainXp).not.toHaveBeenCalled();
  });

  it('plays level-up audio when xp gain levels the player', () => {
    const sceneLike = {
      audioManager: {
        playLevelUp: vi.fn()
      },
      isGameOver: false,
      openLevelUp: vi.fn(),
      player: {
        gainXp: vi.fn().mockReturnValue({ leveledUp: true }),
        heal: vi.fn()
      },
      refreshHud: vi.fn()
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'xp',
      value: 7
    });

    expect(result).toBe(true);
    expect(sceneLike.audioManager.playLevelUp).toHaveBeenCalledOnce();
    expect(sceneLike.openLevelUp).toHaveBeenCalledOnce();
  });

  it('plays pickup audio for heart pickups', () => {
    const sceneLike = {
      audioManager: {
        playPickup: vi.fn()
      },
      isGameOver: false,
      openChestReward: vi.fn(),
      player: {
        gainXp: vi.fn(),
        heal: vi.fn()
      },
      refreshHud: vi.fn()
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'heart',
      value: 10
    });

    expect(result).toBe(false);
    expect(sceneLike.audioManager.playPickup).toHaveBeenCalledOnce();
    expect(sceneLike.player.heal).toHaveBeenCalledWith(10);
  });
});

describe('GameScene update', () => {
  it('passes the near-only query to local combat systems while keeping the full living snapshot', () => {
    const returnedEnemies = [{ active: true, id: 'returned' }];
    const fallbackEnemies = [{ active: true, id: 'fallback' }];
    const nearQuery = {
      cellSize: 96,
      cells: new Map(),
      enemies: [{ active: true, id: 'near-1' }],
      enemiesByTier: { near: [{ active: true, id: 'near-1' }], mid: [], far: [] }
    };
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      elapsedMs: 0,
      enemyManager: {
        getLivingEnemies: vi.fn().mockReturnValue(fallbackEnemies),
        getNearEnemyQuery: vi.fn().mockReturnValue(nearQuery),
        update: vi.fn().mockReturnValue(returnedEnemies)
      },
      handleStatsToggle: vi.fn(),
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: {
          bladeCount: 0,
          pickupRadius: 48
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      scale: {
        width: 1280,
        height: 720
      },
      statsKey: {},
      updateEliteWave: vi.fn(),
      audioManager: {},
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      input: {
        keyboard: {
          addCapture: vi.fn()
        }
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.projectileManager.tryFire).toHaveBeenCalledWith(sceneLike.player, nearQuery, 16);
    expect(sceneLike.bladeManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.chainManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.novaManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.boomerangManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.meteorManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.enemyManager.getLivingEnemies).not.toHaveBeenCalled();
  });

  it('plays warning audio first, then spawns the elite after the warning window ends', () => {
    const eliteState = {
      pendingElite: false,
      warningUntilMs: 0,
      nextEliteAtMs: ELITE_WAVE_INTERVAL_MS
    };
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      audioManager: {
        playEliteWarning: vi.fn()
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      elapsedMs: ELITE_WAVE_INTERVAL_MS,
      enemyManager: {
        getLivingEnemies: vi.fn().mockReturnValue([]),
        pickEnemyType: vi.fn().mockReturnValue('basic'),
        spawnEnemy: vi.fn(),
        update: vi.fn()
      },
      handleStatsToggle: vi.fn(),
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: {
          bladeCount: 0,
          bladeUnlocked: false,
          boomerangUnlocked: false,
          chainUnlocked: false,
          level: 1,
          meteorUnlocked: false,
          novaUnlocked: false,
          pickupRadius: 48,
          projectileCount: 1,
          health: 100,
          maxHealth: 100,
          xp: 0,
          xpToNext: 10
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        stopAll: vi.fn(),
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      scale: {
        width: 1280,
        height: 720
      },
      updateEliteWave: GameScene.prototype.updateEliteWave,
      statsKey: {},
      input: {
        keyboard: {
          addCapture: vi.fn()
        }
      },
      time: {
        now: ELITE_WAVE_INTERVAL_MS
      },
      upgradeKeys: [],
      eliteWaveSystem: {
        state: eliteState,
        update: vi.fn().mockImplementation((elapsedMs) => {
          if (!eliteState.pendingElite) {
            eliteState.pendingElite = true;
            eliteState.warningUntilMs = elapsedMs + 3000;
            eliteState.nextEliteAtMs = ELITE_WAVE_INTERVAL_MS * 2;
          }
          return eliteState;
        }),
        isWarningActive: vi.fn().mockImplementation((nowMs) => nowMs <= eliteState.warningUntilMs),
        consumeSpawn: vi.fn(),
      }
    };

    GameScene.prototype.update.call(sceneLike, ELITE_WAVE_INTERVAL_MS, 16);

    expect(sceneLike.audioManager.playEliteWarning).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.spawnEnemy).not.toHaveBeenCalled();
    expect(sceneLike.eliteWaveSystem.consumeSpawn).not.toHaveBeenCalled();

    sceneLike.enemyManager.spawnEnemy.mockClear();
    sceneLike.audioManager.playEliteWarning.mockClear();
    sceneLike.eliteWaveSystem.consumeSpawn.mockClear();

    GameScene.prototype.update.call(sceneLike, ELITE_WAVE_INTERVAL_MS + 4000, 4000);

    expect(sceneLike.audioManager.playEliteWarning).not.toHaveBeenCalled();
    expect(sceneLike.enemyManager.pickEnemyType).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.spawnEnemy).toHaveBeenCalledWith('basic', { elite: true });
    expect(sceneLike.eliteWaveSystem.consumeSpawn).toHaveBeenCalledOnce();
  });

  it('still refreshes the hud using the full living enemy count while local systems use the near query', () => {
    const nearQuery = {
      cellSize: 96,
      cells: new Map(),
      enemies: [{ active: true, id: 'near-1' }],
      enemiesByTier: { near: [{ active: true, id: 'near-1' }], mid: [], far: [] }
    };
    const livingEnemies = Array.from({ length: 3000 }, (_, index) => ({
      active: true,
      id: `enemy-${index}`
    }));
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      elapsedMs: 0,
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue(nearQuery),
        update: vi.fn().mockReturnValue(livingEnemies)
      },
      handleStatsToggle: vi.fn(),
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: {
          bladeCount: 0,
          pickupRadius: 48
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      scale: {
        width: 1280,
        height: 720
      },
      statsKey: {},
      updateEliteWave: vi.fn(),
      audioManager: {},
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      input: {
        keyboard: {
          addCapture: vi.fn()
        }
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.projectileManager.tryFire).toHaveBeenCalledWith(sceneLike.player, nearQuery, 16);
    expect(sceneLike.refreshHud).toHaveBeenCalledWith(3000);
  });
});

describe('GameScene openGameOver', () => {
  it('plays game over audio when the run ends', () => {
    const sceneLike = {
      activePauseOverlay: 'levelUp',
      audioManager: {
        playGameOver: vi.fn()
      },
      chestOverlay: {
        hide: vi.fn()
      },
      elapsedMs: 12000,
      enemyManager: {
        stopAll: vi.fn()
      },
      gameOverOverlay: {
        show: vi.fn()
      },
      isGameOver: false,
      isGameplayPaused: false,
      levelUpOverlay: {
        hide: vi.fn()
      },
      physics: {
        world: {
          pause: vi.fn()
        }
      },
      player: {
        stats: { level: 4 },
        stop: vi.fn()
      },
      projectileManager: {
        stopAll: vi.fn()
      }
    };

    GameScene.prototype.openGameOver.call(sceneLike);

    expect(sceneLike.audioManager.playGameOver).toHaveBeenCalledOnce();
    expect(sceneLike.gameOverOverlay.show).toHaveBeenCalledWith({ level: 4, timeMs: 12000 });
  });
});

describe('PickupManager update', () => {
  it('stops collecting more orbs after a level-up is triggered', () => {
    const scene = {
      physics: {
        add: {
          group: () => ({
            getChildren: () => []
          })
        }
      }
    };
    const onCollect = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    const manager = new PickupManager(scene, onCollect);
    const firstOrb = {
      active: true,
      x: 10,
      y: 0,
      value: 4,
      setVelocity: vi.fn(),
      destroy: vi.fn()
    };
    const secondOrb = {
      active: true,
      x: 12,
      y: 0,
      value: 5,
      setVelocity: vi.fn(),
      destroy: vi.fn()
    };

    manager.group = {
      getChildren: () => [firstOrb, secondOrb]
    };

    manager.update({ x: 0, y: 0 }, 48);

    expect(onCollect).toHaveBeenCalledTimes(1);
    expect(firstOrb.destroy).toHaveBeenCalledOnce();
    expect(secondOrb.destroy).not.toHaveBeenCalled();
  });

  it('passes heart pickups through without triggering a pause', () => {
    const scene = {
      physics: {
        add: {
          group: () => ({
            getChildren: () => []
          })
        }
      }
    };
    const onCollect = vi.fn().mockReturnValue(false);
    const manager = new PickupManager(scene, onCollect);
    const heart = {
      active: true,
      kind: 'heart',
      value: 10,
      x: 12,
      y: 4,
      setVelocity: vi.fn(),
      destroy: vi.fn()
    };

    manager.group = {
      getChildren: () => [heart]
    };

    manager.update({ x: 0, y: 0 }, 48);

    expect(onCollect).toHaveBeenCalledWith({ kind: 'heart', value: 10 });
    expect(heart.destroy).toHaveBeenCalledOnce();
  });

  it('collects chest pickups once chest rewards are wired', () => {
    const scene = {
      physics: {
        add: {
          group: () => ({
            getChildren: () => []
          })
        }
      }
    };
    const onCollect = vi.fn();
    const manager = new PickupManager(scene, onCollect);
    const chest = {
      active: true,
      kind: 'chest',
      value: 0,
      rewardSeed: 'bat',
      x: 12,
      y: 4,
      setVelocity: vi.fn(),
      destroy: vi.fn()
    };

    manager.group = {
      getChildren: () => [chest]
    };

    manager.update({ x: 0, y: 0 }, 48);

    expect(onCollect).toHaveBeenCalledWith({ kind: 'chest', value: 0, rewardSeed: 'bat' });
    expect(chest.destroy).toHaveBeenCalledOnce();
  });
});
