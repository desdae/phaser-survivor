# Survivor MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the current survivor prototype into a stronger MVP with orbiting blade unlocks, projectile branching upgrades, and ranged spitter enemies while preserving the existing run loop.

**Architecture:** Keep the one-scene Phaser runtime, but move the new branching behavior into focused logic and system modules so `GameScene` stays orchestration-only. Treat projectile behavior, blade behavior, enemy behavior, and upgrade filtering as small, testable units that the scene wires together.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Create: `src/game/logic/blade.js`
- Create: `src/game/logic/enemyBehavior.js`
- Create: `src/game/systems/BladeManager.js`
- Create: `tests/blade.test.js`
- Create: `tests/enemyBehavior.test.js`
- Modify: `src/game/entities/Player.js`
- Modify: `src/game/logic/combat.js`
- Modify: `src/game/logic/progression.js`
- Modify: `src/game/logic/spawn.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/systems/UpgradeSystem.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `tests/combat.test.js`
- Modify: `tests/progression.test.js`
- Modify: `tests/spawn.test.js`

### Task 1: Expand Weapon and Upgrade State

**Files:**
- Modify: `src/game/entities/Player.js`
- Modify: `src/game/logic/progression.js`
- Modify: `src/game/systems/UpgradeSystem.js`
- Modify: `tests/progression.test.js`

- [ ] **Step 1: Write the failing progression tests for blade unlocks and filtered upgrade choices**

```js
import { describe, expect, it } from 'vitest';
import {
  UPGRADE_DEFINITIONS,
  applyUpgrade,
  awardXp,
  getUpgradePool,
  getXpToNextLevel,
  rollUpgradeChoices
} from '../src/game/logic/progression.js';

describe('getUpgradePool', () => {
  it('offers blade unlock before the blade exists', () => {
    const pool = getUpgradePool({
      bladeUnlocked: false,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(true);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(false);
  });

  it('offers blade upgrades after the blade is unlocked', () => {
    const pool = getUpgradePool({
      bladeUnlocked: true,
      projectileRicochet: 0,
      projectilePierce: 0,
      projectileCount: 1
    });

    expect(pool.some((entry) => entry.key === 'unlockBlade')).toBe(false);
    expect(pool.some((entry) => entry.key === 'bladeCount')).toBe(true);
  });
});

describe('applyUpgrade', () => {
  it('unlocks the orbiting blade and seeds its starting stats', () => {
    const player = {
      bladeUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    applyUpgrade(player, 'unlockBlade');

    expect(player.bladeUnlocked).toBe(true);
    expect(player.bladeCount).toBe(1);
    expect(player.bladeDamage).toBeGreaterThan(0);
    expect(player.bladeOrbitRadius).toBeGreaterThan(0);
  });

  it('adds projectile branching stats', () => {
    const player = {
      bladeUnlocked: false,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitSpeed: 0,
      bladeOrbitRadius: 0,
      projectileCount: 1,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileDamage: 18,
      fireCooldownMs: 520,
      projectileSpeed: 440,
      maxHealth: 100,
      health: 100,
      pickupRadius: 48
    };

    applyUpgrade(player, 'multiShot');
    applyUpgrade(player, 'pierce');
    applyUpgrade(player, 'ricochet');

    expect(player.projectileCount).toBe(2);
    expect(player.projectilePierce).toBe(1);
    expect(player.projectileRicochet).toBe(1);
  });
});
```

- [ ] **Step 2: Run the progression tests to verify they fail for the new missing API**

Run: `npm test -- tests/progression.test.js`
Expected: FAIL with missing exports like `getUpgradePool` or missing upgrade keys such as `unlockBlade`

- [ ] **Step 3: Expand the player starting stats to carry blade and projectile branch state**

```js
const PLAYER_STARTING_STATS = {
  speed: 220,
  maxHealth: 100,
  health: 100,
  level: 1,
  xp: 0,
  xpToNext: 10,
  projectileDamage: 18,
  projectileSpeed: 440,
  fireCooldownMs: 520,
  projectileCount: 1,
  projectilePierce: 0,
  projectileRicochet: 0,
  projectileSpreadDeg: 14,
  pickupRadius: 48,
  bladeUnlocked: false,
  bladeCount: 0,
  bladeDamage: 0,
  bladeOrbitRadius: 0,
  bladeOrbitSpeed: 0
};
```

- [ ] **Step 4: Replace the flat upgrade list with filtered upgrade definitions in progression logic**

```js
export const UPGRADE_DEFINITIONS = [
  {
    key: 'unlockBlade',
    label: 'Orbiting Blade',
    description: 'Unlock a blade that circles you and cuts nearby enemies.',
    isAvailable: (player) => !player.bladeUnlocked,
    apply(player) {
      player.bladeUnlocked = true;
      player.bladeCount = Math.max(player.bladeCount, 1);
      player.bladeDamage = Math.max(player.bladeDamage, 16);
      player.bladeOrbitRadius = Math.max(player.bladeOrbitRadius, 74);
      player.bladeOrbitSpeed = Math.max(player.bladeOrbitSpeed, 1.7);
    }
  },
  {
    key: 'bladeCount',
    label: 'Twin Edges',
    description: '+1 orbiting blade',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeCount += 1;
    }
  },
  {
    key: 'bladeDamage',
    label: 'Honed Steel',
    description: '+8 blade damage',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeDamage += 8;
    }
  },
  {
    key: 'bladeSpeed',
    label: 'Whirling Edge',
    description: '+0.3 blade orbit speed',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeOrbitSpeed += 0.3;
    }
  },
  {
    key: 'bladeRadius',
    label: 'Wider Arc',
    description: '+10 blade orbit radius',
    isAvailable: (player) => player.bladeUnlocked,
    apply(player) {
      player.bladeOrbitRadius += 10;
    }
  },
  {
    key: 'multiShot',
    label: 'Split Barrel',
    description: '+1 projectile per shot',
    isAvailable: () => true,
    apply(player) {
      player.projectileCount += 1;
    }
  },
  {
    key: 'pierce',
    label: 'Drill Rounds',
    description: '+1 projectile pierce',
    isAvailable: () => true,
    apply(player) {
      player.projectilePierce += 1;
    }
  },
  {
    key: 'ricochet',
    label: 'Bank Shot',
    description: '+1 ricochet bounce',
    isAvailable: () => true,
    apply(player) {
      player.projectileRicochet += 1;
    }
  }
];

