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
  it('scales modestly each level', () => {
    expect(getXpToNextLevel(1)).toBe(10);
    expect(getXpToNextLevel(2)).toBe(16);
    expect(getXpToNextLevel(3)).toBe(22);
  });
});

describe('awardXp', () => {
  it('levels up and carries overflow xp', () => {
    const state = awardXp({ level: 1, xp: 0 }, 12);

    expect(state.level).toBe(2);
    expect(state.xp).toBe(2);
    expect(state.leveledUp).toBe(true);
    expect(state.xpToNext).toBe(16);
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
    expect(pool.some((entry) => entry.key === 'projectileSpeed')).toBe(true);
    expect(pool.some((entry) => entry.key === 'maxHealth')).toBe(true);
    expect(pool.some((entry) => entry.key === 'heal')).toBe(true);
    expect(pool.some((entry) => entry.key === 'pickupRadius')).toBe(true);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(false);
  });

  it('offers blade upgrades after the blade is unlocked', () => {
    const pool = getUpgradePool({
      bladeUnlocked: true,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(false);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(true);
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
    expect(player.bladeDamage).toBeGreaterThan(0);
    expect(player.bladeOrbitRadius).toBeGreaterThan(0);
    expect(player.bladeOrbitSpeed).toBeGreaterThan(0);
  });

  it('adds projectile branching stats', () => {
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

    applyUpgrade(player, 'multiShot');
    applyUpgrade(player, 'pierce');
    applyUpgrade(player, 'ricochet');

    expect(player.projectileCount).toBe(2);
    expect(player.projectilePierce).toBe(1);
    expect(player.projectileRicochet).toBe(1);
  });
});
