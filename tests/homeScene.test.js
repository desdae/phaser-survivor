import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {}
  }
}));

import { HomeScene } from '../src/game/scenes/HomeScene.js';

describe('HomeScene', () => {
  it('starts the game scene with the current meta profile', () => {
    const sceneLike = {
      metaProfile: {
        meta: { soulAsh: 30 },
        shop: { maxHealthLevel: 1 },
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: {}
      },
      scene: { start: vi.fn() }
    };

    HomeScene.prototype.startRun.call(sceneLike);

    expect(sceneLike.scene.start).toHaveBeenCalledWith(
      'game',
      expect.objectContaining({ metaProfile: sceneLike.metaProfile })
    );
  });
});
