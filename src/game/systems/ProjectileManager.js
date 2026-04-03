import { getNearestEnemy, getProjectileVelocity } from '../logic/combat.js';

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
      return null;
    }

    const target = getNearestEnemy(player.sprite, enemies);

    if (!target) {
      return null;
    }

    this.nextShotAt = now + player.stats.fireCooldownMs;
    return this.fireProjectile(player.sprite, target, player.stats, now);
  }

  fireProjectile(origin, target, stats, now) {
    const projectile = this.group.create(origin.x, origin.y, 'projectile');
    const velocity = getProjectileVelocity(origin, target, stats.projectileSpeed);

    projectile.damage = stats.projectileDamage;
    projectile.expiresAt = now + 1400;
    projectile.setDepth(3);
    projectile.setCircle(5);
    projectile.setVelocity(velocity.x, velocity.y);

    return projectile;
  }

  handleEnemyHit(projectile, enemy, enemyManager) {
    if (!projectile?.active || !enemy?.active) {
      return;
    }

    enemyManager.damageEnemy(enemy, projectile.damage);
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
