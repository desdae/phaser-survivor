# Survivor Perf LOD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the FPS dropoff at large swarm sizes by adding distance-based enemy simulation LOD, cached animation stepping, near-only combat queries, and projectile pooling while preserving gameplay feel near the player.

**Architecture:** Keep the existing Phaser scene and system boundaries, but make `EnemyManager` the owner of crowd-performance policy: distance tiering, cadence gating, animation stepping, and near-query construction. Extend the current combat helper/query layer and projectile manager rather than rewriting the engine so the work lands as focused, testable slices.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Create: `src/game/logic/enemyLod.js`
- Create: `tests/enemyLod.test.js`
- Modify: `src/game/logic/combat.js`
- Modify: `src/game/logic/enemyVisuals.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/systems/BladeManager.js`
- Modify: `src/game/systems/BoomerangManager.js`
- Modify: `src/game/systems/NovaManager.js`
- Modify: `src/game/systems/MeteorManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `tests/combat.test.js`
- Modify: `tests/enemyManager.test.js`
- Modify: `tests/runtimeFlow.test.js`

### Task 1: Add Pure Enemy LOD Helpers

**Files:**
- Create: `src/game/logic/enemyLod.js`
- Create: `tests/enemyLod.test.js`

- [ ] **Step 1: Write the failing LOD helper tests**

```js
import { describe, expect, it } from 'vitest';
import {
  ANIMATION_STEP_MS,
  FAR_UPDATE_INTERVAL,
  MID_UPDATE_INTERVAL,
  NEAR_DISTANCE_SQ,
  classifyEnemyTier,
  shouldAdvanceAnimation,
  shouldRefreshEnemyLogic
} from '../src/game/logic/enemyLod.js';

describe('classifyEnemyTier', () => {
  it('returns near for enemies inside the near band', () => {
    expect(classifyEnemyTier({ x: 40, y: 30 }, { x: 0, y: 0 })).toBe('near');
  });

  it('returns mid for enemies outside the near band but not far away', () => {
    expect(classifyEnemyTier({ x: 520, y: 0 }, { x: 0, y: 0 })).toBe('mid');
  });

  it('returns far for distant enemies', () => {
    expect(classifyEnemyTier({ x: 1400, y: 0 }, { x: 0, y: 0 })).toBe('far');
  });
});

describe('shouldRefreshEnemyLogic', () => {
  it('always refreshes near enemies', () => {
    expect(shouldRefreshEnemyLogic('near', 10)).toBe(true);
  });

  it('gates mid and far enemies by cadence frame', () => {
    expect(shouldRefreshEnemyLogic('mid', MID_UPDATE_INTERVAL)).toBe(true);
    expect(shouldRefreshEnemyLogic('mid', MID_UPDATE_INTERVAL + 1)).toBe(false);
    expect(shouldRefreshEnemyLogic('far', FAR_UPDATE_INTERVAL)).toBe(true);
    expect(shouldRefreshEnemyLogic('far', FAR_UPDATE_INTERVAL + 1)).toBe(false);
  });
});

