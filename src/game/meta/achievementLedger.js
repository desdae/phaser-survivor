export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'beatNecromancer',
    reward: { type: 'soulAsh', amount: 20 },
    unlocks: (runSummary) => (runSummary.bossKills ?? 0) >= 1
  },
  {
    key: 'survive10Minutes',
    reward: { type: 'soulAsh', amount: 30 },
    unlocks: (runSummary) => (runSummary.timeMs ?? 0) >= 600000
  },
  {
    key: 'open25Chests',
    reward: { type: 'perk', perkKey: 'globalDamageBonus', amount: 0.01 },
    unlocks: (runSummary) => (runSummary.chestsOpened ?? 0) >= 25
  }
];

export function evaluateAchievements(existing = {}, runSummary = {}) {
  const nextState = { ...existing };

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const current = nextState[definition.key] ?? { unlocked: false, claimed: false };
    nextState[definition.key] = definition.unlocks(runSummary)
      ? { ...current, unlocked: true }
      : current;
  }

  return nextState;
}

export function claimAchievementReward(profile, achievementKey) {
  const definition = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.key === achievementKey);
  const current = profile.achievements?.[achievementKey];

  if (!definition || !current?.unlocked || current.claimed) {
    throw new Error('Achievement reward unavailable');
  }

  const nextProfile = structuredClone(profile);
  nextProfile.achievements[achievementKey] = { ...current, claimed: true };

  if (definition.reward.type === 'soulAsh') {
    nextProfile.meta.soulAsh += definition.reward.amount;
    nextProfile.meta.lifetimeSoulAshEarned += definition.reward.amount;
  }

  return nextProfile;
}
