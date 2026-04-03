# Survivor Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable Phaser survivor prototype with `WASD` movement, nearest-target auto-fire, enemy waves, XP pickups, level-up upgrades, death, and restart.

**Architecture:** Use a Vite-powered Phaser app with one `GameScene` and a small set of focused managers plus pure gameplay logic modules. Keep targeting, spawning, progression, and upgrade rules in testable utility files so the scene stays thin and future content can grow without a rewrite.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `src/game/scenes/GameScene.js`
- Create: `src/game/entities/Player.js`
- Create: `src/game/systems/EnemyManager.js`
- Create: `src/game/systems/ProjectileManager.js`
- Create: `src/game/systems/PickupManager.js`
- Create: `src/game/systems/UpgradeSystem.js`
- Create: `src/game/logic/combat.js`
- Create: `src/game/logic/spawn.js`
- Create: `src/game/logic/progression.js`
- Create: `src/game/ui/overlayFactory.js`
- Create: `tests/combat.test.js`
- Create: `tests/spawn.test.js`
- Create: `tests/progression.test.js`

### Task 1: Scaffold the Playable Project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`

- [ ] **Step 1: Add the project manifest and scripts**

```json
{
  "name": "survivor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Add ignore rules**

```gitignore
node_modules/
dist/
coverage/
.DS_Store
```

- [ ] **Step 3: Create the app shell**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Survivor Prototype</title>
    <script type="module" src="/src/main.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

- [ ] **Step 4: Create the Phaser bootstrap**

```js
import Phaser from 'phaser';
import './styles.css';
import { GameScene } from './game/scenes/GameScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#08121c',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [GameScene]
});
```

- [ ] **Step 5: Add base page styling**

```css
html, body, #app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #08121c;
}

canvas {
  display: block;
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: packages installed with no blocking errors

- [ ] **Step 7: Verify the scaffold builds**

Run: `npm run build`
Expected: Vite build completes successfully

- [ ] **Step 8: Commit the scaffold**

```bash
git add package.json .gitignore index.html src/main.js src/styles.css
git commit -m "chore: scaffold phaser survivor app"
```

### Task 2: Build Core Logic with TDD

**Files:**
- Create: `src/game/logic/combat.js`
- Create: `src/game/logic/spawn.js`
- Create: `src/game/logic/progression.js`
- Test: `tests/combat.test.js`
- Test: `tests/spawn.test.js`
- Test: `tests/progression.test.js`

- [ ] **Step 1: Write the failing combat tests**

```js
import { describe, expect, it } from 'vitest';
import { getNearestEnemy, getProjectileVelocity } from '../src/game/logic/combat.js';

describe('getNearestEnemy', () => {
  it('returns the closest living enemy', () => {
    const player = { x: 0, y: 0 };
    const enemies = [
      { active: true, x: 100, y: 0, id: 'far' },
      { active: true, x: 25, y: 0, id: 'near' }
    ];

    expect(getNearestEnemy(player, enemies)?.id).toBe('near');
  });
});

describe('getProjectileVelocity', () => {
  it('returns normalized velocity scaled by projectile speed', () => {
    expect(getProjectileVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 500)).toEqual({
      x: 300,
      y: 400
    });
  });
});
```

- [ ] **Step 2: Verify combat tests fail**

Run: `npm test -- tests/combat.test.js`
Expected: FAIL because `combat.js` does not exist yet

- [ ] **Step 3: Implement combat logic**

```js
export function getNearestEnemy(origin, enemies) {
  let best = null;
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  for (const enemy of enemies) {
    if (!enemy?.active) continue;
    const dx = enemy.x - origin.x;
    const dy = enemy.y - origin.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      best = enemy;
    }
  }

  return best;
}

export function getProjectileVelocity(origin, target, speed) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: (dx / length) * speed, y: (dy / length) * speed };
}
```

- [ ] **Step 4: Verify combat tests pass**

Run: `npm test -- tests/combat.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing spawn tests**

```js
import { describe, expect, it } from 'vitest';
import { getSpawnPosition, getSpawnProfile } from '../src/game/logic/spawn.js';

describe('getSpawnPosition', () => {
  it('spawns outside the current camera view', () => {
    const rect = { left: 0, right: 100, top: 0, bottom: 100 };
    const point = getSpawnPosition(rect, 24, () => 0.1, () => 0.8);
    const outsideX = point.x < rect.left || point.x > rect.right;
    const outsideY = point.y < rect.top || point.y > rect.bottom;
    expect(outsideX || outsideY).toBe(true);
  });
});

describe('getSpawnProfile', () => {
  it('unlocks tougher enemies over time', () => {
    expect(getSpawnProfile(5).allowTough).toBe(false);
    expect(getSpawnProfile(45).allowTough).toBe(true);
  });
});
```

- [ ] **Step 6: Verify spawn tests fail**

Run: `npm test -- tests/spawn.test.js`
Expected: FAIL because `spawn.js` does not exist yet

- [ ] **Step 7: Implement spawn logic**

```js
const SIDES = ['top', 'right', 'bottom', 'left'];

export function getSpawnPosition(view, margin, sideRng = Math.random, laneRng = Math.random) {
  const side = SIDES[Math.floor(sideRng() * SIDES.length)];
  const laneX = view.left + laneRng() * (view.right - view.left);
  const laneY = view.top + laneRng() * (view.bottom - view.top);

  if (side === 'top') return { x: laneX, y: view.top - margin };
  if (side === 'right') return { x: view.right + margin, y: laneY };
  if (side === 'bottom') return { x: laneX, y: view.bottom + margin };
  return { x: view.left - margin, y: laneY };
}

export function getSpawnProfile(elapsedSeconds) {
  return {
    cooldownMs: Math.max(220, 900 - elapsedSeconds * 12),
    batchSize: Math.min(1 + Math.floor(elapsedSeconds / 18), 5),
    allowTough: elapsedSeconds >= 35
  };
}
```

- [ ] **Step 8: Verify spawn tests pass**

Run: `npm test -- tests/spawn.test.js`
Expected: PASS

- [ ] **Step 9: Write the failing progression tests**

```js
import { describe, expect, it } from 'vitest';
import { awardXp, getXpToNextLevel, rollUpgradeChoices } from '../src/game/logic/progression.js';

describe('awardXp', () => {
  it('levels up and carries overflow xp', () => {
    const state = awardXp({ level: 1, xp: 0 }, 12);
    expect(state.level).toBe(2);
    expect(state.xp).toBe(2);
  });
});

describe('rollUpgradeChoices', () => {
  it('returns three unique upgrades', () => {
    const choices = rollUpgradeChoices([
      { key: 'damage' },
      { key: 'speed' },
      { key: 'health' },
      { key: 'pickup' }
    ], () => 0.1, 3);

    expect(new Set(choices.map((choice) => choice.key)).size).toBe(3);
  });
});
```

- [ ] **Step 10: Verify progression tests fail**

Run: `npm test -- tests/progression.test.js`
Expected: FAIL because `progression.js` does not exist yet

- [ ] **Step 11: Implement progression logic**

```js
export function getXpToNextLevel(level) {
  return 10 + (level - 1) * 6;
}

export function awardXp(state, amount) {
  let level = state.level;
  let xp = state.xp + amount;
  let xpToNext = getXpToNextLevel(level);
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = getXpToNextLevel(level);
    leveledUp = true;
  }

  return { level, xp, xpToNext, leveledUp };
}

