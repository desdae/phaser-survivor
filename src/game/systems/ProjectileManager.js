import {
  getNearestEnemy,
  getProjectileVelocity,
  getRicochetTarget,
  getShotDirections,
  registerProjectileHit
} from '../logic/combat.js';

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
    this.nextShotAt = 0;
  }

  update(now) {
    this.group.children.iterate((projectile) => {
      if (!projectile?.active) {
        return;
      }

      if (projectile.expiresAt <= now) {
        projectile.destroy();
      }
    });
  }

  tryFire(player, enemies, now) {
    if (now < this.nextShotAt) {
      return [];
    }

    const target = getNearestEnemy(player.sprite, enemies);

    if (!target) {
      return [];
    }

    const stats = player.stats;
    const projectileSpeed = stats.projectileSpeed ?? 0;
    const projectileCount = stats.projectileCount ?? 1;
    const projectileSpreadDeg = stats.projectileSpreadDeg ?? 0;
    const baseVelocity = getProjectileVelocity(player.sprite, target, projectileSpeed);
    const baseDirection = {
      x: projectileSpeed === 0 ? 0 : baseVelocity.x / projectileSpeed,
      y: projectileSpeed === 0 ? 0 : baseVelocity.y / projectileSpeed
    };

    this.nextShotAt = now + (stats.fireCooldownMs ?? 0);
    return getShotDirections(baseDirection, projectileCount, projectileSpreadDeg).map((direction) =>
      this.fireProjectile(player.sprite, direction, stats, now)
    );
  }

  fireProjectile(origin, direction, stats, now) {
    const projectile = this.group.create(origin.x, origin.y, 'projectile');
    const speed = stats.projectileSpeed ?? 0;

    projectile.damage = stats.projectileDamage ?? 0;
    projectile.remainingPierce = stats.projectilePierce ?? 0;
    projectile.remainingRicochet = stats.projectileRicochet ?? 0;
    projectile.hitEnemyKeys = new Set();
    projectile.expiresAt = now + 1400;
    projectile.setDepth(3);
    projectile.setCircle(5);
    projectile.setVelocity(direction.x * speed, direction.y * speed);

    return projectile;
  }

  handleEnemyHit(projectile, enemy, enemyManager) {
    if (!projectile?.active || !enemy?.active) {
      return;
    }

    if (!registerProjectileHit(projectile, enemy)) {
      return;
    }

    enemyManager.damageEnemy(enemy, projectile.damage);

    if (projectile.remainingPierce > 0) {
      projectile.remainingPierce -= 1;
      return;
    }

    if (projectile.remainingRicochet > 0) {
      const nextEnemy = getRicochetTarget(
        enemy,
        enemyManager.getLivingEnemies(),
        170,
        projectile.hitEnemyKeys
      );

      if (nextEnemy) {
        projectile.remainingRicochet -= 1;
        const speed = Math.hypot(projectile.body?.velocity?.x ?? 0, projectile.body?.velocity?.y ?? 0);
        const velocity = getProjectileVelocity(projectile, nextEnemy, speed);
        projectile.setVelocity(velocity.x, velocity.y);
        return;
      }
    }

    projectile.destroy();
  }

  stopAll() {
    this.group.children.iterate((projectile) => {
      if (projectile?.active) {
        projectile.setVelocity(0, 0);
      }
    });
  }
}
