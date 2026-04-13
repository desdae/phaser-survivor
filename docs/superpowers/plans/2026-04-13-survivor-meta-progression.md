# Survivor Meta Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent `Soul Ash` meta-progression layer with a between-run home screen, permanent shop upgrades, permanent weapon unlock gating, and a side-system achievement ledger.

**Architecture:** Add a focused meta layer under `src/game/meta/` for save state, rewards, shop data, and achievements. Introduce a lightweight `HomeScene` that owns between-run UI, keep `GameScene` focused on run orchestration, and pass end-of-run summary payloads back into the home flow. Apply meta bonuses at run start and use permanent unlock data to filter the existing run-time upgrade pool.

**Tech Stack:** Phaser 3, Vite, Vitest, browser `localStorage`

---

## File Structure

- Create: `src/game/meta/defaultProfile.js`
- Create: `src/game/meta/metaProgression.js`
- Create: `src/game/meta/metaShopData.js`
- Create: `src/game/meta/metaRewards.js`
- Create: `src/game/meta/achievementLedger.js`
- Create: `src/game/scenes/HomeScene.js`
- Modify: `src/main.js`
- Modify: `src/game/entities/Player.js`
- Modify: `src/game/logic/abilityRoster.js`
- Modify: `src/game/logic/progression.js`
- Modify: `src/game/systems/UpgradeSystem.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Create: `tests/metaProgression.test.js`
- Create: `tests/metaRewards.test.js`
- Create: `tests/achievementLedger.test.js`
- Create: `tests/homeScene.test.js`
- Modify: `tests/progression.test.js`
- Modify: `tests/runtimeFlow.test.js`

## Task 1: Build the Persistent Profile and Shop Foundation

**Files:**
- Create: `src/game/meta/defaultProfile.js`
- Create: `src/game/meta/metaProgression.js`
- Create: `src/game/meta/metaShopData.js`
- Test: `tests/metaProgression.test.js`

- [ ] **Step 1: Write the failing tests**

```js
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

    expect(canPurchaseShopUpgrade({ version: 1, meta: { soulAsh: 40 }, shop: { maxHealthLevel: 0 } }, 'maxHealth')).toBe(true);
    expect(nextProfile.meta.soulAsh).toBe(20);
    expect(nextProfile.shop.maxHealthLevel).toBe(1);
  });
});
```

- [ ] **Step 2: Run the targeted test**

Run: `npm test -- tests/metaProgression.test.js`

Expected: FAIL with missing-module errors for the new meta files.

- [ ] **Step 3: Write the minimal profile and shop implementation**

```js
// src/game/meta/defaultProfile.js
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
    meta: { ...defaults.meta, ...(savedProfile?.meta ?? {}) },
    shop: { ...defaults.shop, ...(savedProfile?.shop ?? {}) },
    unlocks: {
      ...defaults.unlocks,
      ...(savedProfile?.unlocks ?? {}),
      weapons: Array.from(new Set(savedProfile?.unlocks?.weapons ?? defaults.unlocks.weapons))
    },
    achievements: { ...defaults.achievements, ...(savedProfile?.achievements ?? {}) },
    version: META_PROFILE_VERSION
  };
}
```

```js
// src/game/meta/metaShopData.js
export const META_SHOP_DEFINITIONS = [
  { key: 'maxHealth', profileKey: 'maxHealthLevel', maxLevel: 5, costs: [20, 40, 75, 125, 200] },
  { key: 'pickupRadius', profileKey: 'pickupRadiusLevel', maxLevel: 5, costs: [20, 40, 75, 125, 200] },
  { key: 'moveSpeed', profileKey: 'moveSpeedLevel', maxLevel: 5, costs: [20, 40, 75, 125, 200] },
  { key: 'startingXp', profileKey: 'startingXpLevel', maxLevel: 4, costs: [20, 40, 75, 125] },
  { key: 'reroll', profileKey: 'rerollLevel', maxLevel: 2, costs: [60, 120] },
  { key: 'revive', profileKey: 'reviveUnlocked', maxLevel: 1, costs: [250] }
];

