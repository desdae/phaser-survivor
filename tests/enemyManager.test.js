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
});
