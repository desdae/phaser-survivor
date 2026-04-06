import { ENEMY_TYPES } from '../systems/EnemyManager.js';
import { UPGRADE_DEFINITIONS } from './progression.js';
import { isAbilityDiscovered, isEnemyDiscovered } from './journalDiscovery.js';

export const ENEMY_JOURNAL_ORDER = ['skeleton', 'zombie', 'bat', 'tough', 'spitter', 'poisonBlob'];

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

const ENEMY_REGISTRY = {
  skeleton: {
    name: 'Bone Walker',
    textureKey: 'mob-skeleton-1',
    attackType: 'Melee',
    specialAbilities: 'None',
    description: 'A brittle undead runner that keeps steady pressure on the player.'
  },
  zombie: {
    name: 'Rot Husk',
    textureKey: 'mob-zombie-1',
    attackType: 'Melee',
    specialAbilities: 'High durability for a small mob',
    description: 'A slow, stubborn corpse that soaks hits and clogs escape lines.'
  },
  bat: {
    name: 'Night Bat',
    textureKey: 'mob-bat-1',
    attackType: 'Melee swoop',
    specialAbilities: 'Fast pursuit',
    description: 'A fragile but speedy flier that snaps in from the edges of the swarm.'
  },
  tough: {
    name: 'Orc Brute',
    textureKey: 'mob-orc-1',
    attackType: 'Melee',
    specialAbilities: 'High endurance',
    description: 'A heavy bruiser that soaks damage and pushes through the swarm.'
  },
  spitter: {
    name: 'Grave Spitter',
    textureKey: 'mob-necromancer-1',
    attackType: 'Ranged spit',
    specialAbilities: 'Maintains standoff range and fires cursed projectiles.',
    description: 'A ranged grave caster that kites and spits from a safe distance.'
  },
  poisonBlob: {
    name: 'Blight Ooze',
    textureKey: 'mob-poison-1',
    attackType: 'Melee + poison trail',
    specialAbilities: 'Leaves toxic puddles and splits into two lesser poison blobbies on death.',
    description:
      'A slow, bloated ooze that fouls the ground and splits into two lesser poison blobbies when slain.'
  }
};

