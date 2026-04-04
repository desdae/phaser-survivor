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
