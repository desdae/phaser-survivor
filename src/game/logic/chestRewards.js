import { applyUpgrade } from './progression.js';
import { ABILITY_CAP, countLearnedAbilities } from './abilityRoster.js';

const WEAPON_UNLOCK_ORDER = [
  ['bladeUnlocked', 'unlockBlade'],
  ['chainUnlocked', 'unlockChain'],
  ['novaUnlocked', 'unlockNova'],
  ['boomerangUnlocked', 'unlockBoomerang'],
  ['meteorUnlocked', 'unlockMeteor'],
  ['burstRifleUnlocked', 'unlockBurstRifle'],
  ['flamethrowerUnlocked', 'unlockFlamethrower'],
  ['runeTrapUnlocked', 'unlockRuneTrap'],
  ['lanceUnlocked', 'unlockLance'],
  ['arcMineUnlocked', 'unlockArcMine'],
  ['spearBarrageUnlocked', 'unlockSpearBarrage']
];

function getPlayerStats(player) {
  return player?.stats ?? player ?? {};
}

function hasLockedWeapon(player) {
  return countLearnedAbilities(player) < ABILITY_CAP && WEAPON_UNLOCK_ORDER.some(([flag]) => !player[flag]);
}

function unlockFirstMissingWeapon(player) {
  const nextUnlock = WEAPON_UNLOCK_ORDER.find(([flag]) => !player[flag]);

  if (!nextUnlock) {
    applyUpgrade(player, 'damage');
    return;
  }

  applyUpgrade(player, nextUnlock[1]);
}

function resolveChestReward(stats, rewardKey) {
  if (rewardKey === 'arsenalDraft' && countLearnedAbilities(stats) >= ABILITY_CAP) {
    return 'relicDamage';
  }

  return rewardKey;
}

const CHEST_REWARD_DEFINITIONS = [
  {
    key: 'relicDamage',
    label: 'Relic: Impact',
    description: '+14 projectile damage',
    apply(player) {
      player.projectileDamage += 14;
    }
  },
  {
    key: 'relicFrenzy',
    label: 'Relic: Frenzy',
    description: '-120ms fire cooldown',
    apply(player) {
      player.fireCooldownMs = Math.max(140, player.fireCooldownMs - 120);
    }
  },
  {
    key: 'vitalSurge',
    label: 'Vital Surge',
    description: 'Restore 40 health',
    apply(player) {
      player.health = Math.min(player.maxHealth, player.health + 40);
    }
  },
  {
    key: 'soulMagnet',
    label: 'Soul Magnet',
    description: 'Pull nearby pickups to you',
    apply(player, pickupManager, playerEntity) {
      pickupManager?.pullNearbyToPlayer?.(playerEntity?.sprite ?? playerEntity ?? player, 260, 440);
    }
  },
  {
    key: 'arsenalDraft',
    label: 'Arsenal Draft',
    description: 'Unlock the first weapon you are still missing',
    isAvailable: hasLockedWeapon,
    apply(player) {
      unlockFirstMissingWeapon(player);
    }
  }
];

export function getChestRewardPool(player) {
  const stats = getPlayerStats(player);
  return CHEST_REWARD_DEFINITIONS.filter((reward) => (reward.isAvailable ? reward.isAvailable(stats) : true));
}

export function rollChestChoices(pool, rng = Math.random, count = 3) {
  const bag = [...pool];
  const picks = [];

  while (bag.length > 0 && picks.length < count) {
    const index = Math.floor(rng() * bag.length);
    picks.push(...bag.splice(index, 1));
  }

  return picks;
}

export function applyChestReward(player, reward, pickupManager) {
  const rawKey = typeof reward === 'string' ? reward : reward?.key;
  const stats = getPlayerStats(player);
  const playerEntity = player;
  const key = resolveChestReward(stats, rawKey);
  const resolvedDefinition = CHEST_REWARD_DEFINITIONS.find((entry) => entry.key === key);

  if (!resolvedDefinition) {
    throw new Error(`Unknown chest reward: ${key}`);
  }

  resolvedDefinition.apply(stats, pickupManager, playerEntity);
}
