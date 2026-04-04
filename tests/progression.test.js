import { describe, expect, it } from 'vitest';
import {
  UPGRADE_DEFINITIONS,
  applyUpgrade,
  awardXp,
  getUpgradePool,
  getXpToNextLevel,
  rollUpgradeChoices
} from '../src/game/logic/progression.js';

describe('getXpToNextLevel', () => {
  it('uses a smoothed early ramp before exponential growth kicks in', () => {
    expect(getXpToNextLevel(1)).toBe(10);
    expect(getXpToNextLevel(2)).toBe(15);
    expect(getXpToNextLevel(3)).toBe(21);
    expect(getXpToNextLevel(10)).toBe(59);
    expect(getXpToNextLevel(20)).toBe(262);
  });
});

describe('awardXp', () => {
  it('levels up and carries overflow xp', () => {
    const state = awardXp({ level: 1, xp: 0 }, 12);

    expect(state.level).toBe(2);
    expect(state.xp).toBe(2);
    expect(state.leveledUp).toBe(true);
    expect(state.xpToNext).toBe(15);
  });

  it('handles large xp gains across several exponential level thresholds', () => {
    const state = awardXp({ level: 1, xp: 0 }, 50);

    expect(state.level).toBe(4);
    expect(state.xp).toBe(4);
    expect(state.leveledUp).toBe(true);
    expect(state.xpToNext).toBe(24);
  });
});

describe('rollUpgradeChoices', () => {
  it('returns three unique upgrades', () => {
    const choices = rollUpgradeChoices(UPGRADE_DEFINITIONS, () => 0.1, 3);

    expect(new Set(choices.map((choice) => choice.key)).size).toBe(3);
  });
});

describe('getUpgradePool', () => {
  it('offers blade unlock before the blade exists', () => {
    const pool = getUpgradePool({
      bladeUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(true);
    expect(pool.some((entry) => entry.key === 'damage')).toBe(true);
    expect(pool.some((entry) => entry.key === 'fireRate')).toBe(true);
    expect(pool.some((entry) => entry.key === 'projectileSpeed')).toBe(false);
    expect(pool.some((entry) => entry.key === 'maxHealth')).toBe(true);
    expect(pool.some((entry) => entry.key === 'heal')).toBe(true);
    expect(pool.some((entry) => entry.key === 'pickupRadius')).toBe(true);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(false);
  });

  it('offers blade upgrades after the blade is unlocked', () => {
    const pool = getUpgradePool({
      bladeUnlocked: true,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: false,
      meteorUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(false);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(true);
  });

  it('does not offer the off-spec projectile speed upgrade in the mvp pool', () => {
    const pool = getUpgradePool({
      bladeUnlocked: false,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: false,
      meteorUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'projectileSpeed')).toBe(false);
  });

  it('offers the new weapon unlocks before they are acquired', () => {
    const pool = getUpgradePool({
      bladeUnlocked: false,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: false,
      meteorUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockChain')).toBe(true);
    expect(pool.some((entry) => entry.key === 'unlockNova')).toBe(true);
    expect(pool.some((entry) => entry.key === 'unlockBoomerang')).toBe(true);
    expect(pool.some((entry) => entry.key === 'unlockMeteor')).toBe(true);
    expect(pool.some((entry) => entry.key === 'chainLinks')).toBe(false);
    expect(pool.some((entry) => entry.key === 'novaEcho')).toBe(false);
    expect(pool.some((entry) => entry.key === 'boomerangCount')).toBe(false);
    expect(pool.some((entry) => entry.key === 'meteorCount')).toBe(false);
  });

  it('swaps new weapon unlocks for their upgrade paths after acquisition', () => {
    const pool = getUpgradePool({
      bladeUnlocked: false,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockChain')).toBe(false);
    expect(pool.some((entry) => entry.key === 'unlockNova')).toBe(false);
    expect(pool.some((entry) => entry.key === 'unlockBoomerang')).toBe(false);
    expect(pool.some((entry) => entry.key === 'unlockMeteor')).toBe(false);
    expect(pool.some((entry) => entry.key === 'chainLinks')).toBe(true);
    expect(pool.some((entry) => entry.key === 'novaEcho')).toBe(true);
    expect(pool.some((entry) => entry.key === 'boomerangCount')).toBe(true);
    expect(pool.some((entry) => entry.key === 'meteorCount')).toBe(true);
  });

  it('stops offering unlocks when the total ability cap is reached', () => {
    const pool = getUpgradePool({
      bladeUnlocked: true,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true,
      burstRifleUnlocked: true,
      flamethrowerUnlocked: true,
      runeTrapUnlocked: false,
      lanceUnlocked: false,
      arcMineUnlocked: false,
      spearBarrageUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockRuneTrap')).toBe(false);
    expect(pool.some((entry) => entry.key === 'unlockLance')).toBe(false);
    expect(pool.some((entry) => entry.key === 'chainDamage')).toBe(true);
  });
});

describe('applyUpgrade', () => {
  it('unlocks the orbiting blade and seeds its starting stats', () => {
    const player = {
      bladeUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    applyUpgrade(player, 'unlockBlade');

    expect(player.bladeUnlocked).toBe(true);
    expect(player.bladeCount).toBe(1);
    expect(player.bladeDamage).toBe(16);
    expect(player.bladeOrbitRadius).toBe(74);
    expect(player.bladeOrbitSpeed).toBe(1.7);
  });

  it('rejects blade upgrades before the blade is unlocked', () => {
    const player = {
      bladeUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    expect(() => applyUpgrade(player, 'bladeCount')).toThrow('Unknown upgrade: bladeCount');
  });

  it('keeps the legacy damage and survivability upgrades working', () => {
    const player = {
      bladeUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 70,
      pickupRadius: 48
    };

    applyUpgrade(player, 'damage');
    applyUpgrade(player, 'maxHealth');
    applyUpgrade(player, 'heal');

    expect(player.projectileDamage).toBe(26);
    expect(player.maxHealth).toBe(120);
    expect(player.health).toBe(120);
  });

  it('adds projectile branching stats', () => {
    const player = {
      bladeUnlocked: false,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: false,
      meteorUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    applyUpgrade(player, 'multiShot');
    applyUpgrade(player, 'pierce');
    applyUpgrade(player, 'ricochet');

    expect(player.projectileCount).toBe(2);
    expect(player.projectilePierce).toBe(1);
    expect(player.projectileRicochet).toBe(1);
  });

  it('unlocks the four new weapon families with seeded stats', () => {
    const player = {
      bladeUnlocked: false,
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
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    applyUpgrade(player, 'unlockChain');
    applyUpgrade(player, 'unlockNova');
    applyUpgrade(player, 'unlockBoomerang');
    applyUpgrade(player, 'unlockMeteor');

    expect(player.chainUnlocked).toBe(true);
    expect(player.chainDamage).toBeGreaterThan(0);
    expect(player.chainLinks).toBeGreaterThan(0);
    expect(player.novaUnlocked).toBe(true);
    expect(player.novaEchoCount).toBeGreaterThan(0);
    expect(player.boomerangUnlocked).toBe(true);
    expect(player.boomerangCount).toBeGreaterThan(0);
    expect(player.meteorUnlocked).toBe(true);
    expect(player.meteorCount).toBeGreaterThan(0);
  });
});
