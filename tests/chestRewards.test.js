import { describe, expect, it, vi } from 'vitest';
import { applyChestReward, getChestRewardPool, rollChestChoices } from '../src/game/logic/chestRewards.js';

function createPlayerStats(overrides = {}) {
  return {
    maxHealth: 100,
    health: 60,
    projectileDamage: 18,
    fireCooldownMs: 520,
    bladeUnlocked: false,
    bladeCount: 0,
    bladeDamage: 0,
    bladeOrbitRadius: 0,
    bladeOrbitSpeed: 0,
    chainUnlocked: false,
    chainDamage: 0,
    chainLinks: 0,
    chainRange: 0,
    chainCooldownMs: 0,
    novaUnlocked: false,
    novaDamage: 0,
    novaRadius: 0,
    novaCooldownMs: 0,
    novaEchoCount: 0,
    boomerangUnlocked: false,
    boomerangCount: 0,
    boomerangDamage: 0,
    boomerangRange: 0,
    boomerangCooldownMs: 0,
    meteorUnlocked: false,
    meteorCount: 0,
    meteorDamage: 0,
    meteorRadius: 0,
    meteorCooldownMs: 0,
    ...overrides
  };
}

describe('getChestRewardPool', () => {
  it('includes arsenalDraft while a weapon is still locked', () => {
    const pool = getChestRewardPool(createPlayerStats({ bladeUnlocked: true }));

    expect(pool.map((reward) => reward.key)).toContain('arsenalDraft');
  });

  it('omits arsenalDraft once every weapon is unlocked', () => {
    const pool = getChestRewardPool(
      createPlayerStats({
        bladeUnlocked: true,
        chainUnlocked: true,
        novaUnlocked: true,
        boomerangUnlocked: true,
        meteorUnlocked: true
      })
    );

    expect(pool.map((reward) => reward.key)).not.toContain('arsenalDraft');
  });
});

describe('applyChestReward', () => {
  it('unlocks the first missing weapon for arsenalDraft', () => {
    const player = createPlayerStats({
      bladeUnlocked: false,
      chainUnlocked: false,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true
    });

    applyChestReward(player, { key: 'arsenalDraft' });

    expect(player.bladeUnlocked).toBe(true);
    expect(player.bladeCount).toBe(1);
  });

  it('calls pullNearbyToPlayer for soulMagnet with the player sprite position', () => {
    const player = {
      stats: createPlayerStats(),
      sprite: { x: 144, y: 288 }
    };
    const pickupManager = {
      pullNearbyToPlayer: vi.fn()
    };

    applyChestReward(player, { key: 'soulMagnet' }, pickupManager);

    expect(pickupManager.pullNearbyToPlayer).toHaveBeenCalledWith(player.sprite, 260, 440);
  });
});

describe('rollChestChoices', () => {
  it('returns up to three unique chest rewards', () => {
    const pool = getChestRewardPool(createPlayerStats());
    const choices = rollChestChoices(pool, () => 0, 3);

    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((reward) => reward.key)).size).toBe(3);
  });
});
