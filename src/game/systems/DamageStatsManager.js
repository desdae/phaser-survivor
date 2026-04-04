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
    this.unlockedAtMs = Object.fromEntries(
      DAMAGE_STAT_DEFINITIONS.map((definition) => [definition.key, definition.key === 'projectile' ? 0 : null])
    );
  }

  record(weaponKey, damage) {
    if (!weaponKey || !Object.hasOwn(this.totals, weaponKey) || damage <= 0) {
      return;
    }

    this.totals[weaponKey] += damage;
  }

  unlock(weaponKey, elapsedMs) {
    if (!weaponKey || !Object.hasOwn(this.unlockedAtMs, weaponKey)) {
      return;
    }

    if (this.unlockedAtMs[weaponKey] !== null) {
      return;
    }

    this.unlockedAtMs[weaponKey] = Math.max(0, elapsedMs);
  }

  syncUnlockedWeapons(playerStats, elapsedMs) {
    this.unlock('projectile', 0);

    if (playerStats.bladeUnlocked) {
      this.unlock('blade', elapsedMs);
    }

    if (playerStats.chainUnlocked) {
      this.unlock('chain', elapsedMs);
    }

    if (playerStats.novaUnlocked) {
      this.unlock('nova', elapsedMs);
    }

    if (playerStats.boomerangUnlocked) {
      this.unlock('boomerang', elapsedMs);
    }

    if (playerStats.meteorUnlocked) {
      this.unlock('meteor', elapsedMs);
    }
  }

  getRows(elapsedMs) {
    return DAMAGE_STAT_DEFINITIONS.map((definition) => ({
      dps: getDamagePerSecond(
        this.totals[definition.key],
        this.unlockedAtMs[definition.key] === null ? 0 : Math.max(0, elapsedMs - this.unlockedAtMs[definition.key])
      ),
      key: definition.key,
      label: definition.label,
      totalDamage: this.totals[definition.key]
    }));
  }
}
