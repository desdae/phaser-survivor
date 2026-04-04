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
});
