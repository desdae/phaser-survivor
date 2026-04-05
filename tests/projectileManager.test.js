import { describe, expect, it, vi } from 'vitest';
import { ProjectileManager } from '../src/game/systems/ProjectileManager.js';

function createProjectile() {
  return {
    active: false,
    body: { enable: false },
    setActive: vi.fn(function setActive(value) {
      this.active = value;
      return this;
    }),
    setVisible: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setCircle: vi.fn().mockReturnThis(),
    setVelocity: vi.fn().mockReturnThis(),
    setTexture: vi.fn(function setTexture(value) {
      this.textureKey = value;
      return this;
    }),
    setRotation: vi.fn(function setRotation(value) {
      this.rotation = value;
      return this;
    }),
    textureKey: 'projectile',
    rotation: 0,
    weaponKey: 'projectile'
  };
}

describe('ProjectileManager', () => {
  it('resets pooled projectile texture, rotation, and weapon key on spawn', () => {
    const reusedProjectile = createProjectile();
    const scene = {
      physics: {
        add: {
          group: () => ({
            create: vi.fn(() => createProjectile()),
            getChildren: () => [reusedProjectile],
            children: {
              iterate: vi.fn()
            }
          })
        }
      }
    };
    const manager = new ProjectileManager(scene);

    manager.fireProjectile(
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      {
        projectileDamage: 10,
        projectilePierce: 0,
        projectileRicochet: 0,
        projectileSpeed: 600
      },
      1200,
      {
        textureKey: 'burst-rifle-projectile',
        rotation: Math.PI / 2,
        weaponKey: 'burstRifle'
      }
    );

    expect(reusedProjectile.setTexture).toHaveBeenCalledWith('burst-rifle-projectile');
    expect(reusedProjectile.setRotation).toHaveBeenCalledWith(Math.PI / 2);
    expect(reusedProjectile.weaponKey).toBe('burstRifle');

    reusedProjectile.active = false;

    manager.fireProjectile(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      {
        projectileDamage: 18,
        projectilePierce: 0,
        projectileRicochet: 0,
        projectileSpeed: 440
      },
      1400,
      {
        textureKey: 'projectile',
        rotation: 0,
        weaponKey: 'projectile'
      }
    );

    expect(reusedProjectile.setTexture).toHaveBeenLastCalledWith('projectile');
    expect(reusedProjectile.setRotation).toHaveBeenLastCalledWith(0);
    expect(reusedProjectile.weaponKey).toBe('projectile');
  });
});
