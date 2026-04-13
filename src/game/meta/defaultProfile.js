export const META_PROFILE_VERSION = 1;

export function createDefaultMetaProfile() {
  return {
    version: META_PROFILE_VERSION,
    meta: {
      soulAsh: 0,
      lifetimeSoulAshEarned: 0,
      totalRuns: 0,
      bestTimeMs: 0,
      eliteKills: 0,
      bossKills: 0,
      chestsOpened: 0
    },
    shop: {
      maxHealthLevel: 0,
      pickupRadiusLevel: 0,
      moveSpeedLevel: 0,
      startingXpLevel: 0,
      rerollLevel: 0,
      reviveUnlocked: false
    },
    unlocks: {
      weapons: ['projectile', 'blade', 'chain'],
      startingLoadoutSlots: 1
    },
    achievements: {}
  };
}

export function migrateMetaProfile(savedProfile) {
  const defaults = createDefaultMetaProfile();

  return {
    ...defaults,
    ...savedProfile,
    meta: {
      ...defaults.meta,
      ...(savedProfile?.meta ?? {})
    },
    shop: {
      ...defaults.shop,
      ...(savedProfile?.shop ?? {})
    },
    unlocks: {
      ...defaults.unlocks,
      ...(savedProfile?.unlocks ?? {}),
      weapons: Array.from(new Set(savedProfile?.unlocks?.weapons ?? defaults.unlocks.weapons))
    },
    achievements: {
      ...defaults.achievements,
      ...(savedProfile?.achievements ?? {})
    },
    version: META_PROFILE_VERSION
  };
}
