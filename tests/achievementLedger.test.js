import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_DEFINITIONS,
  claimAchievementReward,
  evaluateAchievements
} from '../src/game/meta/achievementLedger.js';

describe('achievement ledger', () => {
  it('unlocks achievements from run summary data', () => {
    const nextState = evaluateAchievements(
      {},
      {
        bossKills: 1,
        timeMs: 610000,
        chestsOpened: 25
      }
    );

    expect(nextState.beatNecromancer.unlocked).toBe(true);
    expect(nextState.survive10Minutes.unlocked).toBe(true);
    expect(nextState.open25Chests.unlocked).toBe(true);
  });

  it('claims a Soul Ash reward exactly once', () => {
    const nextProfile = claimAchievementReward(
      {
        version: 1,
        meta: { soulAsh: 10, lifetimeSoulAshEarned: 10 },
        achievements: {
          beatNecromancer: { unlocked: true, claimed: false }
        }
      },
      'beatNecromancer'
    );

    expect(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.key === 'beatNecromancer')).toBe(true);
    expect(nextProfile.meta.soulAsh).toBe(30);
    expect(nextProfile.achievements.beatNecromancer.claimed).toBe(true);
  });
});