export function getUpgradePool(player) {
  return UPGRADE_DEFINITIONS.filter((entry) => (entry.isAvailable ? entry.isAvailable(player) : true));
}

export function applyUpgrade(player, key) {
  const upgrade = UPGRADE_DEFINITIONS.find((entry) => entry.key === key);

  if (!upgrade) {
    throw new Error(`Unknown upgrade: ${key}`);
  }

  upgrade.apply(player);
}
```

- [ ] **Step 5: Update the upgrade system to roll from the filtered player-specific pool**

```js
import { applyUpgrade, getUpgradePool, rollUpgradeChoices } from '../logic/progression.js';

export class UpgradeSystem {
  getChoices(playerStats) {
    return rollUpgradeChoices(getUpgradePool(playerStats));
  }

  apply(player, key) {
    applyUpgrade(player.stats, key);
  }
}
```

- [ ] **Step 6: Run the progression tests to verify they pass**

Run: `npm test -- tests/progression.test.js`
Expected: PASS

- [ ] **Step 7: Commit the progression state expansion**

```bash
git add src/game/entities/Player.js src/game/logic/progression.js src/game/systems/UpgradeSystem.js tests/progression.test.js
git commit -m "feat: add mvp upgrade state model"
```

### Task 2: Add Projectile Branching Logic

**Files:**
- Modify: `src/game/logic/combat.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `tests/combat.test.js`

- [ ] **Step 1: Write the failing combat tests for spread, pierce, and ricochet helpers**

```js
import { describe, expect, it } from 'vitest';
import {
  getNearestEnemy,
  getProjectileVelocity,
  getRicochetTarget,
  getShotDirections
} from '../src/game/logic/combat.js';

describe('getShotDirections', () => {
  it('returns one angle for a single-shot weapon', () => {
    expect(getShotDirections({ x: 1, y: 0 }, 1, 14)).toEqual([{ x: 1, y: 0 }]);
  });

  it('returns a symmetric spread for multishot', () => {
    const directions = getShotDirections({ x: 1, y: 0 }, 3, 20);

    expect(directions).toHaveLength(3);
    expect(directions[1].x).toBeCloseTo(1, 3);
  });
});

describe('getRicochetTarget', () => {
  it('finds a new nearby enemy that is not the one just hit', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const nextEnemy = { x: 130, y: 110, active: true, id: 'second' };

    expect(getRicochetTarget(currentEnemy, [currentEnemy, nextEnemy], 80)?.id).toBe('second');
  });
});
```

