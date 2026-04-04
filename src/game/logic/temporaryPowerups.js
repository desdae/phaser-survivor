export const POWERUP_DURATION_MS = 30000;
export const POWERUP_DROP_CHANCE_BY_SOURCE = {
  normal: 0.015,
  elite: 0.06
};
export const POWERUP_KEYS = ['frenzy', 'overcharge', 'volley'];

const POWERUP_LABELS = {
  frenzy: 'Frenzy',
  overcharge: 'Overcharge',
  volley: 'Volley'
};

const FRENZY_SCALAR_PER_STACK = 0.7;
const OVERCHARGE_BONUS_PER_STACK = 0.4;
const MIN_COOLDOWN_MS = 60;

const COOLDOWN_KEYS = [
  'fireCooldownMs',
  'chainCooldownMs',
  'novaCooldownMs',
  'boomerangCooldownMs',
  'meteorCooldownMs'
];

const DAMAGE_KEYS = [
  'projectileDamage',
  'bladeDamage',
  'chainDamage',
  'novaDamage',
  'boomerangDamage',
  'meteorDamage'
];

const VOLLEY_KEYS = [
  'projectileCount',
  'bladeCount',
  'chainLinks',
  'novaEchoCount',
  'boomerangCount',
  'meteorCount'
];

export function rollPowerupDrop({ isElite = false, roll = Math.random(), keyRoll = Math.random() } = {}) {
  const chance = isElite ? POWERUP_DROP_CHANCE_BY_SOURCE.elite : POWERUP_DROP_CHANCE_BY_SOURCE.normal;

  if (roll >= chance) {
    return null;
  }

  const index = Math.min(POWERUP_KEYS.length - 1, Math.floor(keyRoll * POWERUP_KEYS.length));
  return POWERUP_KEYS[index];
}

export function createPowerupStack(buffKey, now) {
  return {
    buffKey,
    expiresAt: now + POWERUP_DURATION_MS
  };
}

export function pruneExpiredStacks(stacks, now) {
  return (stacks ?? []).filter((stack) => stack.expiresAt > now);
}

function countStacks(stacks, now) {
  const counts = {
    frenzy: 0,
    overcharge: 0,
    volley: 0
  };

  for (const stack of pruneExpiredStacks(stacks, now)) {
    if (counts[stack.buffKey] !== undefined) {
      counts[stack.buffKey] += 1;
    }
  }

  return counts;
}

export function getEffectiveStats(baseStats, stacks, now) {
  const counts = countStacks(stacks, now);
  const effective = { ...baseStats };
  const frenzyScalar = FRENZY_SCALAR_PER_STACK ** counts.frenzy;
  const damageScalar = 1 + counts.overcharge * OVERCHARGE_BONUS_PER_STACK;

  COOLDOWN_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] = Math.max(MIN_COOLDOWN_MS, Math.round(effective[key] * frenzyScalar));
    }
  });

  DAMAGE_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] *= damageScalar;
    }
  });

  VOLLEY_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] += counts.volley;
    }
  });

  return effective;
}

export function buildPowerupSummaryRows(stacks, now) {
  const activeStacks = pruneExpiredStacks(stacks, now);

  return POWERUP_KEYS.map((buffKey) => {
    const matchingStacks = activeStacks.filter((stack) => stack.buffKey === buffKey);

    if (matchingStacks.length === 0) {
      return null;
    }

    const nextExpiresAt = Math.min(...matchingStacks.map((stack) => stack.expiresAt));

    return {
      buffKey,
      label: POWERUP_LABELS[buffKey],
      stacks: matchingStacks.length,
      secondsLeft: Math.max(0, Math.ceil((nextExpiresAt - now) / 1000))
    };
  }).filter(Boolean);
}