export function getMetaShopDefinition(key) {
  return META_SHOP_DEFINITIONS.find((entry) => entry.key === key) ?? null;
}
```

```js
// src/game/meta/metaProgression.js
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
  return Boolean(definition) && level < definition.maxLevel && (profile.meta?.soulAsh ?? 0) >= definition.costs[level];
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
```

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- tests/metaProgression.test.js`

Expected: PASS for profile defaults, storage, and shop purchase behavior.

- [ ] **Step 5: Commit**

```bash
git add tests/metaProgression.test.js src/game/meta/defaultProfile.js src/game/meta/metaProgression.js src/game/meta/metaShopData.js
git commit -m "feat: add meta profile and shop foundation"
```

## Task 2: Add Soul Ash Rewards and the Achievement Ledger

**Files:**
- Create: `src/game/meta/metaRewards.js`
- Create: `src/game/meta/achievementLedger.js`
- Create: `tests/metaRewards.test.js`
- Create: `tests/achievementLedger.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, expect, it } from 'vitest';
import { buildSoulAshBreakdown, calculateSoulAshReward } from '../src/game/meta/metaRewards.js';
import { ACHIEVEMENT_DEFINITIONS, claimAchievementReward, evaluateAchievements } from '../src/game/meta/achievementLedger.js';

describe('Soul Ash rewards', () => {
  it('calculates a run payout from tracked run stats', () => {
    expect(calculateSoulAshReward({
      timeMs: 93000,
      eliteKills: 2,
      bossKills: 1,
      chestsOpened: 3,
      discoverySoulAsh: 10
    }).total).toBe(44);
  });

  it('returns summary rows for the run-over panel', () => {
    expect(buildSoulAshBreakdown({ timeMs: 30000, eliteKills: 1, bossKills: 0, chestsOpened: 0, discoverySoulAsh: 0 }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'time', soulAsh: 1 }),
        expect.objectContaining({ key: 'elites', soulAsh: 5 })
      ]));
  });
});

describe('achievement ledger', () => {
  it('unlocks achievements from run summary data', () => {
    const nextState = evaluateAchievements({}, {
      bossKills: 1,
      timeMs: 610000,
      chestsOpened: 25
    });

    expect(nextState.beatNecromancer.unlocked).toBe(true);
    expect(nextState.survive10Minutes.unlocked).toBe(true);
  });

  it('claims a Soul Ash reward exactly once', () => {
    const nextProfile = claimAchievementReward(
      {
        version: 1,
        meta: { soulAsh: 10, lifetimeSoulAshEarned: 10 },
        achievements: { beatNecromancer: { unlocked: true, claimed: false } }
      },
      'beatNecromancer'
    );

    expect(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.key === 'beatNecromancer')).toBe(true);
    expect(nextProfile.meta.soulAsh).toBe(30);
    expect(nextProfile.achievements.beatNecromancer.claimed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the targeted tests**

Run: `npm test -- tests/metaRewards.test.js tests/achievementLedger.test.js`

Expected: FAIL because the rewards and achievement modules do not exist yet.

- [ ] **Step 3: Implement reward rows and achievements**

```js
// src/game/meta/metaRewards.js
export function buildSoulAshBreakdown({
  timeMs = 0,
  eliteKills = 0,
  bossKills = 0,
  chestsOpened = 0,
  discoverySoulAsh = 0
}) {
  return [
    { key: 'time', label: 'Survival Time', soulAsh: Math.floor(timeMs / 30000) },
    { key: 'elites', label: 'Elite Kills', soulAsh: eliteKills * 5 },
    { key: 'bosses', label: 'Boss Kills', soulAsh: bossKills * 20 },
    { key: 'chests', label: 'Chests Opened', soulAsh: chestsOpened * 3 },
    { key: 'discoveries', label: 'First Discoveries', soulAsh: discoverySoulAsh }
  ];
}