- [ ] **Step 2: Run the combat tests to verify they fail**

Run: `npm test -- tests/combat.test.js`
Expected: FAIL with missing exports such as `getShotDirections` and `getRicochetTarget`

- [ ] **Step 3: Add the projectile branching helpers to combat logic**

```js
export function getShotDirections(baseDirection, projectileCount, spreadDeg) {
  if (projectileCount <= 1) {
    return [baseDirection];
  }

  const angleStep = (spreadDeg * Math.PI) / 180;
  const start = -((projectileCount - 1) / 2) * angleStep;

  return Array.from({ length: projectileCount }, (_, index) => {
    const angle = start + index * angleStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = baseDirection.x * cos - baseDirection.y * sin;
    const y = baseDirection.x * sin + baseDirection.y * cos;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  });
}

export function getRicochetTarget(hitEnemy, enemies, maxDistance) {
  let best = null;
  let bestDistanceSq = maxDistance * maxDistance;

  for (const enemy of enemies) {
    if (!enemy?.active || enemy === hitEnemy) continue;
    const dx = enemy.x - hitEnemy.x;
    const dy = enemy.y - hitEnemy.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq <= bestDistanceSq) {
      bestDistanceSq = distanceSq;
      best = enemy;
    }
  }

  return best;
}
```

- [ ] **Step 4: Update the projectile manager to fire spreads and preserve hit metadata**

```js
tryFire(player, enemies, now) {
  if (now < this.nextShotAt) {
    return [];
  }

  const target = getNearestEnemy(player.sprite, enemies);

  if (!target) {
    return [];
  }

  this.nextShotAt = now + player.stats.fireCooldownMs;
  const baseVelocity = getProjectileVelocity(player.sprite, target, player.stats.projectileSpeed);
  const baseDirection = {
    x: baseVelocity.x / player.stats.projectileSpeed,
    y: baseVelocity.y / player.stats.projectileSpeed
  };

  return getShotDirections(baseDirection, player.stats.projectileCount, player.stats.projectileSpreadDeg).map(
    (direction) => this.fireProjectile(player.sprite, direction, player.stats, now)
  );
}

fireProjectile(origin, direction, stats, now) {
  const projectile = this.group.create(origin.x, origin.y, 'projectile');

  projectile.damage = stats.projectileDamage;
  projectile.remainingPierce = stats.projectilePierce;
  projectile.remainingRicochet = stats.projectileRicochet;
  projectile.expiresAt = now + 1400;
  projectile.setVelocity(direction.x * stats.projectileSpeed, direction.y * stats.projectileSpeed);

  return projectile;
}
```

- [ ] **Step 5: Update enemy-hit handling to support pierce and ricochet**

```js
handleEnemyHit(projectile, enemy, enemyManager) {
  if (!projectile?.active || !enemy?.active) {
    return;
  }

  enemyManager.damageEnemy(enemy, projectile.damage);

  if (projectile.remainingPierce > 0) {
    projectile.remainingPierce -= 1;
    return;
  }

  if (projectile.remainingRicochet > 0) {
    const nextEnemy = getRicochetTarget(enemy, enemyManager.getLivingEnemies(), 170);

    if (nextEnemy) {
      projectile.remainingRicochet -= 1;
      const velocity = getProjectileVelocity(projectile, nextEnemy, Math.hypot(projectile.body.velocity.x, projectile.body.velocity.y));
      projectile.setVelocity(velocity.x, velocity.y);
      return;
    }
  }

  projectile.destroy();
}
```

- [ ] **Step 6: Run the combat tests to verify they pass**

Run: `npm test -- tests/combat.test.js`
Expected: PASS

- [ ] **Step 7: Commit the projectile branching work**

```bash
git add src/game/logic/combat.js src/game/systems/ProjectileManager.js tests/combat.test.js
git commit -m "feat: add projectile branching upgrades"
```

### Task 3: Add Orbiting Blade Logic and Runtime

**Files:**
- Create: `src/game/logic/blade.js`
- Create: `src/game/systems/BladeManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Create: `tests/blade.test.js`

- [ ] **Step 1: Write the failing blade tests**

```js
import { describe, expect, it } from 'vitest';
import { getBladePositions, shouldBladeDamageEnemy } from '../src/game/logic/blade.js';

