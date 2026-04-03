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
});
