import { readFileSync } from 'node:fs';
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
import { getEnemyVisualConfig } from '../src/game/logic/enemyVisuals.js';
import { GameScene } from '../src/game/scenes/GameScene.js';
import { createJournalDiscoveryState } from '../src/game/logic/journalDiscovery.js';
import { buildWeaponTooltipMap } from '../src/game/logic/weaponTooltips.js';
import { PickupManager } from '../src/game/systems/PickupManager.js';
import { ELITE_WAVE_INTERVAL_MS } from '../src/game/logic/eliteWaves.js';

const readmePath = new URL(
  '../src/assets/bosses/necromancer/README.md',
  import.meta.url
);

describe('GameScene createTextures', () => {
  it('generates the projectile, burst rifle bullet, boss bolt, necromancer burst vfx, meteor vfx, reward chest, temporary powerup, grass background, wall, blood puddle, poison blob, poison puddle, and flamethrower textures', () => {
    const generateTexture = vi.fn();
    const graphics = {
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillCircle: vi.fn(),
      fillEllipse: vi.fn(),
      fillRect: vi.fn(),
      fillTriangle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
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
    expect(generateTexture).toHaveBeenCalledWith('boss-dark-bolt', 20, 20);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-summon-burst', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-pulse-ring', 128, 128);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-death-burst', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('meteor-fall', 40, 80);
    expect(generateTexture).toHaveBeenCalledWith('meteor-explosion', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('arc-mine', 36, 36);
    expect(generateTexture).toHaveBeenCalledWith('reward-chest', 28, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-frenzy', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-overcharge', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-volley', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-frost', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('slow-burst-ring', 80, 80);
    expect(generateTexture).toHaveBeenCalledWith('grass-0', 128, 128);
    expect(generateTexture).toHaveBeenCalledWith('grass-15', 128, 128);
    expect(generateTexture).toHaveBeenCalledWith('cobble-wall', 32, 32);
    expect(generateTexture).toHaveBeenCalledWith('blood-puddle-0', 64, 48);
    expect(generateTexture).toHaveBeenCalledWith('blood-puddle-7', 64, 48);
    expect(generateTexture).toHaveBeenCalledWith('mob-poison-0', 40, 40);
    expect(generateTexture).toHaveBeenCalledWith('mob-poison-2', 40, 40);
    expect(generateTexture).toHaveBeenCalledWith('poison-puddle', 40, 40);
    expect(generateTexture).toHaveBeenCalledWith('flame-puff-0', 28, 28);
    expect(generateTexture).toHaveBeenCalledWith('flame-puff-2', 28, 28);
    expect(generateTexture).toHaveBeenCalledWith('flame-smoke-0', 28, 28);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-idle', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-idle-1', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-idle-2', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-cast', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-summon', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-pulse', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-death', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-fallback-idle', 72, 92);
    expect(generateTexture).toHaveBeenCalledWith('boss-necromancer-portrait', 92, 120);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-aura', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-eyes', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-chest', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-summon-burst', 96, 96);
    expect(generateTexture).toHaveBeenCalledWith('boss-necro-pulse-ring', 128, 128);
  });

  it('documents the necromancer boss texture contract in the asset README', () => {
    const readme = readFileSync(readmePath, 'utf8');

    expect(readme).toContain('boss-necromancer-fallback-idle');
    expect(readme).toContain('boss-necromancer-idle');
    expect(readme).toContain('boss-necromancer-idle-1');
    expect(readme).toContain('boss-necromancer-idle-2');
    expect(readme).toContain('boss-necromancer-cast');
    expect(readme).toContain('boss-necromancer-summon');
    expect(readme).toContain('boss-necromancer-pulse');
    expect(readme).toContain('boss-necromancer-death');
    expect(readme).toContain('boss-necro-aura');
    expect(readme).toContain('boss-necro-eyes');
    expect(readme).toContain('boss-necro-chest');
    expect(readme).toContain('procedural fallback');
    expect(readme).toContain('GameScene.createTextures()');
  });
});

describe('enemyVisuals', () => {
  it('points the necromancer boss at the dedicated boss art frame keys', () => {
    expect(getEnemyVisualConfig('necromancerBoss')).toMatchObject({
      key: 'necromancerBoss',
      frames: ['boss-necromancer-idle', 'boss-necromancer-idle-1', 'boss-necromancer-idle-2']
    });
  });
});