export function calculateSoulAshReward(runSummary) {
  const rows = buildSoulAshBreakdown(runSummary);
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.soulAsh, 0)
  };
}
```

```js
// src/game/meta/achievementLedger.js
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
```

- [ ] **Step 4: Re-run the targeted tests**

Run: `npm test -- tests/metaRewards.test.js tests/achievementLedger.test.js`

Expected: PASS with stable reward totals and one-time achievement claims.

- [ ] **Step 5: Commit**

```bash
git add tests/metaRewards.test.js tests/achievementLedger.test.js src/game/meta/metaRewards.js src/game/meta/achievementLedger.js
git commit -m "feat: add Soul Ash rewards and achievements"
```

## Task 3: Gate Permanent Weapon Unlocks and Apply Meta Bonuses at Run Start

**Files:**
- Modify: `src/game/entities/Player.js`
- Modify: `src/game/logic/abilityRoster.js`
- Modify: `src/game/logic/progression.js`
- Modify: `src/game/systems/UpgradeSystem.js`
- Modify: `tests/progression.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, expect, it } from 'vitest';
import { getAllowedAbilityFlags, isAbilityUnlockedInMeta } from '../src/game/logic/abilityRoster.js';
import { getUpgradePool } from '../src/game/logic/progression.js';

describe('meta unlock gating', () => {
  it('maps unlocked weapons to the existing run-time flags', () => {
    expect(getAllowedAbilityFlags(['projectile', 'blade', 'chain'])).toEqual([
      'bladeUnlocked',
      'chainUnlocked'
    ]);
    expect(isAbilityUnlockedInMeta(['projectile', 'blade'], 'blade')).toBe(true);
  });

  it('hides permanently locked weapon families from the run upgrade pool', () => {
    const pool = getUpgradePool(
      {
        bladeUnlocked: false,
        chainUnlocked: false,
        novaUnlocked: false,
        boomerangUnlocked: false,
        meteorUnlocked: false,
        burstRifleUnlocked: false,
        flamethrowerUnlocked: false,
        runeTrapUnlocked: false,
        lanceUnlocked: false,
        arcMineUnlocked: false,
        spearBarrageUnlocked: false,
        projectileCount: 1,
        projectilePierce: 0,
        projectileRicochet: 0
      },
      { unlockedWeapons: ['projectile', 'blade', 'chain'] }
    );

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(true);
    expect(pool.some((entry) => entry.key === 'unlockChain')).toBe(true);
    expect(pool.some((entry) => entry.key === 'unlockNova')).toBe(false);
    expect(pool.some((entry) => entry.key === 'unlockMeteor')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the targeted test**

Run: `npm test -- tests/progression.test.js`

Expected: FAIL because the new ability-roster helpers and gated `getUpgradePool` signature are missing.

- [ ] **Step 3: Implement unlock gating and run-start bonus helpers**

```js
// src/game/logic/abilityRoster.js
const META_WEAPON_FLAG_MAP = {
  blade: 'bladeUnlocked',
  chain: 'chainUnlocked',
  nova: 'novaUnlocked',
  boomerang: 'boomerangUnlocked',
  meteor: 'meteorUnlocked',
  burstRifle: 'burstRifleUnlocked',
  flamethrower: 'flamethrowerUnlocked',
  runeTrap: 'runeTrapUnlocked',
  lance: 'lanceUnlocked',
  arcMine: 'arcMineUnlocked',
  spearBarrage: 'spearBarrageUnlocked'
};

export function isAbilityUnlockedInMeta(unlockedWeapons = [], key) {
  return key === 'projectile' || unlockedWeapons.includes(key);
}

export function getAllowedAbilityFlags(unlockedWeapons = []) {
  return unlockedWeapons.map((key) => META_WEAPON_FLAG_MAP[key]).filter(Boolean);
}
```

```js
// src/game/logic/progression.js
import { getAllowedAbilityFlags } from './abilityRoster.js';

export function getUpgradePool(player, metaConfig = {}) {
  const allowedUnlockFlags = new Set(getAllowedAbilityFlags(metaConfig.unlockedWeapons ?? []));

  return UPGRADE_DEFINITIONS.filter((entry) => {
    const available = entry.isAvailable ? entry.isAvailable(player) : true;
    if (!available) {
      return false;
    }
    if (!entry.key?.startsWith('unlock')) {
      return true;
    }

    const abilityKey = entry.key.replace(/^unlock/, '');
    const unlockFlag = `${abilityKey.charAt(0).toLowerCase()}${abilityKey.slice(1)}Unlocked`;
    return allowedUnlockFlags.has(unlockFlag);
  });
}
```

```js
// src/game/systems/UpgradeSystem.js
export class UpgradeSystem {
  getChoices(playerStats = {}, metaConfig = {}) {
    return rollUpgradeChoices(getUpgradePool(playerStats, metaConfig));
  }
}
```

```js
// src/game/entities/Player.js
export function applyMetaBonusesToStats(stats, metaBonuses = {}) {
  stats.maxHealth += metaBonuses.maxHealthBonus ?? 0;
  stats.health = Math.min(stats.maxHealth, stats.health + (metaBonuses.maxHealthBonus ?? 0));
  stats.pickupRadius += metaBonuses.pickupRadiusBonus ?? 0;
  stats.moveSpeedBonus += metaBonuses.moveSpeedBonus ?? 0;
  stats.metaRerolls = metaBonuses.rerollCharges ?? 0;
  stats.metaReviveUnlocked = Boolean(metaBonuses.reviveUnlocked);
  return stats;
}
```

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- tests/progression.test.js`

Expected: PASS with permanent unlock gating enforced on the run-time upgrade pool.

- [ ] **Step 5: Commit**

```bash
git add tests/progression.test.js src/game/entities/Player.js src/game/logic/abilityRoster.js src/game/logic/progression.js src/game/systems/UpgradeSystem.js
git commit -m "feat: gate run upgrades behind meta unlocks"
```

## Task 4: Add the Home Scene and Wire the Run Return Flow

**Files:**
- Create: `src/game/scenes/HomeScene.js`
- Modify: `src/main.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Create: `tests/homeScene.test.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { HomeScene } from '../src/game/scenes/HomeScene.js';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('HomeScene', () => {
  it('starts the game scene with the current meta profile', () => {
    const sceneLike = {
      metaProfile: {
        meta: { soulAsh: 30 },
        shop: { maxHealthLevel: 1 },
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: {}
      },
      scene: { start: vi.fn() }
    };

    HomeScene.prototype.startRun.call(sceneLike);

    expect(sceneLike.scene.start).toHaveBeenCalledWith(
      'game',
      expect.objectContaining({ metaProfile: sceneLike.metaProfile })
    );
  });
});

describe('GameScene meta flow', () => {
  it('returns the run summary to the home scene on game over', () => {
    const sceneLike = {
      elapsedMs: 93000,
      runStats: {
        eliteKills: 2,
        bossKills: 1,
        chestsOpened: 3,
        discoverySoulAsh: 10
      },
      metaProfile: {
        version: 1,
        meta: {
          soulAsh: 0,
          lifetimeSoulAshEarned: 0,
          totalRuns: 0,
          bestTimeMs: 0,
          eliteKills: 0,
          bossKills: 0,
          chestsOpened: 0
        },
        shop: {},
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: {}
      },
      scene: { start: vi.fn() }
    };

    GameScene.prototype.finishRun.call(sceneLike);

    expect(sceneLike.scene.start).toHaveBeenCalledWith(
      'home',
      expect.objectContaining({
        lastRunSummary: expect.objectContaining({ soulAshEarned: 44 })
      })
    );
  });
});
```

- [ ] **Step 2: Run the targeted tests**

Run: `npm test -- tests/homeScene.test.js tests/runtimeFlow.test.js`

Expected: FAIL because `HomeScene`, `finishRun`, and the new scene registration are not implemented yet.

- [ ] **Step 3: Implement the home scene shell and return flow**

```js
// src/main.js
import { HomeScene } from './game/scenes/HomeScene.js';
import { GameScene } from './game/scenes/GameScene.js';

const config = {
  // ...
  scene: [HomeScene, GameScene]
};
```

```js
// src/game/scenes/HomeScene.js
import Phaser from 'phaser';
import { loadMetaProfile } from '../meta/metaProgression.js';
import { createHomePanel } from '../ui/overlayFactory.js';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('home');
  }

  init(data = {}) {
    this.storage = data.storage ?? globalThis.localStorage;
    this.metaProfile = data.metaProfile ?? loadMetaProfile(this.storage);
    this.lastRunSummary = data.lastRunSummary ?? null;
  }

  create() {
    this.homePanel = createHomePanel(this);
    this.refreshHomePanels();
  }

  startRun() {
    this.scene.start('game', {
      metaProfile: this.metaProfile
    });
  }

  refreshHomePanels() {
    this.homePanel.update({
      soulAsh: this.metaProfile.meta.soulAsh,
      lastRunSummary: this.lastRunSummary
    });
  }
}
```

```js
// src/game/scenes/GameScene.js
import { applyMetaBonusesToStats } from '../entities/Player.js';
import { evaluateAchievements } from '../meta/achievementLedger.js';
import { calculateSoulAshReward } from '../meta/metaRewards.js';
import { saveMetaProfile } from '../meta/metaProgression.js';

applyMetaProfile(profile = {}) {
  this.metaProfile = profile;
  this.runMetaConfig = {
    unlockedWeapons: profile.unlocks?.weapons ?? ['projectile', 'blade', 'chain']
  };

  applyMetaBonusesToStats(this.player.stats, {
    maxHealthBonus: (profile.shop?.maxHealthLevel ?? 0) * 5,
    pickupRadiusBonus: (profile.shop?.pickupRadiusLevel ?? 0) * 8,
    moveSpeedBonus: (profile.shop?.moveSpeedLevel ?? 0) * 0.02,
    rerollCharges: profile.shop?.rerollLevel ?? 0,
    reviveUnlocked: profile.shop?.reviveUnlocked ?? false
  });
}

finishRun() {
  const reward = calculateSoulAshReward({
    timeMs: this.elapsedMs,
    ...this.runStats
  });

  const nextProfile = structuredClone(this.metaProfile);
  nextProfile.meta.soulAsh += reward.total;
  nextProfile.meta.lifetimeSoulAshEarned += reward.total;
  nextProfile.meta.totalRuns += 1;
  nextProfile.meta.bestTimeMs = Math.max(nextProfile.meta.bestTimeMs, this.elapsedMs);
  nextProfile.meta.eliteKills += this.runStats.eliteKills ?? 0;
  nextProfile.meta.bossKills += this.runStats.bossKills ?? 0;
  nextProfile.meta.chestsOpened += this.runStats.chestsOpened ?? 0;
  nextProfile.achievements = evaluateAchievements(nextProfile.achievements, {
    timeMs: this.elapsedMs,
    ...this.runStats
  });

  this.scene.start('home', {
    metaProfile: saveMetaProfile(globalThis.localStorage, nextProfile),
    lastRunSummary: {
      ...this.runStats,
      timeMs: this.elapsedMs,
      soulAshEarned: reward.total,
      soulAshRows: reward.rows
    }
  });
}
```

```js
// src/game/ui/overlayFactory.js
export function createHomePanel(scene) {
  const title = scene.add.text(0, 0, 'Sanctum', {
    fontFamily: 'Trebuchet MS',
    fontSize: '36px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });

  return {
    update(model) {
      title.setText(`Sanctum\nSoul Ash ${model.soulAsh}`);
    }
  };
}
```

- [ ] **Step 4: Re-run the targeted tests**

Run: `npm test -- tests/homeScene.test.js tests/runtimeFlow.test.js`

Expected: PASS with the new home-to-game and game-to-home scene flow.

- [ ] **Step 5: Commit**

```bash
git add tests/homeScene.test.js tests/runtimeFlow.test.js src/main.js src/game/scenes/HomeScene.js src/game/scenes/GameScene.js src/game/ui/overlayFactory.js
git commit -m "feat: add home scene and run return flow"
```

## Task 5: Finish Home Actions, Unlock Purchases, and Verification

**Files:**
- Modify: `src/game/scenes/HomeScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `src/game/meta/metaProgression.js`
- Modify: `src/game/meta/achievementLedger.js`
- Modify: `tests/homeScene.test.js`

- [ ] **Step 1: Write the failing tests for weapon unlock purchases and achievement claims**

```js
import { describe, expect, it, vi } from 'vitest';
import { HomeScene } from '../src/game/scenes/HomeScene.js';

describe('HomeScene progression actions', () => {
  it('buys permanent weapon unlocks', () => {
    const sceneLike = {
      metaProfile: {
        version: 1,
        meta: { soulAsh: 90, lifetimeSoulAshEarned: 90 },
        shop: {},
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: {}
      },
      refreshHomePanels: vi.fn()
    };

    HomeScene.prototype.buyWeaponUnlock.call(sceneLike, 'nova');

    expect(sceneLike.metaProfile.meta.soulAsh).toBe(30);
    expect(sceneLike.metaProfile.unlocks.weapons).toContain('nova');
  });

  it('claims unlocked achievement rewards', () => {
    const sceneLike = {
      metaProfile: {
        version: 1,
        meta: { soulAsh: 10, lifetimeSoulAshEarned: 10 },
        shop: {},
        unlocks: { weapons: ['projectile', 'blade', 'chain'] },
        achievements: { beatNecromancer: { unlocked: true, claimed: false } }
      },
      refreshHomePanels: vi.fn()
    };

    HomeScene.prototype.claimAchievement.call(sceneLike, 'beatNecromancer');

    expect(sceneLike.metaProfile.meta.soulAsh).toBe(30);
    expect(sceneLike.metaProfile.achievements.beatNecromancer.claimed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the targeted tests**

Run: `npm test -- tests/homeScene.test.js`

Expected: FAIL because weapon unlock purchases and achievement claims are not wired yet.

- [ ] **Step 3: Implement the final home actions and panel model**

```js
// src/game/meta/metaProgression.js
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
```

```js
// src/game/scenes/HomeScene.js
import { claimAchievementReward } from '../meta/achievementLedger.js';
import { purchaseWeaponUnlock, purchaseShopUpgrade, saveMetaProfile } from '../meta/metaProgression.js';

buyShopUpgrade(key) {
  this.metaProfile = saveMetaProfile(this.storage, purchaseShopUpgrade(this.metaProfile, key));
  this.refreshHomePanels();
}

buyWeaponUnlock(key) {
  this.metaProfile = saveMetaProfile(this.storage, purchaseWeaponUnlock(this.metaProfile, key));
  this.refreshHomePanels();
}

claimAchievement(key) {
  this.metaProfile = saveMetaProfile(this.storage, claimAchievementReward(this.metaProfile, key));
  this.refreshHomePanels();
}
```

```js
// src/game/ui/overlayFactory.js
export function buildHomeModel(profile, lastRunSummary, shopDefinitions, achievements) {
  return {
    soulAsh: profile.meta.soulAsh,
    lastRunSummary,
    shopRows: shopDefinitions.map((entry) => ({
      key: entry.key,
      currentLevel: profile.shop[entry.profileKey],
      purchased: typeof profile.shop[entry.profileKey] === 'boolean' ? profile.shop[entry.profileKey] : false
    })),
    unlockRows: profile.unlocks.weapons,
    achievementRows: achievements.map((entry) => ({
      key: entry.key,
      state: profile.achievements[entry.key] ?? { unlocked: false, claimed: false }
    }))
  };
}
```

- [ ] **Step 4: Run verification**

Run: `npm test -- tests/metaProgression.test.js tests/metaRewards.test.js tests/achievementLedger.test.js tests/homeScene.test.js tests/progression.test.js tests/runtimeFlow.test.js`

Expected: PASS across the meta modules, progression gating, and scene flow.

Run: `npm test`

Expected: PASS with no regressions in existing systems.

Run: `npm run build`

Expected: PASS with a clean production bundle.

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/game/meta src/game/scenes/HomeScene.js src/game/scenes/GameScene.js src/game/entities/Player.js src/game/logic/abilityRoster.js src/game/logic/progression.js src/game/systems/UpgradeSystem.js src/game/ui/overlayFactory.js tests/metaProgression.test.js tests/metaRewards.test.js tests/achievementLedger.test.js tests/homeScene.test.js tests/progression.test.js tests/runtimeFlow.test.js
git commit -m "feat: ship first pass of meta progression"
```
