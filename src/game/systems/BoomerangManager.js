import { getNearbyEnemies, getNearestEnemy, getProjectileVelocity } from '../logic/combat.js';
import {
  advanceBoomerang,
  createBoomerangDirections,
  registerBoomerangHit
} from '../logic/boomerang.js';

const BOOMERANG_SPREAD_DEG = 18;
const BOOMERANG_SPEED = 260;
const BOOMERANG_HIT_RADIUS = 24;

export class BoomerangManager {
  constructor(scene) {
    this.scene = scene;
    this.boomerangs = [];
    this.nextThrowAt = 0;
  }

  update(player, stats, deltaMs, now, enemies, enemyManager) {
    if (stats.boomerangUnlocked && this.boomerangs.length === 0 && now >= this.nextThrowAt) {
      const target = getNearestEnemy(player.sprite, enemies);

      if (target) {
        this.spawnBoomerangs(player, target, stats);
        this.nextThrowAt = now + stats.boomerangCooldownMs;
      }
    }

    for (let index = this.boomerangs.length - 1; index >= 0; index -= 1) {
      const boomerang = this.boomerangs[index];
      const caught = advanceBoomerang(boomerang, player.sprite, deltaMs);
      const enemyQuery = enemyManager.getEnemyQuery?.() ?? enemies;
      const queryRadius = BOOMERANG_HIT_RADIUS + (boomerang.speed * deltaMs) / 1000 + 12;

      boomerang.rotation += deltaMs * 0.018;
      boomerang.sprite.setPosition?.(boomerang.x, boomerang.y);
      boomerang.sprite.setRotation?.(boomerang.rotation);

      if (caught) {
        boomerang.sprite.destroy?.();
        this.boomerangs.splice(index, 1);
        continue;
      }

      getNearbyEnemies(boomerang, enemyQuery, queryRadius).forEach((enemy) => {
        const dx = enemy.x - boomerang.x;
        const dy = enemy.y - boomerang.y;

        if (Math.hypot(dx, dy) <= BOOMERANG_HIT_RADIUS && registerBoomerangHit(boomerang, enemy)) {
          enemyManager.damageEnemy(enemy, boomerang.damage, 'boomerang');
        }
      });
    }
  }

  spawnBoomerangs(player, target, stats) {
    const velocity = getProjectileVelocity(player.sprite, target, BOOMERANG_SPEED);
    const baseDirection = {
      x: velocity.x / BOOMERANG_SPEED,
      y: velocity.y / BOOMERANG_SPEED
    };

    createBoomerangDirections(baseDirection, stats.boomerangCount, BOOMERANG_SPREAD_DEG).forEach((direction) => {
      const sprite = this.scene.add?.image?.(player.sprite.x, player.sprite.y, 'boomerang');

      sprite?.setDepth?.(4);
      this.boomerangs.push({
        damage: stats.boomerangDamage,
        directionX: direction.x,
        directionY: direction.y,
        hitEnemyKeys: new Set(),
        maxDistance: stats.boomerangRange,
        returning: false,
        rotation: 0,
        speed: BOOMERANG_SPEED,
        sprite,
        traveled: 0,
        x: player.sprite.x,
        y: player.sprite.y
      });
    });
  }
}
