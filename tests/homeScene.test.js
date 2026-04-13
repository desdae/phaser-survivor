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

  it('buys permanent weapon unlocks', () => {
    const sceneLike = {
      storage: { setItem: vi.fn() },
      metaProfile: {
        version: 1,
        meta: { soulAsh: 90, lifetimeSoulAshEarned: 90 },
        shop: {},
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: {}
      },
      refreshHomePanels: vi.fn()
    };

    HomeScene.prototype.buyWeaponUnlock.call(sceneLike, 'nova');

    expect(sceneLike.metaProfile.meta.soulAsh).toBe(30);
    expect(sceneLike.metaProfile.unlocks.weapons).toContain('nova');
    expect(sceneLike.refreshHomePanels).toHaveBeenCalledOnce();
  });

  it('claims unlocked achievement rewards', () => {
    const sceneLike = {
      storage: { setItem: vi.fn() },
      metaProfile: {
        version: 1,
        meta: { soulAsh: 10, lifetimeSoulAshEarned: 10 },
        shop: {},
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: { beatNecromancer: { unlocked: true, claimed: false } }
      },
      refreshHomePanels: vi.fn()
    };

    HomeScene.prototype.claimAchievement.call(sceneLike, 'beatNecromancer');

    expect(sceneLike.metaProfile.meta.soulAsh).toBe(30);
    expect(sceneLike.metaProfile.achievements.beatNecromancer.claimed).toBe(true);
    expect(sceneLike.refreshHomePanels).toHaveBeenCalledOnce();
  });
});
