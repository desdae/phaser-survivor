import { getSpawnPosition, getSpawnProfile } from '../logic/spawn.js';

const ENEMY_TYPES = {
  basic: {
    texture: 'enemy-basic',
    speed: 92,
    maxHealth: 34,
    xpValue: 4,
    contactDamage: 8
  },
  tough: {
    texture: 'enemy-tough',
    speed: 64,
    maxHealth: 76,
    xpValue: 9,
    contactDamage: 12
  }
};

export class EnemyManager {
  constructor(scene, player, pickupManager) {
    this.scene = scene;
    this.player = player;
    this.pickupManager = pickupManager;
    this.group = scene.physics.add.group();
    this.spawnAccumulatorMs = 0;
  }

  update(deltaMs, elapsedSeconds) {
    this.spawnAccumulatorMs += deltaMs;
    const profile = getSpawnProfile(elapsedSeconds);

    while (this.spawnAccumulatorMs >= profile.cooldownMs) {
      this.spawnAccumulatorMs -= profile.cooldownMs;
      this.spawnBatch(profile);
    }

    this.group.children.iterate((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;

      enemy.setVelocity((dx / distance) * enemy.speed, (dy / distance) * enemy.speed);
    });
  }

  spawnBatch(profile) {
    for (let index = 0; index < profile.batchSize; index += 1) {
      const typeKey =
        profile.allowTough && Math.random() < 0.28 + Math.min(profile.batchSize * 0.03, 0.12)
          ? 'tough'
          : 'basic';

      this.spawnEnemy(typeKey);
    }
  }

  spawnEnemy(typeKey) {
    const type = ENEMY_TYPES[typeKey];
    const camera = this.scene.cameras.main;
    const view = {
      left: camera.scrollX,
      right: camera.scrollX + camera.width,
      top: camera.scrollY,
      bottom: camera.scrollY + camera.height
    };
    const position = getSpawnPosition(view, 100);
    const enemy = this.group.create(position.x, position.y, type.texture);

    enemy.speed = type.speed;
    enemy.health = type.maxHealth;
    enemy.xpValue = type.xpValue;
    enemy.contactDamage = type.contactDamage;
    enemy.nextContactDamageAt = 0;
    enemy.setDepth(4);
    enemy.setCircle(typeKey === 'basic' ? 12 : 16);

    return enemy;
  }

  damageEnemy(enemy, damage) {
    if (!enemy?.active) {
      return false;
    }

    enemy.health -= damage;

    if (enemy.health > 0) {
      enemy.setTintFill(0xfff0f0);
      this.scene.time.delayedCall(50, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });
      return false;
    }

    this.pickupManager.spawnOrb(enemy.x, enemy.y, enemy.xpValue);
    enemy.destroy();
    return true;
  }

  canDamagePlayer(enemy, now) {
    if (now < enemy.nextContactDamageAt) {
      return false;
    }

    enemy.nextContactDamageAt = now + 700;
    return true;
  }

  getLivingEnemies() {
    return this.group.getChildren().filter((enemy) => enemy.active);
  }

  stopAll() {
    this.group.children.iterate((enemy) => {
      if (enemy?.active) {
        enemy.setVelocity(0, 0);
      }
    });
  }
}
