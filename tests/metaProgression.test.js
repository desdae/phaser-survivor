import { describe, expect, it, vi } from 'vitest';
import {
  META_PROFILE_VERSION,
  createDefaultMetaProfile,
  migrateMetaProfile
} from '../src/game/meta/defaultProfile.js';
import {
  META_PROFILE_STORAGE_KEY,
  canPurchaseShopUpgrade,
  loadMetaProfile,
  purchaseShopUpgrade,
  saveMetaProfile
} from '../src/game/meta/metaProgression.js';
import { getMetaShopDefinition } from '../src/game/meta/metaShopData.js';

describe('meta profile', () => {
  it('creates and migrates the default profile', () => {
    expect(createDefaultMetaProfile().version).toBe(META_PROFILE_VERSION);
    expect(migrateMetaProfile({ version: 1, meta: { soulAsh: 12 } }).meta.soulAsh).toBe(12);
  });

  it('loads defaults when storage is empty', () => {
    const storage = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() };
    expect(loadMetaProfile(storage).meta.soulAsh).toBe(0);
    expect(storage.getItem).toHaveBeenCalledWith(META_PROFILE_STORAGE_KEY);
  });

  it('saves migrated profiles back into storage', () => {
    const storage = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() };
    const profile = saveMetaProfile(storage, {
      version: 1,
      meta: { soulAsh: 22 }
    });

    expect(profile.meta.soulAsh).toBe(22);
    expect(storage.setItem).toHaveBeenCalledWith(
      META_PROFILE_STORAGE_KEY,
      expect.stringContaining('"soulAsh":22')
    );
  });
});

describe('meta shop', () => {
  it('defines shop upgrades with costs and caps', () => {
    expect(getMetaShopDefinition('maxHealth')).toMatchObject({
      key: 'maxHealth',
      profileKey: 'maxHealthLevel',
      maxLevel: 5
    });
  });

  it('deducts Soul Ash and increments the purchased upgrade', () => {
    const nextProfile = purchaseShopUpgrade(
      {
        version: 1,
        meta: { soulAsh: 40 },
        shop: { maxHealthLevel: 0 }
      },
      'maxHealth'
    );

    expect(
      canPurchaseShopUpgrade(
        { version: 1, meta: { soulAsh: 40 }, shop: { maxHealthLevel: 0 } },
        'maxHealth'
      )
    ).toBe(true);
    expect(nextProfile.meta.soulAsh).toBe(20);
    expect(nextProfile.shop.maxHealthLevel).toBe(1);
  });
});
