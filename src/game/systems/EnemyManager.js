import { createEnemyQuery } from '../logic/combat.js';
import { applySwarmSpacing, getEnemyIntent, shouldEnemyShoot } from '../logic/enemyBehavior.js';
import {
  ANIMATION_STEP_MS,
  classifyEnemyTier,
  shouldAdvanceAnimation,
  shouldRefreshEnemyLogic
} from '../logic/enemyLod.js';
import { getEliteModifiers } from '../logic/eliteWaves.js';
import { advanceVisualFrame, getEnemyVisualConfig } from '../logic/enemyVisuals.js';
import { getSpawnPosition, getSpawnProfile } from '../logic/spawn.js';
import { rollPowerupDrop } from '../logic/temporaryPowerups.js';

const HEART_DROP_CHANCE = 0.03;
const HEART_HEAL_AMOUNT = 10;
const POISON_PUDDLE_LIFETIME_MS = 5000;
const POISON_TICK_INTERVAL_MS = 500;
const PLAYER_POISON_RADIUS = 14;
const DEFAULT_SPEED_MULTIPLIER = 1;

export const ENEMY_TYPES = {
  skeleton: {
    texture: 'enemy-skeleton',
    speed: 92,
    maxHealth: 34,
    xpValue: 4,
    contactDamage: 8,
    hitRadius: 12
  },
  zombie: {
    texture: 'enemy-zombie',
    speed: 72,
    maxHealth: 48,
    xpValue: 5,
    contactDamage: 6,
    hitRadius: 13
  },
  bat: {
    texture: 'enemy-bat',
    speed: 118,
    maxHealth: 20,
    xpValue: 3,
    contactDamage: 5,
    hitRadius: 11
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
  },
  poisonBlob: {
    texture: 'enemy-poisonBlob',
    speed: 42,
    maxHealth: 96,
    xpValue: 10,
    contactDamage: 10,
    hitRadius: 18,
    poisonTickDamage: 2,
    trailDropIntervalMs: 650,
    canSplit: true
  },
  miniPoisonBlob: {
    texture: 'enemy-miniPoisonBlob',
    speed: 60,
    maxHealth: 28,
    xpValue: 4,
    contactDamage: 6,
    hitRadius: 12,
    poisonTickDamage: 1,
    trailDropIntervalMs: 800,
    canSplit: false
  }
};

export class EnemyManager {
  constructor(
    scene,
    player,
    pickupManager,
    effects = null,
    dropRoll = Math.random,
    damageStats = null,
    audioManager = null,
    onSpawn = null
  ) {
    this.scene = scene;
    this.player = player;
    this.pickupManager = pickupManager;
    this.effects = effects;
    this.dropRoll = dropRoll;
    this.damageStats = damageStats;
    this.audioManager = audioManager;
    this.onSpawn = onSpawn;
    this.group = scene.physics.add.group();
    this.enemyProjectileGroup = scene.physics.add.group();
    this.powerupDropRoll = ({ isElite }) =>
      rollPowerupDrop({
        isElite,
        roll: this.dropRoll(),
        keyRoll: this.dropRoll()
      });
    this.enemyQuery = createEnemyQuery([]);
    this.nearEnemyQuery = createEnemyQuery([]);
    this.poisonPuddles = [];
    this.playerPoisonDamaged = false;
    this.playerKilledByPoison = false;
    this.frameIndex = 0;
    this.nextAnimationStepAt = (scene.time?.now ?? 0) + ANIMATION_STEP_MS;
    this.spawnAccumulatorMs = 0;
    this.spawnCounts = {
      skeleton: 0,
      zombie: 0,
      bat: 0,
      tough: 0,
      spitter: 0,
      poisonBlob: 0,
      miniPoisonBlob: 0
    };
  }

