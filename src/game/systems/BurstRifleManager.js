import { getShotDirections } from '../logic/combat.js';

export class BurstRifleManager {
  constructor(projectileBridge = null) {
    this.projectileBridge = projectileBridge;
    this.nextFireAt = 0;
  }

  update(player, stats, aimDirection, now) {
    if (!stats.burstRifleUnlocked || now < this.nextFireAt) {
      return [];
    }

    const projectileCount = Math.max(1, stats.burstRifleBurstCount ?? 1);
    const spreadDeg = Math.max(0, stats.burstRifleSpreadDeg ?? 0);
    const directions = getShotDirections(aimDirection, projectileCount, spreadDeg);

    this.nextFireAt = now + (stats.burstRifleCooldownMs ?? 0);
    return directions.map((direction) => this.spawnShot(player.sprite, stats, direction, now));
  }

  spawnShot(origin, stats, direction, now) {
    const shot = {
      damage: stats.burstRifleDamage ?? 0,
      direction,
      speed: stats.burstRifleProjectileSpeed ?? 0,
      weaponKey: 'burstRifle',
      x: origin.x,
      y: origin.y
    };

    if (this.projectileBridge?.addShot) {
      this.projectileBridge.addShot(shot);
      return shot;
    }

    if (this.projectileBridge?.fireProjectile) {
      const projectile = this.projectileBridge.fireProjectile(
        origin,
        direction,
        {
          projectileDamage: shot.damage,
          projectilePierce: 0,
          projectileRicochet: 0,
          projectileSpeed: shot.speed
        },
        now
      );
      projectile.weaponKey = shot.weaponKey;
      return projectile;
    }

    return shot;
  }
}
