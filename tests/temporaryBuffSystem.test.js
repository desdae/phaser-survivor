import { describe, expect, it } from 'vitest';
import { TemporaryBuffSystem } from '../src/game/systems/TemporaryBuffSystem.js';

describe('TemporaryBuffSystem', () => {
  it('adds stacks, prunes them by time, and reports summary rows', () => {
    const system = new TemporaryBuffSystem();

    system.addStack('frenzy', 1000);
    system.addStack('frenzy', 4000);
    system.addStack('volley', 5000);

    expect(system.getSummaryRows(12000)).toEqual([
      {
        buffKey: 'frenzy',
        textureKey: 'powerup-frenzy',
        stacks: 2,
        remainingMs: 19000,
        durationMs: 30000,
        remainingRatio: 19000 / 30000
      },
      {
        buffKey: 'volley',
        textureKey: 'powerup-volley',
        stacks: 1,
        remainingMs: 23000,
        durationMs: 30000,
        remainingRatio: 23000 / 30000
      }
    ]);

    system.update(31000);

    expect(system.getSummaryRows(31000)).toEqual([
      {
        buffKey: 'frenzy',
        textureKey: 'powerup-frenzy',
        stacks: 1,
        remainingMs: 3000,
        durationMs: 30000,
        remainingRatio: 0.1
      },
      {
        buffKey: 'volley',
        textureKey: 'powerup-volley',
        stacks: 1,
        remainingMs: 4000,
        durationMs: 30000,
        remainingRatio: 4000 / 30000
      }
    ]);
  });

  it('returns derived effective stats without mutating the permanent stats source', () => {
    const system = new TemporaryBuffSystem();
    const baseStats = {
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    };

    system.addStack('frenzy', 0);
    system.addStack('overcharge', 0);
    system.addStack('volley', 0);

    expect(system.getEffectiveStats(baseStats, 1000)).toEqual({
      fireCooldownMs: 350,
      projectileDamage: 28,
      projectileCount: 2
    });
    expect(baseStats).toEqual({
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    });
  });

  it('clears all active stacks', () => {
    const system = new TemporaryBuffSystem();

    system.addStack('frenzy', 1000);
    system.addStack('volley', 1000);
    system.clear();

    expect(system.getSummaryRows(2000)).toEqual([]);
  });
});