describe('shouldAdvanceAnimation', () => {
  it('only advances when the animation timer reaches the next step', () => {
    expect(shouldAdvanceAnimation(ANIMATION_STEP_MS - 1, 0)).toBe(false);
    expect(shouldAdvanceAnimation(ANIMATION_STEP_MS, 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the LOD helper tests to verify they fail**

Run: `npm test -- tests/enemyLod.test.js`  
Expected: FAIL because `src/game/logic/enemyLod.js` does not exist yet

- [ ] **Step 3: Add the pure LOD helper module**

```js
export const NEAR_DISTANCE = 420;
export const MID_DISTANCE = 960;
export const NEAR_DISTANCE_SQ = NEAR_DISTANCE * NEAR_DISTANCE;
export const MID_DISTANCE_SQ = MID_DISTANCE * MID_DISTANCE;
export const MID_UPDATE_INTERVAL = 3;
export const FAR_UPDATE_INTERVAL = 6;
export const ANIMATION_STEP_MS = 120;

export function classifyEnemyTier(enemy, playerPosition) {
  const dx = enemy.x - playerPosition.x;
  const dy = enemy.y - playerPosition.y;
  const distanceSq = dx * dx + dy * dy;

  if (distanceSq <= NEAR_DISTANCE_SQ) {
    return 'near';
  }

  if (distanceSq <= MID_DISTANCE_SQ) {
    return 'mid';
  }

  return 'far';
}

export function shouldRefreshEnemyLogic(tier, frameIndex) {
  if (tier === 'near') {
    return true;
  }

  if (tier === 'mid') {
    return frameIndex % MID_UPDATE_INTERVAL === 0;
  }

  return frameIndex % FAR_UPDATE_INTERVAL === 0;
}

export function shouldAdvanceAnimation(now, nextAnimationAt) {
  return now >= nextAnimationAt;
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run: `npm test -- tests/enemyLod.test.js`  
Expected: PASS

- [ ] **Step 5: Commit the LOD helpers**

```bash
git add src/game/logic/enemyLod.js tests/enemyLod.test.js
git commit -m "feat: add enemy lod helpers"
```

### Task 2: Add Near-Only Query Helpers and Coverage

**Files:**
- Modify: `src/game/logic/combat.js`
- Modify: `tests/combat.test.js`

- [ ] **Step 1: Write the failing near-query tests**

```js
import { describe, expect, it } from 'vitest';
import {
  createEnemyQuery,
  getNearbyEnemies,
  getQueryEnemiesByTier
} from '../src/game/logic/combat.js';

describe('getQueryEnemiesByTier', () => {
  it('returns only enemies in the requested tier bucket', () => {
    const query = createEnemyQuery(
      [
        { active: true, id: 'near', x: 50, y: 0, lodTier: 'near' },
        { active: true, id: 'mid', x: 500, y: 0, lodTier: 'mid' },
        { active: true, id: 'far', x: 1200, y: 0, lodTier: 'far' }
      ],
      96
    );

    expect(getQueryEnemiesByTier(query, 'near').map((enemy) => enemy.id)).toEqual(['near']);
    expect(getQueryEnemiesByTier(query, 'mid').map((enemy) => enemy.id)).toEqual(['mid']);
  });
});

describe('getNearbyEnemies', () => {
  it('prefers tier-filtered local buckets when a query is provided', () => {
    const query = createEnemyQuery(
      [
        { active: true, id: 'near-a', x: 10, y: 10, lodTier: 'near' },
        { active: true, id: 'near-b', x: 40, y: 0, lodTier: 'near' },
        { active: true, id: 'mid-a', x: 60, y: 0, lodTier: 'mid' }
      ],
      96
    );

    expect(
      getNearbyEnemies({ x: 0, y: 0 }, query, 80, Number.POSITIVE_INFINITY, null, ['near']).map(
        (enemy) => enemy.id
      )
    ).toEqual(['near-a', 'near-b']);
  });
});
```

- [ ] **Step 2: Run the combat tests to verify they fail**

Run: `npm test -- tests/combat.test.js`  
Expected: FAIL because `getQueryEnemiesByTier` and tier-filtered nearby search do not exist yet

- [ ] **Step 3: Extend the combat query helpers**

```js
export function createEnemyQuery(enemies, cellSize = 96) {
  const cells = new Map();
  const enemiesByTier = {
    near: [],
    mid: [],
    far: []
  };
  const activeEnemies = [];

  for (const enemy of enemies ?? []) {
    if (!enemy?.active) {
      continue;
    }

    activeEnemies.push(enemy);
    enemiesByTier[enemy.lodTier ?? 'near'].push(enemy);
    const cellX = Math.floor(enemy.x / cellSize);
    const cellY = Math.floor(enemy.y / cellSize);
    const key = `${cellX}:${cellY}`;

    if (!cells.has(key)) {
      cells.set(key, []);
    }

    cells.get(key).push(enemy);
  }

  return {
    cellSize,
    cells,
    enemies: activeEnemies,
    enemiesByTier
  };
}

export function getQueryEnemiesByTier(query, tier) {
  return query?.enemiesByTier?.[tier] ?? [];
}

export function getNearbyEnemies(origin, enemySource, maxDistance, limit = Number.POSITIVE_INFINITY, excludedEnemyKeys = null, allowedTiers = null) {
  const tierFilter = allowedTiers ? new Set(allowedTiers) : null;

  if (!isEnemyQuery(enemySource)) {
    const results = [];

    for (const enemy of enemySource ?? []) {
      if (!enemy?.active) {
        continue;
      }

      if (tierFilter && !tierFilter.has(enemy.lodTier ?? 'near')) {
        continue;
      }

      const enemyKey = getEnemyKey(enemy);

      if (excludedEnemyKeys?.has?.(enemyKey)) {
        continue;
      }

      const dx = enemy.x - origin.x;
      const dy = enemy.y - origin.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq > maxDistance * maxDistance) {
        continue;
      }

      results.push(enemy);

      if (results.length >= limit) {
        break;
      }
    }

    return results;
  }

  // Keep the existing query-cell scan, but skip any bucket entries whose `lodTier`
  // is not included in `allowedTiers` when that filter is provided.
}
```

- [ ] **Step 4: Run the combat tests to verify they pass**

Run: `npm test -- tests/combat.test.js`  
Expected: PASS

- [ ] **Step 5: Commit the tier-aware query helpers**

```bash
git add src/game/logic/combat.js tests/combat.test.js
git commit -m "feat: add tier-aware enemy queries"
```

### Task 3: Add EnemyManager LOD, Cached Animation Stepping, and Near Query Ownership

**Files:**
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/logic/enemyVisuals.js`
- Modify: `tests/enemyManager.test.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing EnemyManager LOD tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

describe('EnemyManager update', () => {
  it('stores enemy tiers and builds a near-only query for local combat systems', () => {
    const manager = createEnemyManagerHarness();
    const nearEnemy = makeEnemy({ x: 80, y: 0 });
    const farEnemy = makeEnemy({ x: 1400, y: 0 });
    manager.getLivingEnemies = vi.fn().mockReturnValue([nearEnemy, farEnemy]);

    manager.update(16, 60, 1000);

    expect(nearEnemy.lodTier).toBe('near');
    expect(farEnemy.lodTier).toBe('far');
    expect(manager.getNearEnemyQuery().enemies.every((enemy) => enemy.lodTier === 'near')).toBe(true);
  });

  it('reuses cached intent for far enemies between cadence ticks', () => {
    const manager = createEnemyManagerHarness();
    const farEnemy = makeEnemy({ x: 1400, y: 0 });
    farEnemy.cachedMoveX = -0.4;
    farEnemy.cachedMoveY = 0.2;
    manager.getLivingEnemies = vi.fn().mockReturnValue([farEnemy]);

    manager.frameIndex = 1;
    manager.update(16, 60, 1000);

    expect(farEnemy.setVelocity).toHaveBeenCalledWith(
      farEnemy.cachedMoveX * farEnemy.speed,
      farEnemy.cachedMoveY * farEnemy.speed
    );
  });

  it('only advances animated textures when the animation timer ticks', () => {
    const manager = createEnemyManagerHarness();
    const enemy = makeEnemy({ x: 80, y: 0, visualFrames: ['a', 'b', 'c'] });
    manager.getLivingEnemies = vi.fn().mockReturnValue([enemy]);

    manager.nextAnimationStepAt = 1000;
    manager.update(16, 60, 999);
    manager.update(16, 60, 1000);

    expect(enemy.setTexture).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the EnemyManager/runtime tests to verify they fail**

Run: `npm test -- tests/enemyManager.test.js tests/runtimeFlow.test.js`  
Expected: FAIL because tiers, near-query accessors, cadence gating, and cached animation stepping do not exist yet

- [ ] **Step 3: Add cached animation frame helpers in the visuals module**

```js
export function advanceVisualFrame(enemy) {
  const frames = enemy.visualFrames ?? [];

  if (frames.length <= 1) {
    return frames[0] ?? enemy.texture?.key ?? null;
  }

  enemy.visualFrameIndex = ((enemy.visualFrameIndex ?? 0) + 1) % frames.length;
  return frames[enemy.visualFrameIndex];
}
```

- [ ] **Step 4: Add EnemyManager LOD ownership**

```js
import {
  ANIMATION_STEP_MS,
  classifyEnemyTier,
  shouldAdvanceAnimation,
  shouldRefreshEnemyLogic
} from '../logic/enemyLod.js';
import { createEnemyQuery } from '../logic/combat.js';
import { advanceVisualFrame } from '../logic/enemyVisuals.js';

constructor(...) {
  // existing fields...
  this.frameIndex = 0;
  this.nextAnimationStepAt = 0;
  this.nearEnemyQuery = createEnemyQuery([]);
}

update(deltaMs, elapsedSeconds, now = this.scene.time?.now ?? 0) {
  this.frameIndex += 1;
  const livingEnemies = this.getLivingEnemies();
  const playerSprite = this.player.sprite ?? this.player;
  const animationStepDue = shouldAdvanceAnimation(now, this.nextAnimationStepAt);

  if (animationStepDue) {
    this.nextAnimationStepAt = now + ANIMATION_STEP_MS;
  }

  for (const enemy of livingEnemies) {
    enemy.lodTier = classifyEnemyTier(enemy, playerSprite);

    if (animationStepDue && (enemy.lodTier === 'near' || this.frameIndex % 2 === 0)) {
      const nextFrame = advanceVisualFrame(enemy);
      if (nextFrame && enemy.texture?.key !== nextFrame) {
        enemy.setTexture(nextFrame);
      }
    }

    if (shouldRefreshEnemyLogic(enemy.lodTier, this.frameIndex)) {
      const baseIntent = getEnemyIntent(enemy, enemy, playerSprite);
      const intent =
        enemy.lodTier === 'near'
          ? applySwarmSpacing(baseIntent, enemy, livingEnemies)
          : baseIntent;
      enemy.cachedMoveX = intent.moveX;
      enemy.cachedMoveY = intent.moveY;
      enemy.cachedWantsToShoot = intent.wantsToShoot;
    }

    enemy.setVelocity((enemy.cachedMoveX ?? 0) * enemy.speed, (enemy.cachedMoveY ?? 0) * enemy.speed);
  }

  this.enemyQuery = createEnemyQuery(livingEnemies);
  this.nearEnemyQuery = createEnemyQuery(livingEnemies.filter((enemy) => enemy.lodTier === 'near'));
  return livingEnemies;
}

getNearEnemyQuery() {
  return this.nearEnemyQuery;
}
```

- [ ] **Step 5: Run the EnemyManager/runtime tests to verify they pass**

Run: `npm test -- tests/enemyManager.test.js tests/runtimeFlow.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the EnemyManager LOD layer**

```bash
git add src/game/logic/enemyVisuals.js src/game/systems/EnemyManager.js tests/enemyManager.test.js tests/runtimeFlow.test.js
git commit -m "feat: add enemy simulation lod"
```

### Task 4: Move Local Combat Systems to Near Query

**Files:**
- Modify: `src/game/systems/BladeManager.js`
- Modify: `src/game/systems/BoomerangManager.js`
- Modify: `src/game/systems/NovaManager.js`
- Modify: `src/game/systems/MeteorManager.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing scene/runtime tests for near-query usage**

```js
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('GameScene update', () => {
  it('passes the near-only query to local combat systems', () => {
    const nearQuery = { enemies: [{ id: 'near-1', active: true }], cells: new Map(), cellSize: 96, enemiesByTier: { near: [] } };
    const sceneLike = makeSceneHarness({
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue(nearQuery),
        update: vi.fn().mockReturnValue([{ id: 'near-1', active: true }])
      }
    });

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.bladeManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
    expect(sceneLike.novaManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      sceneLike.player.stats,
      16,
      nearQuery,
      sceneLike.enemyManager
    );
  });
});
```

- [ ] **Step 2: Run the runtime test to verify it fails**

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: FAIL because the scene still passes the full enemy snapshot to every combat system

- [ ] **Step 3: Change the scene to pass near query where appropriate**

```js
const livingEnemies = this.enemyManager.update(delta, this.elapsedMs / 1000, time) ?? [];
const nearEnemyQuery = this.enemyManager.getNearEnemyQuery?.() ?? this.enemyManager.getEnemyQuery?.() ?? livingEnemies;

this.projectileManager.tryFire(this.player, nearEnemyQuery, time);
this.bladeManager.update(this.player, this.player.stats, delta, time, nearEnemyQuery, this.enemyManager);
this.chainManager.update(this.player, this.player.stats, time, nearEnemyQuery, this.enemyManager);
this.novaManager.update(this.player, this.player.stats, time, nearEnemyQuery, this.enemyManager);
this.boomerangManager.update(this.player, this.player.stats, delta, time, nearEnemyQuery, this.enemyManager);
this.meteorManager.update(this.player, this.player.stats, time, nearEnemyQuery, this.enemyManager);
```

- [ ] **Step 4: Update the local combat systems to accept query objects cleanly**

```js
import { getNearbyEnemies, getNearestEnemy } from '../logic/combat.js';

update(player, stats, deltaMs, now, enemies, enemyManager) {
  const enemyQuery = enemies;
  const target = getNearestEnemy(player.sprite, enemyQuery);

  if (!target) {
    return false;
  }

  for (const enemy of getNearbyEnemies(target, enemyQuery, 180)) {
    enemyManager.damageEnemy(enemy, stats.someDamageValue, 'someWeaponKey');
  }
}
```

- [ ] **Step 5: Run the runtime test to verify it passes**

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the near-query combat wiring**

```bash
git add src/game/scenes/GameScene.js src/game/systems/BladeManager.js src/game/systems/BoomerangManager.js src/game/systems/NovaManager.js src/game/systems/MeteorManager.js src/game/systems/ProjectileManager.js tests/runtimeFlow.test.js
git commit -m "perf: use near enemy query for local combat"
```

### Task 5: Pool Projectiles Instead of Constantly Creating and Destroying Them

**Files:**
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `tests/combat.test.js`
- Modify: `tests/enemyManager.test.js`

- [ ] **Step 1: Write the failing pooling tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { ProjectileManager } from '../src/game/systems/ProjectileManager.js';

describe('ProjectileManager pooling', () => {
  it('reuses an inactive projectile instead of creating a new one', () => {
    const { manager, projectiles, group } = createManagerHarness();
    const recycled = projectiles[0];
    recycled.active = false;
    recycled.setActive = vi.fn(function setActive(value) { this.active = value; return this; });
    group.create = vi.fn(() => {
      throw new Error('should not create a fresh projectile');
    });

    const projectile = manager.fireProjectile({ x: 0, y: 0 }, { x: 1, y: 0 }, {
      projectileDamage: 8,
      projectilePierce: 0,
      projectileRicochet: 0,
      projectileSpeed: 120
    }, 1000);

    expect(projectile).toBe(recycled);
    expect(recycled.active).toBe(true);
  });
});
```

- [ ] **Step 2: Run the pooling tests to verify they fail**

Run: `npm test -- tests/combat.test.js`  
Expected: FAIL because `fireProjectile` always calls `group.create`

- [ ] **Step 3: Add pooled projectile reuse in `ProjectileManager`**

```js
getReusableProjectile() {
  for (const projectile of this.group.getChildren()) {
    if (!projectile?.active) {
      projectile.setActive?.(true);
      projectile.setVisible?.(true);
      return projectile;
    }
  }

  return this.group.create(0, 0, 'projectile');
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

deactivateProjectile(projectile) {
  projectile.setVelocity?.(0, 0);
  projectile.setActive?.(false);
  projectile.setVisible?.(false);
}
```

- [ ] **Step 4: Reuse the same pooling approach for enemy projectiles**

```js
getReusableEnemyProjectile() {
  for (const projectile of this.enemyProjectileGroup.getChildren()) {
    if (!projectile?.active) {
      projectile.setActive?.(true);
      projectile.setVisible?.(true);
      return projectile;
    }
  }

  return this.enemyProjectileGroup.create(0, 0, 'projectile');
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
```

- [ ] **Step 5: Run the combat and enemy manager tests to verify they pass**

Run: `npm test -- tests/combat.test.js tests/enemyManager.test.js`  
Expected: PASS

- [ ] **Step 6: Commit projectile pooling**

```bash
git add src/game/systems/ProjectileManager.js src/game/systems/EnemyManager.js tests/combat.test.js tests/enemyManager.test.js
git commit -m "perf: pool transient projectiles"
```

### Task 6: Final Verification and Perf-Oriented Cleanup

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Add the final failing regression test for HUD/runtime compatibility**

```js
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('GameScene update', () => {
  it('still refreshes the hud using the full living enemy count while local systems use near query', () => {
    const sceneLike = makeSceneHarness({
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue({ enemies: [{ id: 'near-1', active: true }], cells: new Map(), cellSize: 96, enemiesByTier: { near: [] } }),
        update: vi.fn().mockReturnValue(new Array(3000).fill(0).map((_, index) => ({ active: true, id: index })))
      }
    });

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.refreshHud).toHaveBeenCalledWith(3000);
  });
});
```

- [ ] **Step 2: Run the runtime test to verify it fails if the count path breaks**

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: FAIL if HUD count or near-query/full-list separation is inconsistent

- [ ] **Step 3: Make any final runtime compatibility adjustments**

```js
// Keep the existing `livingEnemies.length` HUD path intact.
this.refreshHud(livingEnemies.length);

// Keep fps counter and overlay logic untouched while swapping the combat query path.
this.updateFpsCounter?.(time);
```

- [ ] **Step 4: Run the full verification set**

Run: `npm test`  
Expected: PASS with all LOD, query, pooling, combat, runtime, and UI tests green

Run: `npm run build`  
Expected: PASS with the production bundle generated successfully

Run: `git status --short`  
Expected: clean or only the intended final task changes before commit

- [ ] **Step 5: Commit the final perf LOD integration**

```bash
git add src/game/scenes/GameScene.js tests/runtimeFlow.test.js
git commit -m "perf: integrate crowd lod runtime"
```
