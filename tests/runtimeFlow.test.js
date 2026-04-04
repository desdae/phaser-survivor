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
  it('special-cases chest pickups and opens the chest reward overlay', () => {
    const sceneLike = {
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
    expect(sceneLike.openChestReward).toHaveBeenCalledWith({ kind: 'chest', rewardSeed: 'ogre' });
    expect(sceneLike.player.heal).not.toHaveBeenCalled();
    expect(sceneLike.player.gainXp).not.toHaveBeenCalled();
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
