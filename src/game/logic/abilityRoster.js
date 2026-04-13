export const ABILITY_CAP = 8;

export const ABILITY_FLAGS = [
  ['blade', 'bladeUnlocked'],
  ['chain', 'chainUnlocked'],
  ['nova', 'novaUnlocked'],
  ['boomerang', 'boomerangUnlocked'],
  ['meteor', 'meteorUnlocked'],
  ['burstRifle', 'burstRifleUnlocked'],
  ['flamethrower', 'flamethrowerUnlocked'],
  ['runeTrap', 'runeTrapUnlocked'],
  ['lance', 'lanceUnlocked'],
  ['arcMine', 'arcMineUnlocked'],
  ['spearBarrage', 'spearBarrageUnlocked']
];

const META_WEAPON_FLAG_MAP = Object.fromEntries(ABILITY_FLAGS);

export function getOwnedAbilityKeys(player) {
  return [
    'projectile',
    ...ABILITY_FLAGS.filter(([, flag]) => Boolean(player?.[flag])).map(([key]) => key)
  ];
}

export function countLearnedAbilities(player) {
  return getOwnedAbilityKeys(player).length;
}

export function canLearnAbility(player, unlockFlag) {
  if (player?.[unlockFlag]) {
    return false;
  }

  return countLearnedAbilities(player) < ABILITY_CAP;
}

export function isAbilityUnlockedInMeta(unlockedWeapons = [], key) {
  return key === 'projectile' || unlockedWeapons.includes(key);
}

export function getAllowedAbilityFlags(unlockedWeapons = []) {
  return unlockedWeapons
    .map((key) => META_WEAPON_FLAG_MAP[key])
    .filter(Boolean);
}
