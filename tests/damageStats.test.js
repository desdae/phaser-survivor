import { describe, expect, it } from 'vitest';
import {
  DAMAGE_STAT_DEFINITIONS,
  DamageStatsManager,
  getDamagePerSecond
} from '../src/game/systems/DamageStatsManager.js';

describe('getDamagePerSecond', () => {
  it('returns zero before a run has elapsed', () => {
    expect(getDamagePerSecond(120, 0)).toBe(0);
  });

  it('returns run-average dps when time has elapsed', () => {
    expect(getDamagePerSecond(120, 30000)).toBeCloseTo(4, 3);
  });
});

describe('DamageStatsManager', () => {
  it('tracks totals by weapon and exposes ordered stat rows', () => {
    const manager = new DamageStatsManager();

    manager.record('projectile', 18);
    manager.record('projectile', 12);
    manager.unlock('meteor', 0);
    manager.record('meteor', 40);

    const rows = manager.getRows(10000);

    expect(rows.map((row) => row.key)).toEqual(['projectile', 'meteor']);
    expect(rows.find((row) => row.key === 'projectile')).toMatchObject({
      dps: 3,
      label: 'Auto Shot',
      totalDamage: 30
    });
    expect(rows.find((row) => row.key === 'meteor')).toMatchObject({
      dps: 4,
      label: 'Starcall',
      totalDamage: 40
    });
  });

  it('ignores unknown weapons and non-positive damage', () => {
    const manager = new DamageStatsManager();

    manager.record('unknown', 30);
    manager.record('projectile', 0);

    expect(manager.getRows(5000).every((row) => row.totalDamage === 0)).toBe(true);
  });

  it('calculates dps from the moment a weapon was unlocked', () => {
    const manager = new DamageStatsManager();

    manager.unlock('blade', 20000);
    manager.record('blade', 60);

    const rows = manager.getRows(30000);

    expect(rows.find((row) => row.key === 'blade')).toMatchObject({
      dps: 6,
      totalDamage: 60
    });
  });

  it('only returns rows for learned weapons', () => {
    const manager = new DamageStatsManager();

    manager.record('projectile', 30);
    manager.record('meteor', 90);

    expect(manager.getRows(10000).map((row) => row.key)).toEqual(['projectile']);

    manager.unlock('meteor', 4000);

    expect(manager.getRows(10000).map((row) => row.key)).toEqual(['projectile', 'meteor']);
  });

  it('adds newly learned abilities to the damage table only after unlock', () => {
    const manager = new DamageStatsManager();

    expect(manager.getRows(1000).map((row) => row.key)).toEqual(['projectile']);

    manager.unlock('burstRifle', 1200);
    manager.record('burstRifle', 40);

    expect(manager.getRows(2200).map((row) => row.key)).toEqual(['projectile', 'burstRifle']);
  });

  it('keeps base shot and burst rifle damage in separate rows', () => {
    const manager = new DamageStatsManager();

    manager.unlock('burstRifle', 1000);
    manager.record('projectile', 25);
    manager.record('burstRifle', 40);

    const rows = manager.getRows(5000);

    expect(rows.find((row) => row.key === 'projectile')).toMatchObject({
      totalDamage: 25
    });
    expect(rows.find((row) => row.key === 'burstRifle')).toMatchObject({
      totalDamage: 40
    });
  });
});
