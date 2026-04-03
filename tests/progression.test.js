import { describe, expect, it } from 'vitest';
import {
  UPGRADE_DEFINITIONS,
  applyUpgrade,
  awardXp,
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

describe('applyUpgrade', () => {
  it('applies stat upgrades immediately', () => {
    const player = {
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
});
