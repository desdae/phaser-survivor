import { describe, expect, it } from 'vitest';
import {
  buildWeaponTooltipMap,
  buildWeaponTooltipRows
} from '../src/game/logic/weaponTooltips.js';

describe('buildWeaponTooltipRows', () => {
  it('returns a compact permanent stat sheet for auto shot', () => {
    const rows = buildWeaponTooltipRows('projectile', {
      projectileDamage: 34,
      fireCooldownMs: 410,
      projectileCount: 3,
      projectilePierce: 1,
      projectileRicochet: 2,
      projectileSpeed: 440
    });

    expect(rows).toEqual([
      { label: 'Damage', value: '34' },
      { label: 'Cooldown', value: '0.41s' },
      { label: 'Projectiles', value: '3' },
      { label: 'Pierce', value: '1' },
      { label: 'Ricochets', value: '2' },
      { label: 'Speed', value: '440' }
    ]);
  });

  it('omits irrelevant values and returns only meaningful fields for burst rifle', () => {
    const rows = buildWeaponTooltipRows('burstRifle', {
      burstRifleUnlocked: true,
      burstRifleDamage: 17,
      burstRifleCooldownMs: 180,
      burstRifleBurstCount: 5,
      burstRifleProjectileSpeed: 760,
      projectileDamage: 999
    });

    expect(rows).toEqual([
      { label: 'Damage', value: '17' },
      { label: 'Cooldown', value: '0.18s' },
      { label: 'Burst', value: '5' },
      { label: 'Speed', value: '760' }
    ]);
  });
});

describe('buildWeaponTooltipMap', () => {
  it('only returns tooltip data for learned weapons', () => {
    const tooltipMap = buildWeaponTooltipMap({
      projectileDamage: 22,
      fireCooldownMs: 520,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileSpeed: 440,
      bladeUnlocked: true,
      bladeDamage: 24,
      bladeCount: 2,
      bladeOrbitRadius: 52,
      bladeOrbitSpeed: 1.6,
      meteorUnlocked: false,
      meteorDamage: 40,
      meteorCount: 2
    });

    expect(Object.keys(tooltipMap)).toEqual(['projectile', 'blade']);
    expect(tooltipMap.meteor).toBeUndefined();
    expect(tooltipMap.blade).toMatchObject({
      title: 'Orbiting Blade'
    });
  });
});
