import { describe, expect, it } from 'vitest';
import {
  POWERUP_DURATION_MS,
  POWERUP_DROP_CHANCE_BY_SOURCE,
  POWERUP_KEYS,
  buildPowerupSummaryRows,
  createPowerupStack,
  getEffectiveStats,
  pruneExpiredStacks,
  rollPowerupDrop
} from '../src/game/logic/temporaryPowerups.js';

describe('temporaryPowerups constants', () => {
  it('exposes the expected drop and duration values', () => {
    expect(POWERUP_DURATION_MS).toBe(30000);
    expect(POWERUP_DROP_CHANCE_BY_SOURCE).toEqual({
      normal: 0.015,
      elite: 0.06
    });
    expect(POWERUP_KEYS).toEqual(['frenzy', 'overcharge', 'volley']);
  });
});

describe('rollPowerupDrop', () => {
  it('returns a temporary buff key when the drop roll succeeds', () => {
    expect(
      rollPowerupDrop({
        isElite: false,
        roll: 0.01,
        keyRoll: 0.9
      })
    ).toBe('volley');
  });

  it('returns null when the drop roll misses for elites too', () => {
    expect(
      rollPowerupDrop({
        isElite: true,
        roll: 0.2,
        keyRoll: 0.1
      })
    ).toBeNull();
  });
});

describe('powerup stack lifecycle', () => {
  it('creates independent stacks with a 30 second duration', () => {
    expect(createPowerupStack('frenzy', 1000)).toEqual({
      buffKey: 'frenzy',
      expiresAt: 31000
    });
  });

  it('prunes expired stacks while leaving active ones intact', () => {
    const stacks = [
      createPowerupStack('frenzy', 0),
      createPowerupStack('frenzy', 5000),
      createPowerupStack('overcharge', 10000)
    ];

    expect(pruneExpiredStacks(stacks, 29999)).toHaveLength(3);
    expect(pruneExpiredStacks(stacks, 30000)).toEqual([
      {
        buffKey: 'frenzy',
        expiresAt: 35000
      },
      {
        buffKey: 'overcharge',
        expiresAt: 40000
      }
    ]);
  });
});

describe('getEffectiveStats', () => {
  it('applies frenzy, overcharge, and volley buffs to derived combat stats', () => {
    const baseStats = {
      fireCooldownMs: 500,
      chainCooldownMs: 1000,
      novaCooldownMs: 1200,
      boomerangCooldownMs: 900,
      meteorCooldownMs: 1500,
      projectileDamage: 20,
      bladeDamage: 12,
      chainDamage: 8,
      novaDamage: 10,
      boomerangDamage: 14,
      meteorDamage: 16,
      projectileCount: 1,
      bladeCount: 2,
      chainLinks: 3,
      novaEchoCount: 1,
      boomerangCount: 1,
      meteorCount: 1
    };

    const effective = getEffectiveStats(
      baseStats,
      [
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 1000),
        createPowerupStack('overcharge', 0),
        createPowerupStack('volley', 0),
        createPowerupStack('volley', 500)
      ],
      1000
    );

    expect(effective).not.toBe(baseStats);
    expect(effective.fireCooldownMs).toBe(245);
    expect(effective.chainCooldownMs).toBe(490);
    expect(effective.novaCooldownMs).toBe(588);
    expect(effective.boomerangCooldownMs).toBe(441);
    expect(effective.meteorCooldownMs).toBe(735);
    expect(effective.projectileDamage).toBe(28);
    expect(effective.bladeDamage).toBeCloseTo(16.8, 5);
    expect(effective.chainDamage).toBeCloseTo(11.2, 5);
    expect(effective.novaDamage).toBe(14);
    expect(effective.boomerangDamage).toBeCloseTo(19.6, 5);
    expect(effective.meteorDamage).toBeCloseTo(22.4, 5);
    expect(effective.projectileCount).toBe(3);
    expect(effective.bladeCount).toBe(4);
    expect(effective.chainLinks).toBe(5);
    expect(effective.novaEchoCount).toBe(3);
    expect(effective.boomerangCount).toBe(3);
    expect(effective.meteorCount).toBe(3);
  });

  it('keeps cooldowns above the minimum floor under heavy frenzy stacking', () => {
    const effective = getEffectiveStats(
      {
        fireCooldownMs: 500
      },
      [
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 0)
      ],
      1000
    );

    expect(effective.fireCooldownMs).toBe(60);
  });

  it('does not mutate the base stats object', () => {
    const baseStats = {
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    };

    getEffectiveStats(baseStats, [createPowerupStack('volley', 0)], 1000);

    expect(baseStats).toEqual({
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    });
  });
});

describe('buildPowerupSummaryRows', () => {
  it('builds icon-ready buff summaries with remaining ratio and texture keys', () => {
    const now = 10000;

    expect(
      buildPowerupSummaryRows(
        [
          createPowerupStack('frenzy', now - 21000),
          createPowerupStack('frenzy', now - 10000),
          createPowerupStack('volley', now - 15000)
        ],
        now
      )
    ).toEqual([
      {
        buffKey: 'frenzy',
        textureKey: 'powerup-frenzy',
        stacks: 2,
        remainingMs: 9000,
        durationMs: POWERUP_DURATION_MS,
        remainingRatio: 0.3
      },
      {
        buffKey: 'volley',
        textureKey: 'powerup-volley',
        stacks: 1,
        remainingMs: 15000,
        durationMs: POWERUP_DURATION_MS,
        remainingRatio: 0.5
      }
    ]);
  });
});
