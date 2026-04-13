import { createDefaultMetaProfile, migrateMetaProfile } from './defaultProfile.js';
import { getMetaShopDefinition } from './metaShopData.js';

export const META_PROFILE_STORAGE_KEY = 'survivor.metaProfile.v1';

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
