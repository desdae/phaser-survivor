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

  getReusableProjectile() {
    for (const projectile of this.group.getChildren?.() ?? []) {
      if (!projectile?.active) {
        if (projectile.body) {
          projectile.body.enable = true;
        }
        projectile.setActive?.(true);
        projectile.setVisible?.(true);
        return projectile;
      }
    }

    return this.group.create(0, 0, 'projectile');
  }

  deactivateProjectile(projectile) {
    projectile?.setVelocity?.(0, 0);
    if (projectile?.body) {
      projectile.body.enable = false;
    }
    projectile?.setActive?.(false);
    projectile?.setVisible?.(false);
  }

  update(now) {
    this.group.children.iterate((projectile) => {
      if (!projectile?.active) {
        return;
      }

      if (projectile.expiresAt <= now) {
        this.deactivateProjectile(projectile);
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
    const projectile = this.getReusableProjectile();
    const speed = stats.projectileSpeed ?? 0;

    projectile.setPosition?.(origin.x, origin.y);
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

    enemyManager.damageEnemy(enemy, projectile.damage, 'projectile');

    if (projectile.remainingPierce > 0) {
      projectile.remainingPierce -= 1;
      return;
    }

    if (projectile.remainingRicochet > 0) {
      const nextEnemy = getRicochetTarget(
        enemy,
        enemyManager.getNearEnemyQuery?.() ?? enemyManager.getEnemyQuery?.() ?? enemyManager.getLivingEnemies(),
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

    this.deactivateProjectile(projectile);
  }

  stopAll() {
    this.group.children.iterate((projectile) => {
      if (projectile?.active) {
        projectile.setVelocity(0, 0);
      }
    });
  }
}
