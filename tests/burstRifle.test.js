import { describe, expect, it } from 'vitest';
import { BurstRifleManager } from '../src/game/systems/BurstRifleManager.js';

describe('BurstRifleManager', () => {
  it('fires a burst rifle projectile stream toward the mouse direction on cooldown', () => {
    const shots = [];
    const manager = new BurstRifleManager({
      addShot: (shot) => shots.push(shot)
    });
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      burstRifleUnlocked: true,
      burstRifleDamage: 9,
      burstRifleCooldownMs: 180,
      burstRifleBurstCount: 1,
      burstRifleProjectileSpeed: 640,
      burstRifleSpreadDeg: 0
    };

    manager.update(player, stats, { x: 1, y: 0 }, 1000);
    manager.update(player, stats, { x: 1, y: 0 }, 1100);
    manager.update(player, stats, { x: 1, y: 0 }, 1180);

    expect(shots).toHaveLength(2);
    expect(shots[0].damage).toBe(9);
    expect(shots[0].direction).toEqual({ x: 1, y: 0 });
  });

  it('uses the burst-rifle bullet texture and angles shots to match travel direction', () => {
    const firedProjectiles = [];
    const manager = new BurstRifleManager({
      fireProjectile: (origin, direction, stats, now, options) => {
        const projectile = {
          damage: stats.projectileDamage,
          direction,
          now,
          options
        };
        firedProjectiles.push(projectile);
        return projectile;
      }
    });
    const player = { sprite: { x: 12, y: 24 } };
    const stats = {
      burstRifleUnlocked: true,
      burstRifleDamage: 11,
      burstRifleCooldownMs: 180,
      burstRifleBurstCount: 1,
      burstRifleProjectileSpeed: 700,
      burstRifleSpreadDeg: 0
    };

    manager.update(player, stats, { x: 0, y: 1 }, 500);

    expect(firedProjectiles).toHaveLength(1);
    expect(firedProjectiles[0].options).toMatchObject({
      textureKey: 'burst-rifle-projectile',
      weaponKey: 'burstRifle'
    });
    expect(firedProjectiles[0].options.rotation).toBeCloseTo(Math.PI / 2, 5);
  });
});
