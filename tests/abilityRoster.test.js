import { describe, expect, it } from 'vitest';
import {
  ABILITY_CAP,
  canLearnAbility,
  countLearnedAbilities,
  getOwnedAbilityKeys
} from '../src/game/logic/abilityRoster.js';

describe('ability roster', () => {
  it('counts the starting auto shot and learned unlocks toward the 8-ability cap', () => {
    const player = {
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
      spearBarrageUnlocked: false
    };

    expect(ABILITY_CAP).toBe(8);
    expect(countLearnedAbilities(player)).toBe(8);
    expect(canLearnAbility(player, 'runeTrapUnlocked')).toBe(false);
  });

  it('returns only owned ability keys in stable order for damage table and filtering', () => {
    const player = {
      bladeUnlocked: true,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: true,
      meteorUnlocked: false,
      burstRifleUnlocked: true,
      flamethrowerUnlocked: false,
      runeTrapUnlocked: true,
      lanceUnlocked: false,
      arcMineUnlocked: false,
      spearBarrageUnlocked: false
    };

    expect(getOwnedAbilityKeys(player)).toEqual([
      'projectile',
      'blade',
      'boomerang',
      'burstRifle',
      'runeTrap'
    ]);
  });
});
