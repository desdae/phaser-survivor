import { isAbilityDiscovered, isEnemyDiscovered } from './journalDiscovery.js';

export const ENEMY_JOURNAL_ORDER = ['basic', 'tough', 'spitter'];

export const ABILITY_JOURNAL_ORDER = [
  'projectile',
  'blade',
  'chain',
  'nova',
  'boomerang',
  'meteor',
  'burstRifle',
  'lance',
  'flamethrower',
  'runeTrap',
  'arcMine',
  'spearBarrage'
];

const ENEMY_NAMES = {
  basic: 'Grave Runner',
  tough: 'Orc Brute',
  spitter: 'Grave Spitter'
};

const ABILITY_NAMES = {
  projectile: 'Auto Shot',
  blade: 'Orbiting Blade',
  chain: 'Storm Lash',
  nova: 'Pulse Engine',
  boomerang: 'Razor Boomerang',
  meteor: 'Starcall',
  burstRifle: 'Burst Rifle',
  lance: 'Piercing Lance',
  flamethrower: 'Flamethrower',
  runeTrap: 'Rune Trap',
  arcMine: 'Arc Mine',
  spearBarrage: 'Spear Barrage'
};

export function buildEnemyJournalList(discoveryState) {
  return ENEMY_JOURNAL_ORDER.map((key) => ({
    key,
    discovered: isEnemyDiscovered(discoveryState, key),
    label: isEnemyDiscovered(discoveryState, key) ? ENEMY_NAMES[key] : '???'
  }));
}

export function buildAbilityJournalList(discoveryState) {
  return ABILITY_JOURNAL_ORDER.map((key) => ({
    key,
    discovered: isAbilityDiscovered(discoveryState, key),
    label: isAbilityDiscovered(discoveryState, key) ? ABILITY_NAMES[key] : '???'
  }));
}
