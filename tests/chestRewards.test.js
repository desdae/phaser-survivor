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
    burstRifleUnlocked: false,
    burstRifleDamage: 0,
    burstRifleCooldownMs: 0,
    burstRifleProjectileSpeed: 0,
    burstRifleBurstCount: 0,
    burstRifleSpreadDeg: 0,
    flamethrowerUnlocked: false,
    flamethrowerDamage: 0,
    flamethrowerRange: 0,
    flamethrowerCooldownMs: 0,
    flamethrowerArcDeg: 0,
    runeTrapUnlocked: false,
    runeTrapDamage: 0,
    runeTrapArmMs: 0,
    runeTrapRadius: 0,
    runeTrapCharges: 0,
    runeTrapCooldownMs: 0,
    lanceUnlocked: false,
    lanceDamage: 0,
    lanceCooldownMs: 0,
    lanceLength: 0,
    lanceWidth: 0,
    arcMineUnlocked: false,
    arcMineDamage: 0,
    arcMineChains: 0,
    arcMineTriggerRadius: 0,
    arcMineChainRange: 0,
    arcMineCooldownMs: 0,
    spearBarrageUnlocked: false,
    spearBarrageDamage: 0,
    spearBarrageCount: 0,
    spearBarrageRadius: 0,
    spearBarrageCooldownMs: 0,
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
        meteorUnlocked: true,
        burstRifleUnlocked: true,
        flamethrowerUnlocked: true,
        runeTrapUnlocked: true,
        lanceUnlocked: true,
        arcMineUnlocked: true,
        spearBarrageUnlocked: true
      })
    );

    expect(pool.map((reward) => reward.key)).not.toContain('arsenalDraft');
  });

  it('does not offer arsenalDraft once the total ability cap is reached', () => {
    const pool = getChestRewardPool(
      createPlayerStats({
        bladeUnlocked: true,
        chainUnlocked: true,
        novaUnlocked: true,
        boomerangUnlocked: true,
        meteorUnlocked: true,
        burstRifleUnlocked: true,
        flamethrowerUnlocked: true
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

  it('falls back to a legal non-unlock reward when arsenalDraft resolves at the cap', () => {
    const player = createPlayerStats({
      bladeUnlocked: true,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true,
      burstRifleUnlocked: true,
      flamethrowerUnlocked: true,
      projectileDamage: 18,
      runeTrapUnlocked: false
    });

    applyChestReward(player, { key: 'arsenalDraft' });

    expect(player.runeTrapUnlocked).toBe(false);
    expect(player.projectileDamage).toBe(32);
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