const ABILITY_REGISTRY = {
  projectile: {
    name: 'Auto Shot',
    iconKey: 'projectile',
    description: 'Your default magic missile attack that seeks nearby enemies.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.projectileDamage ?? 0) },
      { label: 'Speed', value: String(stats.projectileSpeed ?? 0) },
      { label: 'Cooldown', value: `${stats.fireCooldownMs ?? 0} ms` },
      { label: 'Projectiles', value: String(stats.projectileCount ?? 0) },
      { label: 'Pierce', value: String(stats.projectilePierce ?? 0), hideIfZero: true },
      { label: 'Ricochet', value: String(stats.projectileRicochet ?? 0), hideIfZero: true }
    ],
    upgradeKeys: ['damage', 'fireRate', 'multiShot', 'pierce', 'ricochet']
  },
  blade: {
    name: 'Orbiting Blade',
    iconKey: 'blade',
    description: 'A blade that circles the player and shreds nearby enemies.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.bladeDamage ?? 0) },
      { label: 'Count', value: String(stats.bladeCount ?? 0) },
      { label: 'Radius', value: String(stats.bladeOrbitRadius ?? 0) },
      { label: 'Orbit Speed', value: String(stats.bladeOrbitSpeed ?? 0) }
    ],
    upgradeKeys: ['bladeCount', 'bladeDamage', 'bladeSpeed', 'bladeRadius']
  },
  chain: {
    name: 'Storm Lash',
    iconKey: 'chain',
    description: 'A jagged lightning lash that jumps across nearby targets.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.chainDamage ?? 0) },
      { label: 'Links', value: String(stats.chainLinks ?? 0) },
      { label: 'Range', value: String(stats.chainRange ?? 0) },
      { label: 'Cooldown', value: `${stats.chainCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['chainDamage', 'chainLinks', 'chainRange', 'chainRate']
  },
  nova: {
    name: 'Pulse Engine',
    iconKey: 'nova',
    description: 'A close-range pulse burst that erupts in repeating echoes.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.novaDamage ?? 0) },
      { label: 'Radius', value: String(stats.novaRadius ?? 0) },
      { label: 'Echoes', value: String(stats.novaEchoCount ?? 0) },
      { label: 'Cooldown', value: `${stats.novaCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['novaDamage', 'novaRadius', 'novaEcho', 'novaRate']
  },
  boomerang: {
    name: 'Razor Boomerang',
    iconKey: 'boomerang',
    description: 'A sweeping thrown blade that flies out and returns.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.boomerangDamage ?? 0) },
      { label: 'Count', value: String(stats.boomerangCount ?? 0) },
      { label: 'Range', value: String(stats.boomerangRange ?? 0) },
      { label: 'Cooldown', value: `${stats.boomerangCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['boomerangDamage', 'boomerangCount', 'boomerangRange', 'boomerangRate']
  },
  meteor: {
    name: 'Starcall',
    iconKey: 'meteor-fall',
    description: 'Calls delayed meteors onto clustered enemies.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.meteorDamage ?? 0) },
      { label: 'Radius', value: String(stats.meteorRadius ?? 0) },
      { label: 'Count', value: String(stats.meteorCount ?? 0) },
      { label: 'Cooldown', value: `${stats.meteorCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['meteorDamage', 'meteorRadius', 'meteorCount', 'meteorRate']
  },
  burstRifle: {
    name: 'Burst Rifle',
    iconKey: 'burst-rifle-projectile',
    description: 'A mouse-aimed rifle that spits rapid shots at the cursor.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.burstRifleDamage ?? 0) },
      { label: 'Speed', value: String(stats.burstRifleProjectileSpeed ?? 0) },
      { label: 'Cooldown', value: `${stats.burstRifleCooldownMs ?? 0} ms` },
      { label: 'Burst Count', value: String(stats.burstRifleBurstCount ?? 0) },
      { label: 'Spread', value: `${stats.burstRifleSpreadDeg ?? 0} deg` }
    ],
    upgradeKeys: ['burstRifleDamage', 'burstRifleRate', 'burstRifleBurst']
  },
  lance: {
    name: 'Piercing Lance',
    iconKey: 'lance',
    description: 'A mouse-aimed line strike that tears through enemies.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.lanceDamage ?? 0) },
      { label: 'Length', value: String(stats.lanceLength ?? 0) },
      { label: 'Width', value: String(stats.lanceWidth ?? 0) },
      { label: 'Cooldown', value: `${stats.lanceCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['lanceDamage', 'lanceLength', 'lanceRate']
  },
  flamethrower: {
    name: 'Flamethrower',
    iconKey: 'flame-puff-1',
    description: 'A short cone of fire that melts enemies in front of the player.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.flamethrowerDamage ?? 0) },
      { label: 'Range', value: String(stats.flamethrowerRange ?? 0) },
      { label: 'Arc', value: `${stats.flamethrowerArcDeg ?? 0} deg` },
      { label: 'Cooldown', value: `${stats.flamethrowerCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['flamethrowerDamage', 'flamethrowerRange', 'flamethrowerRate']
  },
  runeTrap: {
    name: 'Rune Trap',
    iconKey: 'rune-trap',
    description: 'A delayed trap that arms at the cursor and detonates on contact.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.runeTrapDamage ?? 0) },
      { label: 'Radius', value: String(stats.runeTrapRadius ?? 0) },
      { label: 'Charges', value: String(stats.runeTrapCharges ?? 0) },
      { label: 'Arm Time', value: `${stats.runeTrapArmMs ?? 0} ms` },
      { label: 'Cooldown', value: `${stats.runeTrapCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['runeTrapDamage', 'runeTrapRadius', 'runeTrapCharges']
  },
  arcMine: {
    name: 'Arc Mine',
    iconKey: 'arc-mine',
    description: 'A cursor-triggered mine that chains lightning through nearby enemies.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.arcMineDamage ?? 0) },
      { label: 'Chains', value: String(stats.arcMineChains ?? 0) },
      { label: 'Trigger Radius', value: String(stats.arcMineTriggerRadius ?? 0) },
      { label: 'Chain Range', value: String(stats.arcMineChainRange ?? 0) },
      { label: 'Cooldown', value: `${stats.arcMineCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['arcMineDamage', 'arcMineChains', 'arcMineRadius']
  },
  spearBarrage: {
    name: 'Spear Barrage',
    iconKey: 'spear-barrage',
    description: 'Calls a cursor-targeted rain of falling spears.',
    statRows: (stats) => [
      { label: 'Damage', value: String(stats.spearBarrageDamage ?? 0) },
      { label: 'Count', value: String(stats.spearBarrageCount ?? 0) },
      { label: 'Radius', value: String(stats.spearBarrageRadius ?? 0) },
      { label: 'Cooldown', value: `${stats.spearBarrageCooldownMs ?? 0} ms` }
    ],
    upgradeKeys: ['spearBarrageDamage', 'spearBarrageCount', 'spearBarrageRadius']
  }
};

function getUnknownEnemyDetail() {
  return {
    title: '???',
    textureKey: null,
    rows: [],
    specialAbilities: '???',
    description: 'An unknown threat. Encounter it in the field to record its details.'
  };
}

function filterAbilityStatRows(rows = []) {
  return rows
    .filter(Boolean)
    .filter((row) => {
      if (!row.hideIfZero) {
        return true;
      }

      const numericValue = Number.parseFloat(String(row.value));
      return Number.isNaN(numericValue) || numericValue !== 0;
    })
    .map(({ hideIfZero, ...row }) => row);
}

function getUnknownAbilityDetail() {
  return {
    title: '???',
    iconKey: null,
    rows: [],
    upgradePaths: [],
    description: 'An unknown technique. Learn it to reveal its combat notes.'
  };
}

function getUpgradePaths(upgradeKeys) {
  return upgradeKeys
    .map((key) => UPGRADE_DEFINITIONS.find((entry) => entry.key === key))
    .filter(Boolean)
    .map((entry) => ({
      label: entry.label,
      value: entry.description
    }));
}

export function buildEnemyJournalList(discoveryState) {
  return ENEMY_JOURNAL_ORDER.map((key) => ({
    key,
    discovered: isEnemyDiscovered(discoveryState, key),
    label: isEnemyDiscovered(discoveryState, key) ? ENEMY_REGISTRY[key].name : '???',
    textureKey: ENEMY_REGISTRY[key].textureKey
  }));
}

export function buildAbilityJournalList(discoveryState) {
  return ABILITY_JOURNAL_ORDER.map((key) => ({
    key,
    discovered: isAbilityDiscovered(discoveryState, key),
    label: isAbilityDiscovered(discoveryState, key) ? ABILITY_REGISTRY[key].name : '???',
    iconKey: ABILITY_REGISTRY[key].iconKey
  }));
}

export function buildEnemyJournalDetail(key, discoveryState) {
  if (!isEnemyDiscovered(discoveryState, key)) {
    return getUnknownEnemyDetail();
  }

  const entry = ENEMY_REGISTRY[key];
  const type = ENEMY_TYPES[key];
  const rows = [
    { label: 'HP', value: String(type.maxHealth) },
    { label: 'Damage', value: type.projectileDamage ? `${type.projectileDamage} projectile` : `${type.contactDamage} contact` },
    { label: 'Speed', value: String(type.speed) },
    { label: 'Attack', value: entry.attackType }
  ];

  if (type.attackRange) {
    rows.push({ label: 'Range', value: String(type.attackRange) });
  }

  return {
    title: entry.name,
    textureKey: entry.textureKey,
    rows,
    specialAbilities: entry.specialAbilities,
    description: entry.description
  };
}

export function buildAbilityJournalDetail(key, discoveryState, playerStats = {}) {
  if (!isAbilityDiscovered(discoveryState, key)) {
    return getUnknownAbilityDetail();
  }

  const entry = ABILITY_REGISTRY[key];

  return {
    title: entry.name,
    iconKey: entry.iconKey,
    rows: filterAbilityStatRows(entry.statRows(playerStats)),
    upgradePaths: getUpgradePaths(entry.upgradeKeys),
    description: entry.description
  };
}

export function buildJournalPayload({
  activeTab = 'enemies',
  selectedByTab = { enemies: null, abilities: null },
  discoveryState,
  playerStats = {}
}) {
  const enemies = buildEnemyJournalList(discoveryState);
  const abilities = buildAbilityJournalList(discoveryState);
  const activeEntries = activeTab === 'enemies' ? enemies : abilities;
  const selectedKey = selectedByTab[activeTab] ?? activeEntries[0]?.key ?? null;
  const detail =
    activeTab === 'enemies'
      ? buildEnemyJournalDetail(selectedKey, discoveryState)
      : buildAbilityJournalDetail(selectedKey, discoveryState, playerStats);

  return {
    activeTab,
    selectedKey,
    enemies,
    abilities,
    detail
  };
}