  createEliteHealthBar(enemy) {
    if (!this.scene?.add?.rectangle) {
      return;
    }

    enemy.eliteHealthBarFrame = this.scene.add
      .rectangle(0, 0, 0, 0, 0x140f0a, 0.92)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(1, 0xf0c97c, 0.95)
      .setDepth(6.1)
      .setVisible(true);
    enemy.eliteHealthBarFill = this.scene.add
      .rectangle(0, 0, 0, 0, 0xc84a2f, 0.98)
      .setOrigin(0, 0.5)
      .setDepth(6.2)
      .setVisible(true);
    this.updateEliteHealthBar(enemy);
  }

  updateEliteHealthBar(enemy) {
    if (!enemy?.isElite || !enemy?.eliteHealthBarFrame || !enemy?.eliteHealthBarFill) {
      return;
    }

    const width = Math.max(26, (enemy.hitRadius ?? 12) * 2.4);
    const height = 5;
    const x = enemy.x;
    const y = enemy.y - (enemy.hitRadius ?? 12) - 15;
    const healthRatio = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));

    enemy.eliteHealthBarFrame.setPosition?.(x, y);
    enemy.eliteHealthBarFrame.setSize?.(width, height);
    enemy.eliteHealthBarFill.setPosition?.(x - width / 2 + 1, y);
    enemy.eliteHealthBarFill.setSize?.(Math.max(0, (width - 2) * healthRatio), height - 2);
    enemy.eliteHealthBarFrame.setVisible?.(enemy.active !== false);
    enemy.eliteHealthBarFill.setVisible?.(enemy.active !== false && healthRatio > 0);
  }

  destroyEliteHealthBar(enemy) {
    enemy?.eliteHealthBarFrame?.destroy?.();
    enemy?.eliteHealthBarFill?.destroy?.();
    enemy.eliteHealthBarFrame = null;
    enemy.eliteHealthBarFill = null;
  }

  getReusableEnemyProjectile() {
    for (const projectile of this.enemyProjectileGroup.getChildren?.() ?? []) {
      if (!projectile?.active) {
        if (projectile.body) {
          projectile.body.enable = true;
        }
        projectile.setActive?.(true);
        projectile.setVisible?.(true);
        return projectile;
      }
    }

    return this.enemyProjectileGroup.create(0, 0, 'projectile');
  }

  deactivateEnemyProjectile(projectile) {
    projectile?.setVelocity?.(0, 0);
    if (projectile?.body) {
      projectile.body.enable = false;
    }
    projectile?.setActive?.(false);
    projectile?.setVisible?.(false);
  }

  update(deltaMs, elapsedSeconds, now = this.scene.time?.now ?? 0) {
    this.playerPoisonDamaged = false;
    this.playerKilledByPoison = false;
    this.frameIndex += 1;
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
        this.deactivateEnemyProjectile(projectile);
      }
    });

    const queriedEnemies = this.getLivingEnemies?.();
    const livingEnemies = queriedEnemies ?? this.lastLivingEnemies ?? [];
    this.lastLivingEnemies = livingEnemies;
    const animationStepDue = shouldAdvanceAnimation(now, this.nextAnimationStepAt);

    if (animationStepDue) {
      this.nextAnimationStepAt = now + ANIMATION_STEP_MS;
    }

    livingEnemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      enemy.lodTier = classifyEnemyTier(enemy, playerSprite);
      const dx = playerSprite.x - enemy.x;
      const dy = playerSprite.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const hasCachedIntent =
        enemy.cachedMoveX !== undefined &&
        enemy.cachedMoveY !== undefined &&
        enemy.cachedWantsToShoot !== undefined;
      const canRefreshIntent =
        enemy.type !== undefined ||
        enemy.contactDamage !== undefined ||
        enemy.attackRange > 0 ||
        enemy.preferredRange !== undefined;

      if (animationStepDue && (enemy.lodTier === 'near' || this.frameIndex % 2 === 0)) {
        const nextFrame = advanceVisualFrame(enemy);

        if (nextFrame && enemy.texture?.key !== nextFrame) {
          enemy.setTexture(nextFrame);
        }
      }

      if (
        !hasCachedIntent ||
        (canRefreshIntent && shouldRefreshEnemyLogic(enemy.lodTier, this.frameIndex))
      ) {
        const baseIntent = getEnemyIntent(enemy, enemy, playerSprite);
        const intent =
          enemy.lodTier === 'near'
            ? applySwarmSpacing(baseIntent, enemy, livingEnemies)
            : baseIntent;

        enemy.cachedMoveX = intent.moveX;
        enemy.cachedMoveY = intent.moveY;
        enemy.cachedWantsToShoot = intent.wantsToShoot;
      }

      const speedMultiplier =
        enemy.slowedUntil && enemy.slowedUntil > now
          ? enemy.speedMultiplier ?? DEFAULT_SPEED_MULTIPLIER
          : DEFAULT_SPEED_MULTIPLIER;
      if (enemy.slowedUntil && enemy.slowedUntil <= now) {
        enemy.slowedUntil = 0;
        enemy.speedMultiplier = DEFAULT_SPEED_MULTIPLIER;
      }
      enemy.setVelocity(
        (enemy.cachedMoveX ?? 0) * enemy.speed * speedMultiplier,
        (enemy.cachedMoveY ?? 0) * enemy.speed * speedMultiplier
      );
      this.updateEliteHealthBar(enemy);

      if (enemy.poisonTickDamage && enemy.trailDropIntervalMs) {
        if (enemy.nextTrailDropAt === undefined) {
          enemy.nextTrailDropAt = now + enemy.trailDropIntervalMs;
        } else if (now >= enemy.nextTrailDropAt) {
          this.spawnPoisonPuddle(enemy.x, enemy.y, enemy.poisonTickDamage, now);
          enemy.nextTrailDropAt = now + enemy.trailDropIntervalMs;
        }
      }

      if (enemy.cachedWantsToShoot && shouldEnemyShoot(enemy, now, distance)) {
        this.fireEnemyProjectile(enemy, dx / distance, dy / distance, now);
        enemy.nextShotAt = now + enemy.attackCooldownMs;
      }
    });

    this.updatePoisonPuddles(now);

    this.enemyQuery = createEnemyQuery(livingEnemies);
    this.nearEnemyQuery = createEnemyQuery(livingEnemies.filter((enemy) => enemy.lodTier === 'near'));

    return livingEnemies;
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
      return 'skeleton';
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

  spawnEnemy(typeKey, options = {}) {
    const type = ENEMY_TYPES[typeKey];
    const camera = this.scene.cameras?.main;
    const position =
      options.position ??
      (camera
        ? getSpawnPosition(
            {
              left: camera.scrollX,
              right: camera.scrollX + camera.width,
              top: camera.scrollY,
              bottom: camera.scrollY + camera.height
            },
            100
          )
        : { x: 0, y: 0 });
    const visual = getEnemyVisualConfig(typeKey, this.spawnCounts[typeKey] ?? 0);
    const eliteModifiers = options.elite ? getEliteModifiers() : null;
    this.spawnCounts[typeKey] = (this.spawnCounts[typeKey] ?? 0) + 1;
    const enemy = this.group.create(position.x, position.y, visual.frames[0] ?? type.texture);

    enemy.type = typeKey;
    enemy.speed = type.speed;
    enemy.health = type.maxHealth;
    enemy.maxHealth = type.maxHealth;
    enemy.xpValue = type.xpValue;
    enemy.contactDamage = type.contactDamage;
    enemy.nextContactDamageAt = 0;
    enemy.attackRange = type.attackRange ?? 0;
    enemy.attackCooldownMs = type.attackCooldownMs ?? 0;
    enemy.preferredRange = type.preferredRange;
    enemy.projectileSpeed = type.projectileSpeed ?? 0;
    enemy.projectileDamage = type.projectileDamage ?? 0;
    enemy.nextShotAt = 0;
    enemy.slowedUntil = 0;
    enemy.speedMultiplier = DEFAULT_SPEED_MULTIPLIER;
    enemy.hitRadius = type.hitRadius;
    enemy.poisonTickDamage = type.poisonTickDamage ?? 0;
    enemy.trailDropIntervalMs = type.trailDropIntervalMs ?? 0;
    enemy.canSplit = type.canSplit ?? false;
    enemy.visualKey = visual.key;
    enemy.visualFrames = visual.frames;
    enemy.visualFrameDurationMs = visual.frameDurationMs;
    enemy.setDepth(4);
    enemy.setCircle(type.hitRadius);
    enemy.setScale((visual.scale ?? 1) * (eliteModifiers?.scaleMultiplier ?? 1));

    if (eliteModifiers) {
      enemy.isElite = true;
      enemy.eliteTint = eliteModifiers.tint;
      enemy.health = Math.round(enemy.health * eliteModifiers.healthMultiplier);
      enemy.maxHealth = enemy.health;
      enemy.xpValue = Math.round(enemy.xpValue * eliteModifiers.xpMultiplier);
      enemy.contactDamage = Math.round(enemy.contactDamage * eliteModifiers.contactDamageMultiplier);
      enemy.hitRadius *= eliteModifiers.scaleMultiplier ?? 1;
      enemy.setTintFill(eliteModifiers.tint);
      this.createEliteHealthBar(enemy);
    }

    if (options.discover !== false) {
      this.onSpawn?.(typeKey);
    }

    return enemy;
  }

  fireEnemyProjectile(enemy, directionX, directionY, now) {
    const projectile = this.getReusableEnemyProjectile();
    const speed = enemy.projectileSpeed ?? 0;

    projectile.setPosition?.(enemy.x, enemy.y);
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
      this.updateEliteHealthBar(enemy);
      this.effects?.spawnHitSplash?.(enemy, false);
      this.audioManager?.playEnemyHit?.();
      enemy.setTintFill(0xfff0f0);
      this.scene.time.delayedCall(50, () => {
        if (enemy.active) {
          if (enemy.isElite && enemy.eliteTint !== undefined) {
            enemy.setTintFill(enemy.eliteTint);
          } else {
            enemy.clearTint();
          }
        }
      });
      return false;
    }

    this.effects?.spawnDeathSplash?.(enemy);
    this.effects?.spawnPuddle?.(enemy);
    this.pickupManager.spawnOrb(enemy.x, enemy.y, enemy.xpValue);

    if (enemy.isElite) {
      this.audioManager?.playEliteDeath?.();
      this.pickupManager.spawnChest(enemy.x, enemy.y, enemy.type);
    } else {
      this.audioManager?.playEnemyDeath?.();
    }

    const powerupKey = this.powerupDropRoll?.({ isElite: Boolean(enemy.isElite) });

    if (powerupKey) {
      this.pickupManager.spawnPowerup?.(enemy.x, enemy.y, powerupKey);
    }

    if (this.dropRoll() < HEART_DROP_CHANCE) {
      this.pickupManager.spawnHeart?.(enemy.x, enemy.y, HEART_HEAL_AMOUNT);
    }

    if (enemy.canSplit) {
      const splitOffset = enemy.hitRadius ?? 16;
      this.spawnEnemy('miniPoisonBlob', {
        discover: false,
        position: {
          x: enemy.x - splitOffset * 0.65,
          y: enemy.y - splitOffset * 0.3
        }
      });
      this.spawnEnemy('miniPoisonBlob', {
        discover: false,
        position: {
          x: enemy.x + splitOffset * 0.65,
          y: enemy.y + splitOffset * 0.3
        }
      });
    }

    this.destroyEliteHealthBar(enemy);
    enemy.destroy();
    return true;
  }

  ensurePoisonPuddlePool(count) {
    this.poisonPuddles = this.poisonPuddles.filter((puddle) => puddle?.sprite?.scene?.sys || !puddle?.sprite);

    while (this.poisonPuddles.length < count) {
      const sprite =
        this.scene.add?.image?.(0, 0, 'poison-puddle') ??
        {
          setAlpha() {
            return this;
          },
          setDepth() {
            return this;
          },
          setPosition() {
            return this;
          },
          setScale() {
            return this;
          },
          setTexture() {
            return this;
          },
          setVisible() {
            return this;
          }
        };
      sprite.setDepth?.(1.8);
      sprite.setAlpha?.(0.9);
      sprite.setVisible?.(false);
      this.poisonPuddles.push({
        active: false,
        damage: 0,
        expiresAt: 0,
        nextDamageAt: 0,
        radius: 0,
        sprite,
        x: 0,
        y: 0
      });
    }
  }

  spawnPoisonPuddle(x, y, damage, now, radius = 20) {
    this.ensurePoisonPuddlePool(this.poisonPuddles.length + 1);
    const puddle = this.poisonPuddles.find((entry) => !entry.active) ?? this.poisonPuddles[this.poisonPuddles.length - 1];

    puddle.active = true;
    puddle.x = x;
    puddle.y = y;
    puddle.damage = damage;
    puddle.radius = radius;
    puddle.expiresAt = now + POISON_PUDDLE_LIFETIME_MS;
    puddle.nextDamageAt = now;
    puddle.sprite.setTexture?.('poison-puddle');
    puddle.sprite.setPosition?.(x, y);
    puddle.sprite.setScale?.(radius / 20);
    puddle.sprite.setAlpha?.(0.88);
    puddle.sprite.setVisible?.(true);

    return puddle;
  }

  updatePoisonPuddles(now) {
    const playerSprite = this.player?.sprite ?? this.player;

    this.poisonPuddles.forEach((puddle) => {
      if (!puddle.active) {
        return;
      }

      if (now >= puddle.expiresAt) {
        puddle.active = false;
        puddle.sprite.setVisible?.(false);
        return;
      }

      const progress = (puddle.expiresAt - now) / POISON_PUDDLE_LIFETIME_MS;
      puddle.sprite.setAlpha?.(0.18 + progress * 0.7);

      if (!playerSprite) {
        return;
      }

      const dx = playerSprite.x - puddle.x;
      const dy = playerSprite.y - puddle.y;
      const distance = Math.hypot(dx, dy);

      if (distance > puddle.radius + PLAYER_POISON_RADIUS || now < puddle.nextDamageAt) {
        return;
      }

      puddle.nextDamageAt = now + POISON_TICK_INTERVAL_MS;
      const died = this.player.takeDamage?.(puddle.damage) ?? false;
      this.playerPoisonDamaged = true;
      this.playerKilledByPoison ||= died;
    });
  }

  applyAreaSlow(centerX, centerY, radius, now, durationMs, slowMultiplier) {
    const radiusSquared = radius * radius;
    let affectedCount = 0;
    const groupedEnemies = this.group?.getChildren?.() ?? [];
    const enemies =
      groupedEnemies.length > 0
        ? groupedEnemies
        : this.getLivingEnemies?.() ?? this.lastLivingEnemies ?? [];
    this.lastLivingEnemies = enemies;

    enemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;

      if (dx * dx + dy * dy > radiusSquared) {
        return;
      }

      enemy.slowedUntil = Math.max(enemy.slowedUntil ?? 0, now + durationMs);
      enemy.speedMultiplier = Math.min(
        enemy.speedMultiplier ?? DEFAULT_SPEED_MULTIPLIER,
        slowMultiplier
      );
      affectedCount += 1;
    });

    return affectedCount;
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

  getEnemyQuery() {
    return this.enemyQuery;
  }

  getNearEnemyQuery() {
    return this.nearEnemyQuery;
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
