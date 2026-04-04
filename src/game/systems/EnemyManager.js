import { applySwarmSpacing, getEnemyIntent, shouldEnemyShoot } from '../logic/enemyBehavior.js';
import { getAnimatedTextureKey, getEnemyVisualConfig } from '../logic/enemyVisuals.js';
import { getSpawnPosition, getSpawnProfile } from '../logic/spawn.js';

const HEART_DROP_CHANCE = 0.03;
const HEART_HEAL_AMOUNT = 10;

const ENEMY_TYPES = {
  basic: {
    texture: 'enemy-basic',
    speed: 92,
    maxHealth: 34,
    xpValue: 4,
    contactDamage: 8,
    hitRadius: 12
  },
  tough: {
    texture: 'enemy-tough',
    speed: 64,
    maxHealth: 76,
    xpValue: 9,
    contactDamage: 12,
    hitRadius: 16
  },
  spitter: {
    texture: 'enemy-spitter',
    speed: 78,
    maxHealth: 44,
    xpValue: 7,
    contactDamage: 6,
    preferredRange: 240,
    attackRange: 320,
    projectileSpeed: 190,
    projectileDamage: 10,
    attackCooldownMs: 1600,
    hitRadius: 14
  }
};

export class EnemyManager {
  constructor(scene, player, pickupManager, effects = null, dropRoll = Math.random, damageStats = null) {
    this.scene = scene;
    this.player = player;
    this.pickupManager = pickupManager;
    this.effects = effects;
    this.dropRoll = dropRoll;
    this.damageStats = damageStats;
    this.group = scene.physics.add.group();
    this.enemyProjectileGroup = scene.physics.add.group();
    this.scene.physics.add.collider(this.group, this.group);
    this.spawnAccumulatorMs = 0;
    this.spawnCounts = {
      basic: 0,
      tough: 0,
      spitter: 0
    };
  }

  update(deltaMs, elapsedSeconds, now = this.scene.time?.now ?? 0) {
    this.spawnAccumulatorMs += deltaMs;
    const profile = getSpawnProfile(elapsedSeconds);
    const playerSprite = this.player.sprite ?? this.player;

    while (this.spawnAccumulatorMs >= profile.cooldownMs) {
      this.spawnAccumulatorMs -= profile.cooldownMs;
      this.spawnBatch(profile);
    }

    this.enemyProjectileGroup.children.iterate((projectile) => {
      if (!projectile?.active) {
        return;
      }

      if (projectile.expiresAt <= now) {
        projectile.destroy();
      }
    });

    const livingEnemies = this.getLivingEnemies();

    livingEnemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const baseIntent = getEnemyIntent(enemy, enemy, playerSprite);
      const intent = applySwarmSpacing(baseIntent, enemy, livingEnemies);
      const dx = playerSprite.x - enemy.x;
      const dy = playerSprite.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const animatedTextureKey = getAnimatedTextureKey(
        enemy.visualFrames,
        now,
        enemy.visualFrameDurationMs
      );

      if (animatedTextureKey && enemy.texture?.key !== animatedTextureKey) {
        enemy.setTexture(animatedTextureKey);
      }

      enemy.setVelocity(intent.moveX * enemy.speed, intent.moveY * enemy.speed);

      if (intent.wantsToShoot && shouldEnemyShoot(enemy, now, distance)) {
        this.fireEnemyProjectile(enemy, dx / distance, dy / distance, now);
        enemy.nextShotAt = now + enemy.attackCooldownMs;
      }
    });
  }

  spawnBatch(profile) {
    for (let index = 0; index < profile.batchSize; index += 1) {
      const typeKey = this.pickEnemyType(profile.weights);

      this.spawnEnemy(typeKey);
    }
  }

  pickEnemyType(weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);

    if (entries.length === 0) {
      return 'basic';
    }

    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;

    for (const [typeKey, weight] of entries) {
      if (roll < weight) {
        return typeKey;
      }

      roll -= weight;
    }

    return entries[entries.length - 1][0];
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
    const visual = getEnemyVisualConfig(typeKey, this.spawnCounts[typeKey] ?? 0);
    this.spawnCounts[typeKey] = (this.spawnCounts[typeKey] ?? 0) + 1;
    const enemy = this.group.create(position.x, position.y, visual.frames[0] ?? type.texture);

    enemy.type = typeKey;
    enemy.speed = type.speed;
    enemy.health = type.maxHealth;
    enemy.xpValue = type.xpValue;
    enemy.contactDamage = type.contactDamage;
    enemy.nextContactDamageAt = 0;
    enemy.attackRange = type.attackRange ?? 0;
    enemy.attackCooldownMs = type.attackCooldownMs ?? 0;
    enemy.preferredRange = type.preferredRange;
    enemy.projectileSpeed = type.projectileSpeed ?? 0;
    enemy.projectileDamage = type.projectileDamage ?? 0;
    enemy.nextShotAt = 0;
    enemy.visualKey = visual.key;
    enemy.visualFrames = visual.frames;
    enemy.visualFrameDurationMs = visual.frameDurationMs;
    enemy.setDepth(4);
    enemy.setCircle(type.hitRadius);
    enemy.setScale(visual.scale ?? 1);

    return enemy;
  }

  fireEnemyProjectile(enemy, directionX, directionY, now) {
    const projectile = this.enemyProjectileGroup.create(enemy.x, enemy.y, 'projectile');
    const speed = enemy.projectileSpeed ?? 0;

    projectile.damage = enemy.projectileDamage ?? 0;
    projectile.expiresAt = now + 3000;
    projectile.setDepth(3);
    projectile.setCircle(5);
    projectile.setTintFill(0xffa2a2);
    projectile.setVelocity(directionX * speed, directionY * speed);

    return projectile;
  }

  damageEnemy(enemy, damage, sourceKey = null) {
    if (!enemy?.active) {
      return false;
    }

    const appliedDamage = Math.min(enemy.health, damage);
    enemy.health -= damage;
    this.damageStats?.record?.(sourceKey, appliedDamage);

    if (enemy.health > 0) {
      this.effects?.spawnHitSplash?.(enemy, false);
      enemy.setTintFill(0xfff0f0);
      this.scene.time.delayedCall(50, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });
      return false;
    }

    this.effects?.spawnDeathSplash?.(enemy);
    this.effects?.spawnPuddle?.(enemy);
    this.pickupManager.spawnOrb(enemy.x, enemy.y, enemy.xpValue);

    if (this.dropRoll() < HEART_DROP_CHANCE) {
      this.pickupManager.spawnHeart?.(enemy.x, enemy.y, HEART_HEAL_AMOUNT);
    }

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

    this.enemyProjectileGroup.children.iterate((projectile) => {
      if (projectile?.active) {
        projectile.setVelocity(0, 0);
      }
    });
  }
}
