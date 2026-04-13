import { createDefaultMetaProfile, migrateMetaProfile } from './defaultProfile.js';
import { getMetaShopDefinition } from './metaShopData.js';

export const META_PROFILE_STORAGE_KEY = 'survivor.metaProfile.v1';
const META_WEAPON_COSTS = {
  nova: 60,
  boomerang: 60,
  meteor: 90,
  burstRifle: 100,
  lance: 100,
  flamethrower: 100,
  runeTrap: 100,
  arcMine: 120,
  spearBarrage: 120
};

export function loadMetaProfile(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(META_PROFILE_STORAGE_KEY);
    return raw ? migrateMetaProfile(JSON.parse(raw)) : createDefaultMetaProfile();
  } catch {
    return createDefaultMetaProfile();
  }
}

export function saveMetaProfile(storage = globalThis.localStorage, profile) {
  const nextProfile = migrateMetaProfile(profile);
  storage?.setItem?.(META_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}

export function canPurchaseShopUpgrade(profile, key) {
  const definition = getMetaShopDefinition(key);
  const current = profile.shop?.[definition?.profileKey];
  const level = typeof current === 'boolean' ? Number(current) : (current ?? 0);

  return (
    Boolean(definition) &&
    level < definition.maxLevel &&
    (profile.meta?.soulAsh ?? 0) >= definition.costs[level]
  );
}

export function purchaseShopUpgrade(profile, key) {
  const definition = getMetaShopDefinition(key);

  if (!definition) {
    throw new Error(`Unknown meta shop upgrade: ${key}`);
  }

  const nextProfile = migrateMetaProfile(profile);
  const current = nextProfile.shop[definition.profileKey];
  const level = typeof current === 'boolean' ? Number(current) : current;
  const cost = definition.costs[level];

  if (level >= definition.maxLevel) {
    throw new Error('Upgrade already purchased');
  }

  if (nextProfile.meta.soulAsh < cost) {
    throw new Error('Not enough Soul Ash');
  }

  nextProfile.meta.soulAsh -= cost;
  nextProfile.shop[definition.profileKey] =
    typeof current === 'boolean' ? true : current + 1;

  return nextProfile;
}

export function purchaseWeaponUnlock(profile, weaponKey) {
  if (profile.unlocks?.weapons?.includes(weaponKey)) {
    throw new Error('Weapon already unlocked');
  }

  const cost = META_WEAPON_COSTS[weaponKey];

  if (!cost) {
    throw new Error(`Unknown weapon unlock: ${weaponKey}`);
  }

  if ((profile.meta?.soulAsh ?? 0) < cost) {
    throw new Error('Not enough Soul Ash');
  }

  const nextProfile = migrateMetaProfile(profile);
  nextProfile.meta.soulAsh -= cost;
  nextProfile.unlocks.weapons = [...nextProfile.unlocks.weapons, weaponKey];
  return nextProfile;
}
