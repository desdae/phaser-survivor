export const DAMAGE_STAT_DEFINITIONS = [
  { key: 'projectile', label: 'Auto Shot' },
  { key: 'blade', label: 'Orbiting Blade' },
  { key: 'chain', label: 'Storm Lash' },
  { key: 'nova', label: 'Pulse Engine' },
  { key: 'boomerang', label: 'Razor Boomerang' },
  { key: 'meteor', label: 'Starcall' }
];

export function getDamagePerSecond(totalDamage, elapsedMs) {
  if (elapsedMs <= 0) {
    return 0;
  }

  return totalDamage / (elapsedMs / 1000);
}

export class DamageStatsManager {
  constructor() {
    this.totals = Object.fromEntries(
      DAMAGE_STAT_DEFINITIONS.map((definition) => [definition.key, 0])
    );
  }

  record(weaponKey, damage) {
    if (!weaponKey || !Object.hasOwn(this.totals, weaponKey) || damage <= 0) {
      return;
    }

    this.totals[weaponKey] += damage;
  }

  getRows(elapsedMs) {
    return DAMAGE_STAT_DEFINITIONS.map((definition) => ({
      dps: getDamagePerSecond(this.totals[definition.key], elapsedMs),
      key: definition.key,
      label: definition.label,
      totalDamage: this.totals[definition.key]
    }));
  }
}