export function rollUpgradeChoices(pool, rng = Math.random, count = 3) {
  const bag = [...pool];
  const picks = [];

  while (bag.length > 0 && picks.length < count) {
    const index = Math.floor(rng() * bag.length);
    picks.push(...bag.splice(index, 1));
  }

  return picks;
}
```

- [ ] **Step 12: Verify progression tests pass**

Run: `npm test -- tests/progression.test.js`
Expected: PASS

- [ ] **Step 13: Run the full test suite**

Run: `npm test`
Expected: all logic tests pass

- [ ] **Step 14: Commit the logic layer**

```bash
git add src/game/logic tests
git commit -m "test: add survivor gameplay logic"
```

### Task 3: Implement the Phaser Runtime

**Files:**
- Create: `src/game/entities/Player.js`
- Create: `src/game/systems/EnemyManager.js`
- Create: `src/game/systems/ProjectileManager.js`
- Create: `src/game/systems/PickupManager.js`
- Create: `src/game/systems/UpgradeSystem.js`
- Create: `src/game/scenes/GameScene.js`

- [ ] **Step 1: Implement the player model**

```js
export class Player {
  constructor(scene, x, y) {
    this.sprite = scene.physics.add.image(x, y, 'player');
    this.stats = {
      speed: 220,
      maxHealth: 100,
      health: 100,
      level: 1,
      xp: 0,
      xpToNext: 10,
      projectileDamage: 18,
      projectileSpeed: 440,
      fireCooldownMs: 520,
      pickupRadius: 48
    };
  }
}
```

- [ ] **Step 2: Implement the enemy, projectile, and pickup managers**

```js
// EnemyManager: spawn based on getSpawnProfile(), chase player, remove dead enemies
// ProjectileManager: fire toward getNearestEnemy(), expire after range timeout, resolve hits
// PickupManager: spawn xp orbs, collect when player enters pickup radius
```

- [ ] **Step 3: Implement the upgrade system**

```js
export const UPGRADE_POOL = [
  { key: 'damage', label: 'Sharpened Shots', apply: (player) => { player.projectileDamage += 8; } },
  { key: 'fireRate', label: 'Rapid Trigger', apply: (player) => { player.fireCooldownMs = Math.max(160, player.fireCooldownMs - 60); } },
  { key: 'projectileSpeed', label: 'Hot Lead', apply: (player) => { player.projectileSpeed += 80; } },
  { key: 'maxHealth', label: 'Iron Skin', apply: (player) => { player.maxHealth += 20; player.health += 20; } },
  { key: 'heal', label: 'Field Medicine', apply: (player) => { player.health = Math.min(player.maxHealth, player.health + 30); } },
  { key: 'pickupRadius', label: 'Vacuum Grip', apply: (player) => { player.pickupRadius += 20; } }
];
```

- [ ] **Step 4: Build the gameplay scene**

```js
// preload generated textures, create player and managers, attach overlaps,
// follow the player camera, update movement/combat/spawns each frame,
// pause on level-up, show game-over on death, restart on input
```

- [ ] **Step 5: Verify the project still builds**

Run: `npm run build`
Expected: PASS with bundled Phaser app

- [ ] **Step 6: Commit the runtime implementation**

```bash
git add src
git commit -m "feat: implement survivor gameplay prototype"
```

### Task 4: Add UI Overlays and Final Verification

**Files:**
- Create: `src/game/ui/overlayFactory.js`
- Modify: `src/game/scenes/GameScene.js`

- [ ] **Step 1: Implement reusable overlay helpers**

```js
// createHud(scene), createLevelUpOverlay(scene), createGameOverOverlay(scene)
```

- [ ] **Step 2: Wire overlays into the scene**

```js
// keep HUD synced each frame, pause gameplay during level-up, resume after choice,
// show final time/level on death, support restart by button and key
```

- [ ] **Step 3: Run the full verification set**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit the finished prototype**

```bash
git add src docs/superpowers/plans/2026-04-03-survivor-prototype.md
git commit -m "feat: add playable survivor prototype"
```