describe('GameScene ensureStructureTilePool', () => {
  it('creates reusable wall tiles and disables extras outside the visible structure set', () => {
    const firstTile = {
      body: { enable: true },
      scene: { sys: {} },
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn()
    };
    const secondTile = {
      body: { enable: true },
      scene: { sys: {} },
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn()
    };
    const sceneLike = {
      structureTiles: [firstTile, secondTile],
      wallGroup: {
        create: vi.fn()
      }
    };

    GameScene.prototype.ensureStructureTilePool.call(sceneLike, 1);

    expect(sceneLike.wallGroup.create).not.toHaveBeenCalled();
    expect(secondTile.setVisible).toHaveBeenCalledWith(false);
    expect(secondTile.body.enable).toBe(false);
  });
});

describe('GameScene ensureBackgroundTilePool', () => {
  it('replaces stale destroyed background tiles before syncing textures', () => {
    const freshTile = {
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn()
    };
    const sceneLike = {
      add: {
        image: vi.fn().mockReturnValue(freshTile)
      },
      backgroundTiles: [
        {
          scene: undefined,
          setVisible: vi.fn()
        }
      ]
    };

    GameScene.prototype.ensureBackgroundTilePool.call(sceneLike, 1);

    expect(sceneLike.add.image).toHaveBeenCalledWith(0, 0, 'grass-0');
    expect(sceneLike.backgroundTiles).toEqual([freshTile]);
  });
});

