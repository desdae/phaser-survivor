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

import Phaser from 'phaser';
import { GameScene } from '../src/game/scenes/GameScene.js';
import { buildWeaponTooltipMap } from '../src/game/logic/weaponTooltips.js';
import { PickupManager } from '../src/game/systems/PickupManager.js';
import { ELITE_WAVE_INTERVAL_MS } from '../src/game/logic/eliteWaves.js';

describe('GameScene createTextures', () => {
  it('generates the projectile, burst rifle bullet, meteor vfx, reward chest, temporary powerup, grass background, blood puddle, and flamethrower textures', () => {
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

    expect(generateTexture).toHaveBeenCalledWith('projectile', 10, 10);
    expect(generateTexture).toHaveBeenCalledWith('burst-rifle-projectile', 16, 10);
    expect(generateTexture).toHaveBeenCalledWith('meteor-fall', 40, 80);
    expect(generateTexture).toHaveBeenCalledWith('meteor-explosion', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('reward-chest', 28, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-frenzy', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-overcharge', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-volley', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('grass-0', 128, 128);
    expect(generateTexture).toHaveBeenCalledWith('grass-15', 128, 128);
    expect(generateTexture).toHaveBeenCalledWith('blood-puddle-0', 64, 48);
    expect(generateTexture).toHaveBeenCalledWith('blood-puddle-7', 64, 48);
    expect(generateTexture).toHaveBeenCalledWith('flame-puff-0', 28, 28);
    expect(generateTexture).toHaveBeenCalledWith('flame-puff-2', 28, 28);
    expect(generateTexture).toHaveBeenCalledWith('flame-smoke-0', 28, 28);
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

describe('GameScene refreshHud', () => {
  it('passes both damage rows and tooltip payloads into the damage stats overlay', () => {
    const sceneLike = {
      elapsedMs: 5000,
      player: {
        stats: {
          projectileDamage: 24,
          fireCooldownMs: 520,
          projectileCount: 1,
          projectilePierce: 0,
          projectileRicochet: 0,
          projectileSpeed: 440
        }
      },
      enemyManager: {
        getLivingEnemies: () => []
      },
      hud: {
        update: vi.fn()
      },
      powerupHud: {
        update: vi.fn()
      },
      temporaryBuffSystem: {
        getSummaryRows: vi.fn().mockReturnValue([])
      },
      eliteWaveSystem: {
        isWarningActive: vi.fn().mockReturnValue(false)
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([{ key: 'projectile', label: 'Auto Shot', totalDamage: 40, dps: 8 }])
      },
      damageStatsOverlay: {
        update: vi.fn()
      }
    };

    GameScene.prototype.refreshHud.call(sceneLike, 0);

    expect(sceneLike.damageStatsOverlay.update).toHaveBeenCalledWith(
      [{ key: 'projectile', label: 'Auto Shot', totalDamage: 40, dps: 8 }],
      buildWeaponTooltipMap(sceneLike.player.stats)
    );
  });
});

describe('GameScene update', () => {
  it('forwards active pointer hover coordinates into the damage stats overlay while the panel is visible', () => {
    const sceneLike = {
      input: {
        activePointer: { x: 980, y: 74, worldX: 0, worldY: 0 }
      },
      damageStatsOverlay: {
        isVisible: vi.fn().mockReturnValue(true),
        hoverPointer: vi.fn()
      },
      syncBackgroundTiles: vi.fn(),
      handleStatsToggle: vi.fn(),
      updateFpsCounter: vi.fn(),
      isGameOver: false,
      isGameplayPaused: true,
      handlePauseHotkeys: vi.fn(),
      refreshHud: vi.fn()
    };

    GameScene.prototype.update.call(sceneLike, 1000, 16);

    expect(sceneLike.damageStatsOverlay.hoverPointer).toHaveBeenCalledWith(980, 74);
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

  it('collects temporary powerups through the temporary buff system', () => {
    const sceneLike = {
      audioManager: {
        playPickup: vi.fn()
      },
      elapsedMs: 9000,
      isGameOver: false,
      refreshHud: vi.fn(),
      temporaryBuffSystem: {
        addStack: vi.fn()
      },
      time: {
        now: 1234
      }
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'powerup',
      buffKey: 'frenzy',
      value: 0
    });

    expect(result).toBe(false);
    expect(sceneLike.audioManager.playPickup).toHaveBeenCalledOnce();
    expect(sceneLike.temporaryBuffSystem.addStack).toHaveBeenCalledWith('frenzy', 9000);
    expect(sceneLike.refreshHud).toHaveBeenCalledOnce();
  });
});

describe('GameScene update', () => {
  it('routes game-over restart hotkeys through the explicit restart helper', () => {
    const justDownSpy = vi.spyOn(Phaser.Input.Keyboard, 'JustDown').mockReturnValue(true);
    const sceneLike = {
      handleStatsToggle: vi.fn(),
      input: {
        activePointer: null
      },
      isGameOver: true,
      restartKey: {},
      restartRun: vi.fn(),
      scene: {
        restart: vi.fn()
      },
      syncBackgroundTiles: vi.fn(),
      updateFpsCounter: vi.fn()
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.restartRun).toHaveBeenCalledOnce();
    expect(sceneLike.scene.restart).not.toHaveBeenCalled();

    justDownSpy.mockRestore();
  });

  it('updates mouseWorld from the active pointer each frame before aimed weapons run', () => {
    const pointer = { worldX: 320, worldY: 180 };
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue([]),
        update: vi.fn().mockReturnValue([])
      },
      handleStatsToggle: vi.fn(),
      input: {
        activePointer: pointer
      },
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: {
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
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockImplementation((stats) => stats),
        update: vi.fn()
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      chainManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      meteorManager: {
        update: vi.fn()
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.mouseWorld).toEqual({ x: 320, y: 180 });
  });

  it('passes effective stats to combat systems while keeping broad and near enemy sources split', () => {
    const returnedEnemies = [{ active: true, id: 'returned' }];
    const fallbackEnemies = [{ active: true, id: 'fallback' }];
    const nearQuery = {
      cellSize: 96,
      cells: new Map(),
      enemies: [{ active: true, id: 'near-1' }],
      enemiesByTier: { near: [{ active: true, id: 'near-1' }], mid: [], far: [] }
    };
    const effectiveStats = {
      bladeCount: 3,
      fireCooldownMs: 400,
      pickupRadius: 72,
      projectileCount: 2
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
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockReturnValue(effectiveStats),
        update: vi.fn()
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

    expect(sceneLike.temporaryBuffSystem.update).toHaveBeenCalledWith(16);
    expect(sceneLike.temporaryBuffSystem.getEffectiveStats).toHaveBeenCalledWith(
      sceneLike.player.stats,
      16
    );
    expect(sceneLike.projectileManager.tryFire).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      returnedEnemies,
      16
    );
    expect(sceneLike.bladeManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.chainManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.novaManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.boomerangManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.meteorManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.bladeManager.syncToPlayer).toHaveBeenCalledWith(effectiveStats);
    expect(sceneLike.pickupManager.update).toHaveBeenCalledWith(sceneLike.player.sprite, 72);
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
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockImplementation((stats) => stats),
        update: vi.fn()
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
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockImplementation((stats) => stats),
        update: vi.fn()
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

    expect(sceneLike.projectileManager.tryFire).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      livingEnemies,
      16
    );
    expect(sceneLike.refreshHud).toHaveBeenCalledWith(3000);
  });

  it('keeps temporary buffs out of permanent player stats across updates', () => {
    const baseStats = Object.freeze({
      bladeCount: 0,
      fireCooldownMs: 520,
      pickupRadius: 48,
      projectileCount: 1
    });
    const buffedStats = {
      ...baseStats,
      pickupRadius: 96,
      projectileCount: 3
    };
    const nearQuery = {
      cellSize: 96,
      cells: new Map(),
      enemies: [],
      enemiesByTier: { near: [], mid: [], far: [] }
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
        getNearEnemyQuery: vi.fn().mockReturnValue(nearQuery),
        update: vi.fn().mockReturnValue([])
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
        stats: baseStats,
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
      temporaryBuffSystem: {
        getEffectiveStats: vi
          .fn()
          .mockReturnValueOnce(buffedStats)
          .mockReturnValueOnce(baseStats),
        update: vi.fn()
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

    expect(sceneLike.temporaryBuffSystem.getEffectiveStats).toHaveBeenNthCalledWith(
      1,
      baseStats,
      16
    );
    expect(sceneLike.temporaryBuffSystem.update).toHaveBeenNthCalledWith(1, 16);
    expect(sceneLike.temporaryBuffSystem.getEffectiveStats.mock.calls[0][0]).toBe(baseStats);
    expect(sceneLike.player.stats).toBe(baseStats);
    expect(sceneLike.player.stats).not.toBe(buffedStats);

    GameScene.prototype.update.call(sceneLike, 30016, 16);

    expect(sceneLike.temporaryBuffSystem.getEffectiveStats).toHaveBeenNthCalledWith(
      2,
      baseStats,
      32
    );
    expect(sceneLike.temporaryBuffSystem.update).toHaveBeenNthCalledWith(2, 32);
    expect(sceneLike.temporaryBuffSystem.getEffectiveStats.mock.calls[1][0]).toBe(baseStats);

    expect(sceneLike.projectileManager.tryFire).toHaveBeenNthCalledWith(
      1,
      sceneLike.player,
      buffedStats,
      [],
      16
    );
    expect(sceneLike.projectileManager.tryFire).toHaveBeenNthCalledWith(
      2,
      sceneLike.player,
      baseStats,
      [],
      30016
    );
    expect(sceneLike.pickupManager.update).toHaveBeenNthCalledWith(1, sceneLike.player.sprite, 96);
    expect(sceneLike.pickupManager.update).toHaveBeenNthCalledWith(2, sceneLike.player.sprite, 48);
    expect(sceneLike.player.stats).toBe(baseStats);
    expect(sceneLike.player.stats).not.toBe(buffedStats);
  });

  it('keeps temporary powerup timing frozen while gameplay is paused', () => {
    const sceneLike = {
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      cameras: {
        main: {
          scrollX: 24,
          scrollY: 48
        }
      },
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      elapsedMs: 12000,
      eliteWaveSystem: {
        isWarningActive: vi.fn().mockReturnValue(false)
      },
      enemyManager: {
        getLivingEnemies: vi.fn().mockReturnValue([])
      },
      fpsCounter: null,
      handlePauseHotkeys: vi.fn(),
      handleStatsToggle: vi.fn(),
      hud: {
        update: vi.fn()
      },
      isGameOver: false,
      isGameplayPaused: true,
      player: {
        stats: {
          health: 100,
          maxHealth: 100,
          level: 3,
          xp: 4,
          xpToNext: 10,
          projectileCount: 2,
          bladeCount: 1,
          bladeUnlocked: true,
          chainUnlocked: false,
          novaUnlocked: false,
          boomerangUnlocked: false,
          meteorUnlocked: false
        }
      },
      powerupHud: {
        update: vi.fn()
      },
      refreshHud: GameScene.prototype.refreshHud,
      restartKey: {},
      temporaryBuffSystem: {
        getSummaryRows: vi.fn().mockReturnValue([]),
        update: vi.fn()
      },
      updateFpsCounter: vi.fn()
    };

    GameScene.prototype.update.call(sceneLike, 999999, 16000);

    expect(sceneLike.handlePauseHotkeys).toHaveBeenCalledOnce();
    expect(sceneLike.temporaryBuffSystem.update).not.toHaveBeenCalled();
    expect(sceneLike.temporaryBuffSystem.getSummaryRows).toHaveBeenCalledWith(12000);
    expect(sceneLike.elapsedMs).toBe(12000);
  });

  it('runs aimed and placed ability managers with the live mouse world position', () => {
    const sceneLike = {
      activePauseOverlay: null,
      arcMineManager: { update: vi.fn() },
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
      burstRifleManager: { update: vi.fn() },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      elapsedMs: 0,
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue([]),
        update: vi.fn().mockReturnValue([])
      },
      flamethrowerManager: { update: vi.fn() },
      handleStatsToggle: vi.fn(),
      input: {
        activePointer: { worldX: 280, worldY: 140 }
      },
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      lanceManager: { update: vi.fn() },
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
          pickupRadius: 48
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      runeTrapManager: { update: vi.fn() },
      scale: {
        width: 1280,
        height: 720
      },
      spearBarrageManager: { update: vi.fn() },
      statsKey: {},
      updateEliteWave: vi.fn(),
      audioManager: {},
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockImplementation((stats) => stats),
        update: vi.fn()
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.burstRifleManager.update).toHaveBeenCalled();
    expect(sceneLike.flamethrowerManager.update).toHaveBeenCalled();
    expect(sceneLike.runeTrapManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      { x: 280, y: 140 },
      16,
      [],
      sceneLike.enemyManager
    );
    expect(sceneLike.lanceManager.update).toHaveBeenCalled();
    expect(sceneLike.arcMineManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      { x: 280, y: 140 },
      16,
      [],
      sceneLike.enemyManager
    );
    expect(sceneLike.spearBarrageManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      { x: 280, y: 140 },
      16,
      [],
      sceneLike.enemyManager
    );
  });
});

describe('GameScene refreshHud', () => {
  it('updates the temporary powerup HUD from active buff summary rows', () => {
    const powerupRows = [{ buffKey: 'frenzy', label: 'Frenzy', stacks: 2, secondsLeft: 18 }];
    const sceneLike = {
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      enemyManager: {
        getLivingEnemies: vi.fn().mockReturnValue([])
      },
      eliteWaveSystem: {
        isWarningActive: vi.fn().mockReturnValue(false)
      },
      elapsedMs: 12000,
      hud: {
        update: vi.fn()
      },
      player: {
        stats: {
          health: 100,
          maxHealth: 100,
          level: 4,
          xp: 3,
          xpToNext: 12,
          projectileCount: 2,
          bladeCount: 1,
          bladeUnlocked: true,
          chainUnlocked: false,
          novaUnlocked: false,
          boomerangUnlocked: false,
          meteorUnlocked: false
        }
      },
      powerupHud: {
        update: vi.fn()
      },
      temporaryBuffSystem: {
        getSummaryRows: vi.fn().mockReturnValue(powerupRows)
      },
      time: {
        now: 16000
      }
    };

    GameScene.prototype.refreshHud.call(sceneLike, 27);

    expect(sceneLike.temporaryBuffSystem.getSummaryRows).toHaveBeenCalledWith(12000);
    expect(sceneLike.powerupHud.update).toHaveBeenCalledWith(powerupRows);
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

describe('GameScene restartRun', () => {
  it('cleans up pause overlays and starts a fresh game scene', () => {
    const sceneLike = {
      activePauseOverlay: 'levelUp',
      chestOverlay: {
        hide: vi.fn()
      },
      gameOverOverlay: {
        hide: vi.fn()
      },
      isGameOver: true,
      isGameplayPaused: true,
      levelUpOverlay: {
        hide: vi.fn()
      },
      physics: {
        world: {
          resume: vi.fn()
        }
      },
      scene: {
        start: vi.fn()
      }
    };

    GameScene.prototype.restartRun.call(sceneLike);

    expect(sceneLike.physics.world.resume).toHaveBeenCalledOnce();
    expect(sceneLike.levelUpOverlay.hide).toHaveBeenCalledOnce();
    expect(sceneLike.chestOverlay.hide).toHaveBeenCalledOnce();
    expect(sceneLike.gameOverOverlay.hide).toHaveBeenCalledOnce();
    expect(sceneLike.activePauseOverlay).toBe(null);
    expect(sceneLike.isGameOver).toBe(false);
    expect(sceneLike.isGameplayPaused).toBe(false);
    expect(sceneLike.scene.start).toHaveBeenCalledWith('game');
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
