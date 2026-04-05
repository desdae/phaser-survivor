import { getOwnedAbilityKeys } from './abilityRoster.js';

const WEAPON_TITLES = {
  projectile: 'Auto Shot',
  blade: 'Orbiting Blade',
  chain: 'Storm Lash',
  nova: 'Pulse Engine',
  boomerang: 'Razor Boomerang',
  meteor: 'Starcall',
  burstRifle: 'Burst Rifle',
  flamethrower: 'Flamethrower',
  runeTrap: 'Rune Trap',
  lance: 'Piercing Lance',
  arcMine: 'Arc Mine',
  spearBarrage: 'Spear Barrage'
};

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function formatSeconds(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '';
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDegrees(degrees) {
  if (!Number.isFinite(degrees) || degrees <= 0) {
    return '';
  }

  return `${formatNumber(degrees)} deg`;
}

function row(label, value) {
  if (value === null || value === undefined || value === '' || value === '0' || value === '0.0') {
    return null;
  }

  return { label, value: String(value) };
}

const TOOLTIP_BUILDERS = {
  projectile: (stats) => [
    row('Damage', formatNumber(stats.projectileDamage)),
    row('Cooldown', formatSeconds(stats.fireCooldownMs)),
    row('Projectiles', formatNumber(stats.projectileCount)),
    row('Pierce', formatNumber(stats.projectilePierce)),
    row('Ricochets', formatNumber(stats.projectileRicochet)),
    row('Speed', formatNumber(stats.projectileSpeed))
  ],
  blade: (stats) => [
    row('Damage', formatNumber(stats.bladeDamage)),
    row('Blades', formatNumber(stats.bladeCount)),
    row('Radius', formatNumber(stats.bladeOrbitRadius)),
    row('Orbit Speed', formatNumber(stats.bladeOrbitSpeed))
  ],
  chain: (stats) => [
    row('Damage', formatNumber(stats.chainDamage)),
    row('Cooldown', formatSeconds(stats.chainCooldownMs)),
    row('Links', formatNumber(stats.chainLinks)),
    row('Range', formatNumber(stats.chainRange))
  ],
  nova: (stats) => [
    row('Damage', formatNumber(stats.novaDamage)),
    row('Cooldown', formatSeconds(stats.novaCooldownMs)),
    row('Radius', formatNumber(stats.novaRadius)),
    row('Echoes', formatNumber(stats.novaEchoCount))
  ],
  boomerang: (stats) => [
    row('Damage', formatNumber(stats.boomerangDamage)),
    row('Cooldown', formatSeconds(stats.boomerangCooldownMs)),
    row('Boomerangs', formatNumber(stats.boomerangCount)),
    row('Range', formatNumber(stats.boomerangRange))
  ],
  meteor: (stats) => [
    row('Damage', formatNumber(stats.meteorDamage)),
    row('Cooldown', formatSeconds(stats.meteorCooldownMs)),
    row('Meteors', formatNumber(stats.meteorCount)),
    row('Radius', formatNumber(stats.meteorRadius))
  ],
  burstRifle: (stats) => [
    row('Damage', formatNumber(stats.burstRifleDamage)),
    row('Cooldown', formatSeconds(stats.burstRifleCooldownMs)),
    row('Burst', formatNumber(stats.burstRifleBurstCount)),
    row('Speed', formatNumber(stats.burstRifleProjectileSpeed))
  ],
  flamethrower: (stats) => [
    row('Damage', formatNumber(stats.flamethrowerDamage)),
    row('Cooldown', formatSeconds(stats.flamethrowerCooldownMs)),
    row('Range', formatNumber(stats.flamethrowerRange)),
    row('Arc', formatDegrees(stats.flamethrowerArcDeg))
  ],
  runeTrap: (stats) => [
    row('Damage', formatNumber(stats.runeTrapDamage)),
    row('Cooldown', formatSeconds(stats.runeTrapCooldownMs)),
    row('Charges', formatNumber(stats.runeTrapCharges)),
    row('Radius', formatNumber(stats.runeTrapRadius)),
    row('Arm Time', formatSeconds(stats.runeTrapArmMs))
  ],
  lance: (stats) => [
    row('Damage', formatNumber(stats.lanceDamage)),
    row('Cooldown', formatSeconds(stats.lanceCooldownMs)),
    row('Range', formatNumber(stats.lanceLength)),
    row('Width', formatNumber(stats.lanceWidth))
  ],
  arcMine: (stats) => [
    row('Damage', formatNumber(stats.arcMineDamage)),
    row('Cooldown', formatSeconds(stats.arcMineCooldownMs)),
    row('Trigger', formatNumber(stats.arcMineTriggerRadius)),
    row('Chains', formatNumber(stats.arcMineChains)),
    row('Chain Range', formatNumber(stats.arcMineChainRange))
  ],
  spearBarrage: (stats) => [
    row('Damage', formatNumber(stats.spearBarrageDamage)),
    row('Cooldown', formatSeconds(stats.spearBarrageCooldownMs)),
    row('Spears', formatNumber(stats.spearBarrageCount)),
    row('Radius', formatNumber(stats.spearBarrageRadius))
  ]
};

export function buildWeaponTooltipRows(key, stats) {
  return (TOOLTIP_BUILDERS[key]?.(stats) ?? []).filter(Boolean);
}

export function buildWeaponTooltipMap(stats) {
  return Object.fromEntries(
    getOwnedAbilityKeys(stats).map((key) => [
      key,
      {
        key,
        title: WEAPON_TITLES[key],
        rows: buildWeaponTooltipRows(key, stats)
      }
    ])
  );
}