describe('GameScene updatePowerupCompassIndicators', () => {
  it('shows edge-clamped compass icons for off-screen powerups only', () => {
    const makeHudObject = () => ({
      scene: { sys: {} },
      setDepth() {
        return this;
      },
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      setRotation(rotation) {
        this.rotation = rotation;
        return this;
      },
      setScrollFactor() {
        return this;
      },
      setScale() {
        return this;
      },
      setTexture(texture) {
        this.texture = texture;
        return this;
      },
      setVisible(value) {
        this.visible = value;
        return this;
      }
    });
    const sceneLike = {
      add: {
        circle: () => makeHudObject(),
        image: () => makeHudObject(),
        triangle: () => makeHudObject()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      pickupManager: {
        group: {
          getChildren: () => [
            { active: true, kind: 'powerup', buffKey: 'frenzy', x: 2000, y: 360 },
            { active: true, kind: 'powerup', buffKey: 'volley', x: 640, y: 320 }
          ]
        }
      },
      powerupCompassIndicators: [],
      scale: {
        height: 720,
        width: 1280
      }
    };

    sceneLike.ensurePowerupCompassPool = GameScene.prototype.ensurePowerupCompassPool;

    GameScene.prototype.updatePowerupCompassIndicators.call(sceneLike);

    expect(sceneLike.powerupCompassIndicators).toHaveLength(2);
    expect(sceneLike.powerupCompassIndicators[0].icon.visible).toBe(true);
    expect(sceneLike.powerupCompassIndicators[0].icon.texture).toBe('powerup-frenzy');
    expect(sceneLike.powerupCompassIndicators[0].icon.x).toBeLessThanOrEqual(1280);
    expect(sceneLike.powerupCompassIndicators[1].icon.visible).toBe(false);
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
        getActiveBoss: vi.fn().mockReturnValue(null),
        getLivingEnemies: () => []
      },
      bossOverlay: {
        update: vi.fn()
      },
      bossSystem: {
        isWarningActive: vi.fn().mockReturnValue(false)
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
    expect(sceneLike.bossOverlay.update).toHaveBeenCalledWith({
      healthRatio: 0,
      label: '',
      visible: false,
      warning: ''
    });
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

  it('reapplies damage tooltip hover after the hud refresh so overlay updates do not clear it', () => {
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

    expect(sceneLike.refreshHud).toHaveBeenCalledOnce();
    expect(sceneLike.refreshHud.mock.invocationCallOrder[0]).toBeLessThan(
      sceneLike.damageStatsOverlay.hoverPointer.mock.invocationCallOrder[0]
    );
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

  it('triggers the frost pickup as an instant enemy slow pulse instead of a player buff stack', () => {
    const sceneLike = {
      audioManager: {
        playPickup: vi.fn()
      },
      elapsedMs: 9000,
      enemyManager: {
        applyAreaSlow: vi.fn().mockReturnValue(3)
      },
      isGameOver: false,
      player: {
        sprite: { x: 120, y: 80 }
      },
      playSlowBurstVfx: vi.fn(),
      refreshHud: vi.fn(),
      temporaryBuffSystem: {
        addStack: vi.fn()
      }
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'powerup',
      buffKey: 'frost',
      value: 0
    });

    expect(result).toBe(false);
    expect(sceneLike.audioManager.playPickup).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.applyAreaSlow).toHaveBeenCalledWith(120, 80, 200, 9000, 20000, 0.5);
    expect(sceneLike.playSlowBurstVfx).toHaveBeenCalledWith(120, 80);
    expect(sceneLike.temporaryBuffSystem.addStack).not.toHaveBeenCalled();
    expect(sceneLike.refreshHud).toHaveBeenCalledOnce();
  });

  it('triggers the boss warning, then spawns the necromancer after the warning window ends', () => {
    const sceneLike = {
      audioManager: {
        playEliteWarning: vi.fn()
      },
      bossSystem: {
        consumeSpawn: vi.fn(),
        isWarningActive: vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false),
        update: vi
          .fn()
          .mockReturnValueOnce({ pendingBoss: true })
          .mockReturnValueOnce({ pendingBoss: true })
      },
      bossWarningPlayed: false,
      elapsedMs: 240000,
      enemyManager: {
        spawnEnemy: vi.fn()
      },
      getBossSpawnPosition: vi.fn().mockReturnValue({ x: 640, y: 220 })
    };

    GameScene.prototype.updateBossEncounter.call(sceneLike);
    GameScene.prototype.updateBossEncounter.call(sceneLike);

    expect(sceneLike.audioManager.playEliteWarning).toHaveBeenCalledOnce();
    expect(sceneLike.enemyManager.spawnEnemy).toHaveBeenCalledWith('necromancerBoss', {
      boss: true,
      position: { x: 640, y: 220 }
    });
    expect(sceneLike.bossSystem.consumeSpawn).toHaveBeenCalledOnce();
  });

  it('marks the boss defeated and spawns a guaranteed chest reward on boss death', () => {
    const sceneLike = {
      bossSystem: {
        markDefeated: vi.fn()
      },
      pickupManager: {
        spawnChest: vi.fn()
      },
      refreshHud: vi.fn()
    };

    GameScene.prototype.handleBossDefeated.call(sceneLike, {
      bossName: 'Necromancer',
      type: 'necromancerBoss',
      x: 300,
      y: 180
    });

    expect(sceneLike.bossSystem.markDefeated).toHaveBeenCalledOnce();
    expect(sceneLike.pickupManager.spawnChest).toHaveBeenCalledWith(300, 180, 'necromancerBoss');
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

  it('applies passive health regeneration from learned upgrades during active gameplay', () => {
    const sceneLike = {
      activePauseOverlay: null,
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
        getNearEnemyQuery: vi.fn().mockReturnValue([]),
        update: vi.fn().mockReturnValue([])
      },
      handleStatsToggle: vi.fn(),
      input: {
        activePointer: null
      },
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      applyPassiveRegen: GameScene.prototype.applyPassiveRegen,
      pickupManager: {
        update: vi.fn()
      },
      player: {
        heal: vi.fn(),
        sprite: { x: 0, y: 0 },
        stats: {
          health: 55,
          healthRegenPerSec: 0.2,
          maxHealth: 100,
          pickupRadius: 48
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockImplementation((stats) => stats),
        update: vi.fn()
      },
      time: {
        now: 1000
      },
      updateEliteWave: vi.fn()
    };

    GameScene.prototype.update.call(sceneLike, 1000, 1000);

    expect(sceneLike.player.heal).toHaveBeenCalledWith(0.2);
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
        pickEnemyType: vi.fn().mockReturnValue('skeleton'),
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
    expect(sceneLike.enemyManager.spawnEnemy).toHaveBeenCalledWith('skeleton', { elite: true });
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

describe('GameScene handleRestartKeyDown', () => {
  it('restarts immediately when the run is over', () => {
    const sceneLike = {
      isGameOver: true,
      restartRun: vi.fn()
    };

    GameScene.prototype.handleRestartKeyDown.call(sceneLike);

    expect(sceneLike.restartRun).toHaveBeenCalledOnce();
  });

  it('ignores restart keys while the run is still active', () => {
    const sceneLike = {
      isGameOver: false,
      restartRun: vi.fn()
    };

    GameScene.prototype.handleRestartKeyDown.call(sceneLike);

    expect(sceneLike.restartRun).not.toHaveBeenCalled();
  });
});

describe('GameScene handleJournalToggle', () => {
  it('opens the journal during active gameplay and pauses the run', () => {
    const sceneLike = {
      activePauseOverlay: null,
      isGameOver: false,
      isGameplayPaused: false,
      journalOverlay: {
        show: vi.fn()
      },
      journalPayload: { activeTab: 'enemies' },
      physics: {
        world: {
          pause: vi.fn(),
          resume: vi.fn()
        }
      },
      player: {
        stop: vi.fn()
      },
      refreshJournalOverlay: vi.fn()
    };

    GameScene.prototype.handleJournalToggle.call(sceneLike);

    expect(sceneLike.refreshJournalOverlay).toHaveBeenCalledOnce();
    expect(sceneLike.physics.world.pause).toHaveBeenCalledOnce();
    expect(sceneLike.player.stop).toHaveBeenCalledOnce();
    expect(sceneLike.activePauseOverlay).toBe('journal');
    expect(sceneLike.isGameplayPaused).toBe(true);
    expect(sceneLike.journalOverlay.show).toHaveBeenCalledWith({ activeTab: 'enemies' });
  });

  it('closes the journal and resumes gameplay when already open', () => {
    const sceneLike = {
      activePauseOverlay: 'journal',
      isGameOver: false,
      isGameplayPaused: true,
      journalOverlay: {
        hide: vi.fn()
      },
      physics: {
        world: {
          resume: vi.fn()
        }
      }
    };

    GameScene.prototype.handleJournalToggle.call(sceneLike);

    expect(sceneLike.journalOverlay.hide).toHaveBeenCalledOnce();
    expect(sceneLike.physics.world.resume).toHaveBeenCalledOnce();
    expect(sceneLike.activePauseOverlay).toBe(null);
    expect(sceneLike.isGameplayPaused).toBe(false);
  });

  it('does not open the journal while game over is active', () => {
    const sceneLike = {
      activePauseOverlay: null,
      isGameOver: true,
      journalOverlay: {
        show: vi.fn()
      },
      refreshJournalOverlay: vi.fn()
    };

    GameScene.prototype.handleJournalToggle.call(sceneLike);

    expect(sceneLike.refreshJournalOverlay).not.toHaveBeenCalled();
    expect(sceneLike.journalOverlay.show).not.toHaveBeenCalled();
  });
});

describe('GameScene handleJournalKey', () => {
  it('closes the journal when escape is pressed while the journal is open', () => {
    const justDownSpy = vi
      .spyOn(Phaser.Input.Keyboard, 'JustDown')
      .mockImplementation((key) => key?.code === 'ESC');
    const sceneLike = {
      activePauseOverlay: 'journal',
      escapeKey: { code: 'ESC' },
      handleJournalToggle: vi.fn(),
      journalKey: { code: 'J' }
    };

    GameScene.prototype.handleJournalKey.call(sceneLike);

    expect(sceneLike.handleJournalToggle).toHaveBeenCalledOnce();
    justDownSpy.mockRestore();
  });
});

describe('GameScene handleScenePointerDown', () => {
  it('routes game-over clicks through the game over overlay', () => {
    const sceneLike = {
      gameOverOverlay: {
        choosePointer: vi.fn()
      },
      isGameOver: true
    };

    GameScene.prototype.handleScenePointerDown.call(sceneLike, { x: 640, y: 452 });

    expect(sceneLike.gameOverOverlay.choosePointer).toHaveBeenCalledWith(640, 452);
  });

  it('does not send game-over clicks into level-up selection', () => {
    const sceneLike = {
      gameOverOverlay: {
        choosePointer: vi.fn()
      },
      isGameOver: true,
      isGameplayPaused: true,
      levelUpOverlay: {
        choosePointer: vi.fn()
      }
    };

    GameScene.prototype.handleScenePointerDown.call(sceneLike, { x: 640, y: 452 });

    expect(sceneLike.gameOverOverlay.choosePointer).toHaveBeenCalledWith(640, 452);
    expect(sceneLike.levelUpOverlay.choosePointer).not.toHaveBeenCalled();
  });

  it('routes journal clicks through the journal overlay and applies the result', () => {
    const result = { type: 'switch-tab', tab: 'abilities' };
    const sceneLike = {
      activePauseOverlay: 'journal',
      handleJournalPointerResult: vi.fn(),
      isGameOver: false,
      isGameplayPaused: true,
      journalOverlay: {
        handlePointer: vi.fn().mockReturnValue(result)
      }
    };

    GameScene.prototype.handleScenePointerDown.call(sceneLike, { x: 300, y: 200 });

    expect(sceneLike.journalOverlay.handlePointer).toHaveBeenCalledWith(300, 200);
    expect(sceneLike.handleJournalPointerResult).toHaveBeenCalledWith(result);
  });
});

describe('GameScene handleSceneWheel', () => {
  it('routes wheel scrolling into the journal overlay while the journal is open', () => {
    const sceneLike = {
      activePauseOverlay: 'journal',
      isGameplayPaused: true,
      journalOverlay: {
        handleWheel: vi.fn()
      }
    };

    GameScene.prototype.handleSceneWheel.call(sceneLike, { x: 300, y: 240 }, 120);

    expect(sceneLike.journalOverlay.handleWheel).toHaveBeenCalledWith(300, 240, 120);
  });

  it('ignores wheel scrolling when the journal is not the active overlay', () => {
    const sceneLike = {
      activePauseOverlay: 'levelUp',
      isGameplayPaused: true,
      journalOverlay: {
        handleWheel: vi.fn()
      }
    };

    GameScene.prototype.handleSceneWheel.call(sceneLike, { x: 300, y: 240 }, 120);

    expect(sceneLike.journalOverlay.handleWheel).not.toHaveBeenCalled();
  });
});

describe('GameScene handleJournalPointerResult', () => {
  it('closes the journal when the overlay returns a close action', () => {
    const sceneLike = {
      handleJournalToggle: vi.fn()
    };

    GameScene.prototype.handleJournalPointerResult.call(sceneLike, { type: 'close' });

    expect(sceneLike.handleJournalToggle).toHaveBeenCalledOnce();
  });
});

describe('GameScene journal discovery helpers', () => {
  it('records discovered enemies and abilities', () => {
    const sceneLike = {
      journalDiscovery: createJournalDiscoveryState()
    };

    GameScene.prototype.recordEnemyDiscovery.call(sceneLike, 'spitter');
    GameScene.prototype.recordAbilityDiscovery.call(sceneLike, 'meteor');

    expect(sceneLike.journalDiscovery.enemies.has('spitter')).toBe(true);
    expect(sceneLike.journalDiscovery.abilities.has('meteor')).toBe(true);
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
  it('cleans up pause overlays and restarts the current scene when possible', () => {
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
        restart: vi.fn(),
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
    expect(sceneLike.scene.restart).toHaveBeenCalledOnce();
    expect(sceneLike.scene.start).not.toHaveBeenCalled();
  });

  it('falls back to starting the configured scene key when restart is unavailable', () => {
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
      },
      sys: {
        settings: {
          key: 'game'
        }
      }
    };

    GameScene.prototype.restartRun.call(sceneLike);

    expect(sceneLike.scene.start).toHaveBeenCalledWith('game');
  });
});

describe('PickupManager update', () => {
  it('pulls distant pickups from the pickup radius without collecting them until they are very close', () => {
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
    const orb = {
      active: true,
      kind: 'xp',
      value: 3,
      x: 40,
      y: 0,
      setVelocity: vi.fn(),
      destroy: vi.fn()
    };

    manager.group = {
      getChildren: () => [orb]
    };

    manager.update({ x: 0, y: 0 }, 96);

    expect(onCollect).not.toHaveBeenCalled();
    expect(orb.destroy).not.toHaveBeenCalled();
    expect(orb.setVelocity).toHaveBeenCalledWith(-300, 0);
  });

  it('doubles the magnet pull speed when vacuuming nearby pickups to the player', () => {
    const scene = {
      physics: {
        add: {
          group: () => ({
            getChildren: () => []
          })
        }
      }
    };
    const manager = new PickupManager(scene, vi.fn());
    const orb = {
      active: true,
      kind: 'xp',
      x: 100,
      y: 0,
      setVelocity: vi.fn()
    };

    manager.group = {
      getChildren: () => [orb]
    };

    manager.pullNearbyToPlayer({ x: 0, y: 0 }, 260);

    expect(orb.setVelocity).toHaveBeenCalledWith(-880, 0);
  });

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