describe('getBladePositions', () => {
  it('returns one blade position when only one blade is unlocked', () => {
    const points = getBladePositions({ x: 50, y: 75 }, 1, 80, 0);

    expect(points).toEqual([{ x: 130, y: 75 }]);
  });

  it('distributes multiple blades evenly around the player', () => {
    const points = getBladePositions({ x: 0, y: 0 }, 2, 60, 0);

    expect(points[0].x).toBeCloseTo(60, 3);
    expect(points[1].x).toBeCloseTo(-60, 3);
  });
});

describe('shouldBladeDamageEnemy', () => {
  it('uses a per-enemy cooldown', () => {
    expect(shouldBladeDamageEnemy(1000, 0)).toBe(true);
    expect(shouldBladeDamageEnemy(1200, 1600)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the blade tests to verify they fail**

Run: `npm test -- tests/blade.test.js`
Expected: FAIL because `blade.js` does not exist yet

- [ ] **Step 3: Implement the pure blade helpers**

```js
export function getBladePositions(center, bladeCount, orbitRadius, rotationRad) {
  return Array.from({ length: bladeCount }, (_, index) => {
    const angle = rotationRad + (index / bladeCount) * Math.PI * 2;
    return {
      x: center.x + Math.cos(angle) * orbitRadius,
      y: center.y + Math.sin(angle) * orbitRadius
    };
  });
}

export function shouldBladeDamageEnemy(now, nextAllowedAt) {
  return now >= nextAllowedAt;
}
```

- [ ] **Step 4: Add the blade manager**

```js
import Phaser from 'phaser';
import { getBladePositions, shouldBladeDamageEnemy } from '../logic/blade.js';

export class BladeManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.add.group();
    this.rotationRad = 0;
  }

  syncToPlayer(playerStats) {
    while (this.group.getLength() < playerStats.bladeCount) {
      const sprite = this.scene.add.image(0, 0, 'blade');
      sprite.setDepth(6);
      this.group.add(sprite);
    }

    while (this.group.getLength() > playerStats.bladeCount) {
      this.group.getChildren().pop().destroy();
    }
  }

  update(player, playerStats, deltaMs, now, enemies, enemyManager) {
    if (!playerStats.bladeUnlocked || playerStats.bladeCount === 0) {
      this.group.getChildren().forEach((blade) => blade.setVisible(false));
      return;
    }

    this.group.getChildren().forEach((blade) => blade.setVisible(true));
    this.rotationRad += (deltaMs / 1000) * playerStats.bladeOrbitSpeed;

    const points = getBladePositions(player.sprite, playerStats.bladeCount, playerStats.bladeOrbitRadius, this.rotationRad);

    this.group.getChildren().forEach((blade, index) => {
      const point = points[index];
      blade.setPosition(point.x, point.y);
      blade.setRotation(this.rotationRad + index);
    });

    for (const enemy of enemies) {
      for (const blade of this.group.getChildren()) {
        if (!enemy.active) continue;
        const distance = Phaser.Math.Distance.Between(blade.x, blade.y, enemy.x, enemy.y);

        if (distance <= 24 && shouldBladeDamageEnemy(now, enemy.nextBladeDamageAt ?? 0)) {
          enemy.nextBladeDamageAt = now + 280;
          enemyManager.damageEnemy(enemy, playerStats.bladeDamage);
        }
      }
    }
  }
}
```

- [ ] **Step 5: Wire the blade manager into the scene update loop**

```js
this.bladeManager = new BladeManager(this);

// in update()
this.bladeManager.syncToPlayer(this.player.stats);
this.bladeManager.update(
  this.player,
  this.player.stats,
  delta,
  time,
  this.enemyManager.getLivingEnemies(),
  this.enemyManager
);
```

- [ ] **Step 6: Run the blade tests to verify they pass**

Run: `npm test -- tests/blade.test.js`
Expected: PASS

- [ ] **Step 7: Commit the orbiting blade implementation**

```bash
git add src/game/logic/blade.js src/game/systems/BladeManager.js src/game/scenes/GameScene.js tests/blade.test.js
git commit -m "feat: add orbiting blade ability"
```

### Task 4: Add Spitter Behavior and Enemy Projectiles

**Files:**
- Create: `src/game/logic/enemyBehavior.js`
- Modify: `src/game/logic/spawn.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Create: `tests/enemyBehavior.test.js`
- Modify: `tests/spawn.test.js`

- [ ] **Step 1: Write the failing tests for spitter movement and roster composition**

```js
import { describe, expect, it } from 'vitest';
import { getEnemyIntent, shouldEnemyShoot } from '../src/game/logic/enemyBehavior.js';
import { getSpawnProfile } from '../src/game/logic/spawn.js';

describe('getEnemyIntent', () => {
  it('makes spitters back away when too close to the player', () => {
    const intent = getEnemyIntent(
      { type: 'spitter', preferredRange: 240 },
      { x: 80, y: 0 },
      { x: 0, y: 0 }
    );

    expect(intent.moveX).toBeGreaterThan(0);
  });
});

describe('shouldEnemyShoot', () => {
  it('fires when a spitter is inside its attack band and cooldown elapsed', () => {
    expect(shouldEnemyShoot({ type: 'spitter', nextShotAt: 0 }, 1000, 220)).toBe(true);
  });
});

describe('getSpawnProfile', () => {
  it('adds spitters to the roster in later waves', () => {
    expect(getSpawnProfile(20).weights.spitter).toBe(0);
    expect(getSpawnProfile(90).weights.spitter).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the enemy behavior and spawn tests to verify they fail**

Run: `npm test -- tests/enemyBehavior.test.js`
Expected: FAIL because `enemyBehavior.js` does not exist yet

Run: `npm test -- tests/spawn.test.js`
Expected: FAIL because `weights.spitter` is not part of the spawn profile yet

- [ ] **Step 3: Add pure enemy behavior helpers**

```js
export function getEnemyIntent(enemy, enemyPosition, playerPosition) {
  const dx = playerPosition.x - enemyPosition.x;
  const dy = playerPosition.y - enemyPosition.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;

  if (enemy.type !== 'spitter') {
    return { moveX: nx, moveY: ny, wantsToShoot: false };
  }

  const preferredRange = enemy.preferredRange ?? 240;
  const tolerance = 28;

  if (distance < preferredRange - tolerance) {
    return { moveX: -nx, moveY: -ny, wantsToShoot: false };
  }

  if (distance > preferredRange + tolerance) {
    return { moveX: nx, moveY: ny, wantsToShoot: false };
  }

  return { moveX: 0, moveY: 0, wantsToShoot: true };
}

export function shouldEnemyShoot(enemy, now, distanceToPlayer) {
  return enemy.type === 'spitter' && distanceToPlayer <= (enemy.attackRange ?? 320) && now >= enemy.nextShotAt;
}
```

- [ ] **Step 4: Extend spawn profiles with weighted enemy composition**

```js
export function getSpawnProfile(elapsedSeconds) {
  return {
    cooldownMs: Math.max(210, 900 - elapsedSeconds * 12),
    batchSize: Math.min(1 + Math.floor(elapsedSeconds / 16), 6),
    weights: {
      basic: elapsedSeconds < 35 ? 1 : 0.62,
      tough: elapsedSeconds < 35 ? 0 : 0.28,
      spitter: elapsedSeconds < 55 ? 0 : Math.min(0.22, 0.06 + elapsedSeconds / 500)
    }
  };
}

export function pickEnemyType(weights, roll = Math.random()) {
  const entries = Object.entries(weights).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let cursor = roll * total;

  for (const [key, value] of entries) {
    cursor -= value;
    if (cursor <= 0) {
      return key;
    }
  }

  return entries.at(-1)?.[0] ?? 'basic';
}
```

- [ ] **Step 5: Implement spitter enemy type and enemy projectile firing in the enemy manager**

```js
const ENEMY_TYPES = {
  basic: { texture: 'enemy-basic', speed: 92, maxHealth: 34, xpValue: 4, contactDamage: 8 },
  tough: { texture: 'enemy-tough', speed: 64, maxHealth: 76, xpValue: 9, contactDamage: 12 },
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
    attackCooldownMs: 1600
  }
};

this.enemyProjectileGroup = scene.physics.add.group();

update(deltaMs, elapsedSeconds, now) {
  const profile = getSpawnProfile(elapsedSeconds);
  this.group.children.iterate((enemy) => {
    if (!enemy?.active) return;

    const intent = getEnemyIntent(enemy, enemy, this.player.sprite);
    enemy.setVelocity(intent.moveX * enemy.speed, intent.moveY * enemy.speed);

    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

    if (shouldEnemyShoot(enemy, now, distance)) {
      this.fireEnemyProjectile(enemy);
      enemy.nextShotAt = now + enemy.attackCooldownMs;
    }
  });
}
```

- [ ] **Step 6: Wire enemy projectile overlap into the scene**

```js
this.physics.add.overlap(this.player.sprite, this.enemyManager.enemyProjectileGroup, (_, projectile) => {
  projectile.destroy();
  const died = this.player.takeDamage(projectile.damage);
  if (died) {
    this.openGameOver();
  }
});
```

- [ ] **Step 7: Run the enemy behavior and spawn tests to verify they pass**

Run: `npm test -- tests/enemyBehavior.test.js`
Expected: PASS

Run: `npm test -- tests/spawn.test.js`
Expected: PASS

- [ ] **Step 8: Commit the ranged enemy work**

```bash
git add src/game/logic/enemyBehavior.js src/game/logic/spawn.js src/game/systems/EnemyManager.js src/game/scenes/GameScene.js tests/enemyBehavior.test.js tests/spawn.test.js
git commit -m "feat: add spitter enemy behavior"
```

### Task 5: Integrate MVP UI and Scene Flow

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `src/game/systems/UpgradeSystem.js`

- [ ] **Step 1: Update the scene to request filtered upgrade choices from the player state**

```js
openLevelUp() {
  this.isGameplayPaused = true;
  this.physics.world.pause();
  this.player.stop();
  this.enemyManager.stopAll();
  this.projectileManager.stopAll();
  this.levelUpOverlay.show(this.upgradeSystem.getChoices(this.player.stats));
}
```

- [ ] **Step 2: Update the HUD to surface new build state**

```js
update({ health, maxHealth, level, xp, xpToNext, timeMs, enemyCount, projectileCount, bladeCount }) {
  hpText.setText(`HP ${Math.ceil(health)} / ${maxHealth}`);
  levelText.setText(`Level ${level}   Threats ${enemyCount}`);
  xpText.setText(`XP ${xp} / ${xpToNext}   Shots ${projectileCount}   Blades ${bladeCount}`);
  timeText.setText(`Time ${formatTime(timeMs)}`);
}
```

- [ ] **Step 3: Update level-up card copy so unlocks and upgrades are readable**

```js
card.title.setText(choice.label);
card.description.setText(choice.description);
card.hint.setText(`Press ${index + 1} or click`);
```

- [ ] **Step 4: Add generated textures for the blade and spitter**

```js
graphics.clear();
graphics.fillStyle(0xd9f2ff, 1);
graphics.fillTriangle(6, 20, 14, 0, 22, 20);
graphics.generateTexture('blade', 28, 22);

graphics.clear();
graphics.fillStyle(0x6a8ad8, 1);
graphics.fillCircle(14, 14, 14);
graphics.lineStyle(2, 0xdbe5ff, 1);
graphics.strokeCircle(14, 14, 13);
graphics.generateTexture('enemy-spitter', 28, 28);
```

- [ ] **Step 5: Keep the runtime verification loop intact**

Run: `npm test`
Expected: all combat, blade, progression, spawn, and enemy behavior tests pass

Run: `npm run build`
Expected: production build succeeds with the MVP runtime

- [ ] **Step 6: Commit the integrated MVP scene**

```bash
git add src/game/scenes/GameScene.js src/game/ui/overlayFactory.js src/game/systems/UpgradeSystem.js
git commit -m "feat: integrate survivor mvp systems"
```

### Task 6: Final Verification and Wrap-Up

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/ui/overlayFactory.js`

- [ ] **Step 1: Run the complete verification set**

Run: `npm test`
Expected: PASS with every test file green

Run: `npm run build`
Expected: PASS with a built `dist/` bundle

- [ ] **Step 2: Check the worktree status before completion**

Run: `git status --short`
Expected: either clean or only the intended files staged for the final commit

- [ ] **Step 3: Commit any final MVP polish**

```bash
git add src/game/scenes/GameScene.js src/game/systems/EnemyManager.js src/game/systems/ProjectileManager.js src/game/ui/overlayFactory.js
git commit -m "feat: polish survivor mvp combat loop"
```
