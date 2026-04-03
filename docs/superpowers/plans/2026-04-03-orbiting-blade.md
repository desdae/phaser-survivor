# Orbiting Blade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first orbiting blade passive ability so it can be unlocked, orbit the player, and damage nearby enemies during the live Phaser run.

**Architecture:** Keep the feature split into a pure logic helper, a focused runtime manager, and a small `GameScene` wiring change. The helper owns geometry and cooldown rules, the manager owns sprite lifecycle and contact checks, and the scene remains responsible for creating the texture and driving update calls.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Create: `src/game/logic/blade.js`
- Create: `src/game/systems/BladeManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Create: `tests/blade.test.js`

### Task 1: Add the failing blade tests

**Files:**
- Create: `tests/blade.test.js`

- [ ] **Step 1: Write the failing test file**

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
Expected: FAIL because `src/game/logic/blade.js` does not exist yet.

### Task 2: Implement the pure blade helpers

**Files:**
- Create: `src/game/logic/blade.js`

- [ ] **Step 1: Implement the helper functions**

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

- [ ] **Step 2: Run the blade tests to verify they pass**

Run: `npm test -- tests/blade.test.js`
Expected: PASS.

### Task 3: Wire the blade runtime into the scene

**Files:**
- Create: `src/game/systems/BladeManager.js`
- Modify: `src/game/scenes/GameScene.js`

- [ ] **Step 1: Add the blade manager**

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

    const points = getBladePositions(
      player.sprite,
      playerStats.bladeCount,
      playerStats.bladeOrbitRadius,
      this.rotationRad
    );

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

- [ ] **Step 2: Instantiate the manager and drive it from `GameScene.update()`**

```js
import { BladeManager } from '../systems/BladeManager.js';

// in create()
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

- [ ] **Step 3: Add the blade texture in `createTextures()`**

```js
graphics.clear();
graphics.fillStyle(0xd9f2ff, 1);
graphics.fillTriangle(6, 20, 14, 0, 22, 20);
graphics.generateTexture('blade', 28, 22);
```

- [ ] **Step 4: Run the blade tests again**

Run: `npm test -- tests/blade.test.js`
Expected: PASS.

### Task 4: Commit the feature

**Files:**
- Create: `src/game/logic/blade.js`
- Create: `src/game/systems/BladeManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Create: `tests/blade.test.js`

- [ ] **Step 1: Review the worktree**

Run: `git status --short`
Expected: only the blade files and plan document are changed.

- [ ] **Step 2: Commit the implementation**

```bash
git add src/game/logic/blade.js src/game/systems/BladeManager.js src/game/scenes/GameScene.js tests/blade.test.js docs/superpowers/plans/2026-04-03-orbiting-blade.md
git commit -m "feat: add orbiting blade ability"
```
