import { describe, expect, it } from 'vitest';
import {
  buildSoulAshBreakdown,
  calculateSoulAshReward
} from '../src/game/meta/metaRewards.js';

describe('Soul Ash rewards', () => {
  it('calculates a run payout from tracked run stats', () => {
    expect(
      calculateSoulAshReward({
        timeMs: 93000,
        eliteKills: 2,
        bossKills: 1,
        chestsOpened: 3,
        discoverySoulAsh: 10
      }).total
    ).toBe(52);
  });

  it('returns summary rows for the run-over panel', () => {
    expect(
      buildSoulAshBreakdown({
        timeMs: 30000,
        eliteKills: 1,
        bossKills: 0,
        chestsOpened: 0,
        discoverySoulAsh: 0
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'time', soulAsh: 1 }),
        expect.objectContaining({ key: 'elites', soulAsh: 5 })
      ])
    );
  });
});
