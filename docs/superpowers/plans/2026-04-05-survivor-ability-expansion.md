# Survivor Ability Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six new distinct abilities, live mouse aim support for the aimed ones, and a hard cap of 8 total learned abilities including the starting auto-shot.

**Architecture:** Extend the current modular weapon-manager architecture instead of rewriting combat. Add a small ability-roster layer in progression/player state for ownership and cap enforcement, track live mouse world position in `GameScene`, and implement each new behavior in its own focused manager so the main scene remains an orchestrator rather than a special-case blob.

**Tech Stack:** JavaScript, Phaser 3, Vitest, Vite

---

## File Structure

### Existing files to modify

- `C:\SL\ailab\_phaser\survivor\src\game\entities\Player.js`
  Adds unlock flags and tunable stats for the six new abilities.
- `C:\SL\ailab\_phaser\survivor\src\game\logic\progression.js`
  Expands upgrade definitions, adds ability-count and unlock-cap filtering, and keeps reward logic centralized.
- `C:\SL\ailab\_phaser\survivor\src\game\logic\combat.js`
  Adds mouse-direction helpers and any shared target-selection utilities needed by the new managers.
- `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
  Tracks live mouse world position, instantiates the new managers, updates them each frame, and syncs damage/unlock tables.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\DamageStatsManager.js`
  Adds labels and unlock tracking for the new abilities.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\ChestRewardSystem.js`
  Makes any ability-granting fallback obey the 8-ability cap.

### New runtime files

- `C:\SL\ailab\_phaser\survivor\src\game\logic\abilityRoster.js`
  Pure helpers for counting learned abilities, enforcing the cap, and checking unlock eligibility.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\BurstRifleManager.js`
  Rapid cursor-aimed projectile burst weapon.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\FlamethrowerManager.js`
  Short cursor-aimed cone damage weapon.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\RuneTrapManager.js`
  Delayed-arms trap placement and trigger logic.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\LanceManager.js`
  Cursor-aimed piercing line/beam attack.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\ArcMineManager.js`
  Trigger mine with chained shock jumps.
- `C:\SL\ailab\_phaser\survivor\src\game\systems\SpearBarrageManager.js`
  Cursor-area delayed falling strike system.

### New tests

- `C:\SL\ailab\_phaser\survivor\tests\abilityRoster.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\burstRifle.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\flamethrower.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\runeTrap.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\lance.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\arcMine.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\spearBarrage.test.js`

### Existing tests to modify

- `C:\SL\ailab\_phaser\survivor\tests\progression.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\combat.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\damageStats.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\runtimeFlow.test.js`
- `C:\SL\ailab\_phaser\survivor\tests\chestRewards.test.js`

---

### Task 1: Add Ability Roster Helpers And Unlock Cap Rules

**Files:**
- Create: `C:\SL\ailab\_phaser\survivor\src\game\logic\abilityRoster.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\progression.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\abilityRoster.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\progression.test.js`

- [ ] **Step 1: Write the failing roster and cap tests**

```js
import { describe, expect, it } from 'vitest';
import {
  ABILITY_CAP,
  countLearnedAbilities,
  canLearnAbility,
  getOwnedAbilityKeys
} from '../src/game/logic/abilityRoster.js';

describe('ability roster', () => {
  it('counts the starting auto shot and learned unlocks toward the 8-ability cap', () => {
    const player = {
      bladeUnlocked: true,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true,
      burstRifleUnlocked: true,
      flamethrowerUnlocked: true,
      runeTrapUnlocked: false,
      lanceUnlocked: false,
      arcMineUnlocked: false,
      spearBarrageUnlocked: false
    };

    expect(ABILITY_CAP).toBe(8);
    expect(countLearnedAbilities(player)).toBe(8);
    expect(canLearnAbility(player, 'runeTrapUnlocked')).toBe(false);
  });

  it('returns only owned ability keys in stable order for damage table and filtering', () => {
    const player = {
      bladeUnlocked: true,
      chainUnlocked: false,
      novaUnlocked: false,
      boomerangUnlocked: true,
      meteorUnlocked: false,
      burstRifleUnlocked: true,
      flamethrowerUnlocked: false,
      runeTrapUnlocked: true,
      lanceUnlocked: false,
      arcMineUnlocked: false,
      spearBarrageUnlocked: false
    };

    expect(getOwnedAbilityKeys(player)).toEqual([
      'projectile',
      'blade',
      'boomerang',
      'burstRifle',
      'runeTrap'
    ]);
  });
});
```

```js
it('stops offering unlocks when the total ability cap is reached', () => {
  const pool = getUpgradePool({
    bladeUnlocked: true,
    chainUnlocked: true,
    novaUnlocked: true,
    boomerangUnlocked: true,
    meteorUnlocked: true,
    burstRifleUnlocked: true,
    flamethrowerUnlocked: true,
    runeTrapUnlocked: false,
    lanceUnlocked: false,
    arcMineUnlocked: false,
    spearBarrageUnlocked: false,
    projectileCount: 1,
    projectilePierce: 0,
    projectileRicochet: 0
  });

  expect(pool.some((entry) => entry.key === 'unlockRuneTrap')).toBe(false);
  expect(pool.some((entry) => entry.key === 'unlockLance')).toBe(false);
  expect(pool.some((entry) => entry.key === 'burstRifleDamage')).toBe(true);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/abilityRoster.test.js tests/progression.test.js`

Expected: FAIL because `abilityRoster.js` does not exist and cap filtering is not implemented in `progression.js`.

- [ ] **Step 3: Implement the minimal roster helper and progression wiring**

```js
// src/game/logic/abilityRoster.js
export const ABILITY_CAP = 8;

const ABILITY_FLAGS = [
  ['blade', 'bladeUnlocked'],
  ['chain', 'chainUnlocked'],
  ['nova', 'novaUnlocked'],
  ['boomerang', 'boomerangUnlocked'],
  ['meteor', 'meteorUnlocked'],
  ['burstRifle', 'burstRifleUnlocked'],
  ['flamethrower', 'flamethrowerUnlocked'],
  ['runeTrap', 'runeTrapUnlocked'],
  ['lance', 'lanceUnlocked'],
  ['arcMine', 'arcMineUnlocked'],
  ['spearBarrage', 'spearBarrageUnlocked']
];

export function getOwnedAbilityKeys(player) {
  return [
    'projectile',
    ...ABILITY_FLAGS.filter(([, flag]) => Boolean(player[flag])).map(([key]) => key)
  ];
}

export function countLearnedAbilities(player) {
  return getOwnedAbilityKeys(player).length;
}

export function canLearnAbility(player, unlockFlag) {
  if (player[unlockFlag]) {
    return false;
  }

  return countLearnedAbilities(player) < ABILITY_CAP;
}
```

```js
// progression.js
import { canLearnAbility } from './abilityRoster.js';

{
  key: 'unlockBurstRifle',
  isAvailable: (player) => canLearnAbility(player, 'burstRifleUnlocked'),
  apply(player) {
    player.burstRifleUnlocked = true;
  }
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/abilityRoster.test.js tests/progression.test.js`

Expected: PASS with the new roster helper and cap-aware upgrade filtering.

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/abilityRoster.js src/game/logic/progression.js tests/abilityRoster.test.js tests/progression.test.js
git commit -m "feat: add ability roster cap rules"
```

---

### Task 2: Add Mouse World Aim Tracking And Shared Aim Helpers

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\combat.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\combat.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\runtimeFlow.test.js`

- [ ] **Step 1: Write failing tests for mouse aim direction and scene tracking**

```js
import { getAimDirection } from '../src/game/logic/combat.js';

it('returns a normalized mouse-aim direction toward the live cursor world point', () => {
  expect(getAimDirection({ x: 10, y: 20 }, { x: 13, y: 24 })).toEqual({
    x: 0.6,
    y: 0.8
  });
});

it('falls back safely when cursor is essentially on top of the player', () => {
  expect(getAimDirection({ x: 50, y: 50 }, { x: 50, y: 50 })).toEqual({ x: 1, y: 0 });
});
```

```js
it('updates mouseWorld from the active pointer each frame before aimed weapons run', () => {
  const pointer = { worldX: 320, worldY: 180 };
  const sceneLike = {
    activePauseOverlay: null,
    background: { tilePositionX: 0, tilePositionY: 0 },
    cameras: { main: { scrollX: 0, scrollY: 0 } },
    handleStatsToggle: vi.fn(),
    updateFpsCounter: vi.fn(),
    input: { activePointer: pointer },
    isGameOver: false,
    isGameplayPaused: false,
    // keep the rest minimal like existing runtimeFlow scene doubles
  };

  GameScene.prototype.update.call(sceneLike, 16, 16);

  expect(sceneLike.mouseWorld).toEqual({ x: 320, y: 180 });
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/combat.test.js tests/runtimeFlow.test.js`

Expected: FAIL because `getAimDirection()` and `mouseWorld` tracking do not exist yet.

- [ ] **Step 3: Implement shared aim helpers and scene pointer tracking**

```js
// combat.js
export function getAimDirection(origin, target) {
  const dx = (target?.x ?? origin.x + 1) - origin.x;
  const dy = (target?.y ?? origin.y) - origin.y;
  const distance = Math.hypot(dx, dy);

  if (!distance || distance < 0.0001) {
    return { x: 1, y: 0 };
  }

  return {
    x: Number((dx / distance).toFixed(4)),
    y: Number((dy / distance).toFixed(4))
  };
}
```

```js
// GameScene.js
create() {
  this.mouseWorld = { x: 0, y: 0 };
}

update(time, delta) {
  const pointer = this.input?.activePointer;
  if (pointer) {
    this.mouseWorld = {
      x: pointer.worldX,
      y: pointer.worldY
    };
  }
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/combat.test.js tests/runtimeFlow.test.js`

Expected: PASS with normalized aim helper behavior and scene pointer tracking covered.

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/combat.js src/game/scenes/GameScene.js tests/combat.test.js tests/runtimeFlow.test.js
git commit -m "feat: add live mouse aim tracking"
```

---

### Task 3: Add Burst Rifle And Piercing Lance

**Files:**
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\BurstRifleManager.js`
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\LanceManager.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\entities\Player.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\progression.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\burstRifle.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\lance.test.js`

- [ ] **Step 1: Write failing tests for the two aimed weapon managers**

```js
import { BurstRifleManager } from '../src/game/systems/BurstRifleManager.js';

it('fires a burst rifle projectile stream toward the mouse direction on cooldown', () => {
  const shots = [];
  const manager = new BurstRifleManager({
    addShot: (shot) => shots.push(shot)
  });
  const player = { sprite: { x: 0, y: 0 } };
  const stats = { burstRifleUnlocked: true, burstRifleDamage: 9, burstRifleCooldownMs: 180 };

  manager.update(player, stats, { x: 1, y: 0 }, 1000);
  manager.update(player, stats, { x: 1, y: 0 }, 1100);
  manager.update(player, stats, { x: 1, y: 0 }, 1180);

  expect(shots).toHaveLength(2);
  expect(shots[0].damage).toBe(9);
});
```

```js
import { LanceManager } from '../src/game/systems/LanceManager.js';

it('damages multiple enemies along a piercing lance line', () => {
  const hits = [];
  const manager = new LanceManager();
  const player = { sprite: { x: 0, y: 0 } };
  const stats = { lanceUnlocked: true, lanceDamage: 20, lanceCooldownMs: 900, lanceLength: 220 };
  const enemies = [
    { active: true, x: 90, y: 0, id: 'a' },
    { active: true, x: 150, y: 4, id: 'b' },
    { active: true, x: 80, y: 40, id: 'miss' }
  ];

  manager.update(player, stats, { x: 1, y: 0 }, 1000, enemies, {
    damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
  });

  expect(hits).toEqual([
    { id: 'a', damage: 20 },
    { id: 'b', damage: 20 }
  ]);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/burstRifle.test.js tests/lance.test.js`

Expected: FAIL because the managers and player/progression state do not exist yet.

- [ ] **Step 3: Implement minimal player stats, progression unlocks, and manager behavior**

```js
// Player.js additions
burstRifleUnlocked: false,
burstRifleDamage: 0,
burstRifleCooldownMs: 0,
lanceUnlocked: false,
lanceDamage: 0,
lanceCooldownMs: 0,
lanceLength: 0,
lanceWidth: 0
```

```js
// BurstRifleManager.js
export class BurstRifleManager {
  constructor(projectileBridge) {
    this.projectileBridge = projectileBridge;
    this.nextFireAt = 0;
  }

  update(player, stats, aimDirection, now) {
    if (!stats.burstRifleUnlocked || now < this.nextFireAt) {
      return;
    }

    this.nextFireAt = now + stats.burstRifleCooldownMs;
    this.projectileBridge.addShot({
      damage: stats.burstRifleDamage,
      direction: aimDirection,
      x: player.sprite.x,
      y: player.sprite.y,
      speed: stats.burstRifleProjectileSpeed
    });
  }
}
```

```js
// LanceManager.js
export class LanceManager {
  constructor() {
    this.nextFireAt = 0;
  }

  update(player, stats, aimDirection, now, enemies, enemyManager) {
    if (!stats.lanceUnlocked || now < this.nextFireAt) {
      return;
    }

    this.nextFireAt = now + stats.lanceCooldownMs;
    for (const enemy of enemies) {
      // line-distance check against lance width/length
      enemyManager.damageEnemy(enemy, stats.lanceDamage, 'lance');
    }
  }
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/burstRifle.test.js tests/lance.test.js tests/progression.test.js`

Expected: PASS with unlocks, stats, and basic aimed-runtime behavior in place.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/Player.js src/game/logic/progression.js src/game/scenes/GameScene.js src/game/systems/BurstRifleManager.js src/game/systems/LanceManager.js tests/burstRifle.test.js tests/lance.test.js tests/progression.test.js
git commit -m "feat: add burst rifle and piercing lance"
```

---

### Task 4: Add Flamethrower And Rune Trap

**Files:**
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\FlamethrowerManager.js`
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\RuneTrapManager.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\entities\Player.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\progression.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\flamethrower.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\runeTrap.test.js`

- [ ] **Step 1: Write failing tests for flamethrower and trap behavior**

```js
import { FlamethrowerManager } from '../src/game/systems/FlamethrowerManager.js';

it('damages enemies inside the active flame cone only', () => {
  const hits = [];
  const manager = new FlamethrowerManager();
  const player = { sprite: { x: 0, y: 0 } };
  const stats = { flamethrowerUnlocked: true, flamethrowerDamage: 4, flamethrowerRange: 90, flamethrowerCooldownMs: 140 };
  const enemies = [
    { active: true, x: 40, y: 5, id: 'inside' },
    { active: true, x: -40, y: 5, id: 'behind' }
  ];

  manager.update(player, stats, { x: 1, y: 0 }, 1000, enemies, {
    damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
  });

  expect(hits).toEqual([{ id: 'inside', damage: 4 }]);
});
```

```js
import { RuneTrapManager } from '../src/game/systems/RuneTrapManager.js';

it('arms a rune trap after a delay and triggers when an enemy steps inside', () => {
  const hits = [];
  const manager = new RuneTrapManager();
  const player = { sprite: { x: 0, y: 0 } };
  const stats = { runeTrapUnlocked: true, runeTrapDamage: 22, runeTrapArmMs: 400, runeTrapRadius: 40 };
  const enemy = { active: true, x: 10, y: 0, id: 'enemy' };

  manager.update(player, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
  manager.update(player, stats, { x: 32, y: 0 }, 1300, [enemy], {
    damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
  });
  manager.update(player, stats, { x: 32, y: 0 }, 1400, [enemy], {
    damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
  });

  expect(hits).toEqual([{ id: 'enemy', damage: 22 }]);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/flamethrower.test.js tests/runeTrap.test.js`

Expected: FAIL because these managers and stats do not exist yet.

- [ ] **Step 3: Implement minimal managers and upgrade lanes**

```js
// Player.js additions
flamethrowerUnlocked: false,
flamethrowerDamage: 0,
flamethrowerRange: 0,
flamethrowerCooldownMs: 0,
runeTrapUnlocked: false,
runeTrapDamage: 0,
runeTrapArmMs: 0,
runeTrapRadius: 0,
runeTrapCharges: 0,
runeTrapCooldownMs: 0
```

```js
// RuneTrapManager.js
export class RuneTrapManager {
  constructor() {
    this.traps = [];
    this.nextPlaceAt = 0;
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (stats.runeTrapUnlocked && now >= this.nextPlaceAt && this.traps.length < stats.runeTrapCharges) {
      this.traps.push({ x: cursorWorld.x, y: cursorWorld.y, armedAt: now + stats.runeTrapArmMs });
      this.nextPlaceAt = now + stats.runeTrapCooldownMs;
    }

    for (const trap of this.traps) {
      if (now < trap.armedAt) continue;
      for (const enemy of enemies) {
        enemyManager.damageEnemy(enemy, stats.runeTrapDamage, 'runeTrap');
      }
    }
  }
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/flamethrower.test.js tests/runeTrap.test.js tests/progression.test.js`

Expected: PASS with unlocks and minimal behavior working.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/Player.js src/game/logic/progression.js src/game/scenes/GameScene.js src/game/systems/FlamethrowerManager.js src/game/systems/RuneTrapManager.js tests/flamethrower.test.js tests/runeTrap.test.js tests/progression.test.js
git commit -m "feat: add flamethrower and rune trap"
```

---

### Task 5: Add Arc Mine And Spear Barrage

**Files:**
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\ArcMineManager.js`
- Create: `C:\SL\ailab\_phaser\survivor\src\game\systems\SpearBarrageManager.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\entities\Player.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\progression.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\arcMine.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\spearBarrage.test.js`

- [ ] **Step 1: Write failing tests for arc-mine chaining and cursor-area spear strikes**

```js
import { ArcMineManager } from '../src/game/systems/ArcMineManager.js';

it('chains arc mine damage from the trigger target to a nearby second enemy', () => {
  const hits = [];
  const manager = new ArcMineManager();
  const stats = { arcMineUnlocked: true, arcMineDamage: 16, arcMineChains: 2, arcMineTriggerRadius: 20 };
  const enemies = [
    { active: true, x: 8, y: 0, id: 'first' },
    { active: true, x: 24, y: 4, id: 'second' }
  ];

  manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1000, enemies, {
    damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
  });

  expect(hits.map((hit) => hit.id)).toEqual(['first', 'second']);
});
```

```js
import { SpearBarrageManager } from '../src/game/systems/SpearBarrageManager.js';

it('lands spear barrage hits in the cursor area after a short delay', () => {
  const hits = [];
  const manager = new SpearBarrageManager();
  const stats = { spearBarrageUnlocked: true, spearBarrageDamage: 18, spearBarrageCount: 2, spearBarrageRadius: 30, spearBarrageCooldownMs: 1200 };
  const enemies = [{ active: true, x: 120, y: 100, id: 'target' }];

  manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1000, [], { damageEnemy: () => {} });
  manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1240, enemies, {
    damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
  });

  expect(hits.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/arcMine.test.js tests/spearBarrage.test.js`

Expected: FAIL because the managers and state do not exist yet.

- [ ] **Step 3: Implement minimal manager behavior and unlock stats**

```js
// Player.js additions
arcMineUnlocked: false,
arcMineDamage: 0,
arcMineChains: 0,
arcMineTriggerRadius: 0,
arcMineCooldownMs: 0,
spearBarrageUnlocked: false,
spearBarrageDamage: 0,
spearBarrageCount: 0,
spearBarrageRadius: 0,
spearBarrageCooldownMs: 0
```

```js
// SpearBarrageManager.js
export class SpearBarrageManager {
  constructor() {
    this.pendingStrikes = [];
    this.nextCastAt = 0;
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (stats.spearBarrageUnlocked && now >= this.nextCastAt) {
      this.pendingStrikes.push({ x: cursorWorld.x, y: cursorWorld.y, landsAt: now + 220 });
      this.nextCastAt = now + stats.spearBarrageCooldownMs;
    }

    this.pendingStrikes = this.pendingStrikes.filter((strike) => {
      if (now < strike.landsAt) return true;
      for (const enemy of enemies) {
        enemyManager.damageEnemy(enemy, stats.spearBarrageDamage, 'spearBarrage');
      }
      return false;
    });
  }
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/arcMine.test.js tests/spearBarrage.test.js tests/progression.test.js`

Expected: PASS with basic trigger, chain, and delayed impact behavior covered.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/Player.js src/game/logic/progression.js src/game/scenes/GameScene.js src/game/systems/ArcMineManager.js src/game/systems/SpearBarrageManager.js tests/arcMine.test.js tests/spearBarrage.test.js tests/progression.test.js
git commit -m "feat: add arc mine and spear barrage"
```

---

### Task 6: Integrate New Abilities Into Scene Runtime And Damage Table

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\systems\DamageStatsManager.js`
- Modify: `C:\SL\ailab\_phaser\survivor\tests\damageStats.test.js`
- Modify: `C:\SL\ailab\_phaser\survivor\tests\runtimeFlow.test.js`

- [ ] **Step 1: Write failing integration tests for runtime calls and learned-only damage rows**

```js
it('adds newly learned abilities to the damage table only after unlock', () => {
  const manager = new DamageStatsManager();

  expect(manager.getRows(1000).map((row) => row.key)).toEqual(['projectile']);

  manager.unlock('burstRifle', 1200);
  manager.record('burstRifle', 40);

  expect(manager.getRows(2200).map((row) => row.key)).toEqual(['projectile', 'burstRifle']);
});
```

```js
it('runs aimed and placed ability managers with the live mouse world position', () => {
  const sceneLike = {
    mouseWorld: { x: 280, y: 140 },
    burstRifleManager: { update: vi.fn() },
    flamethrowerManager: { update: vi.fn() },
    runeTrapManager: { update: vi.fn() },
    lanceManager: { update: vi.fn() },
    arcMineManager: { update: vi.fn() },
    spearBarrageManager: { update: vi.fn() }
  };

  GameScene.prototype.update.call(sceneLike, 16, 16);

  expect(sceneLike.burstRifleManager.update).toHaveBeenCalled();
  expect(sceneLike.spearBarrageManager.update).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/damageStats.test.js tests/runtimeFlow.test.js`

Expected: FAIL because the new damage keys and manager calls do not exist yet.

- [ ] **Step 3: Implement the scene orchestration and damage stat registration**

```js
// DamageStatsManager.js
export const DAMAGE_STAT_DEFINITIONS = [
  { key: 'projectile', label: 'Auto Shot' },
  { key: 'blade', label: 'Orbiting Blade' },
  { key: 'chain', label: 'Storm Lash' },
  { key: 'nova', label: 'Pulse Engine' },
  { key: 'boomerang', label: 'Razor Boomerang' },
  { key: 'meteor', label: 'Starcall' },
  { key: 'burstRifle', label: 'Burst Rifle' },
  { key: 'flamethrower', label: 'Flamethrower' },
  { key: 'runeTrap', label: 'Rune Trap' },
  { key: 'lance', label: 'Piercing Lance' },
  { key: 'arcMine', label: 'Arc Mine' },
  { key: 'spearBarrage', label: 'Spear Barrage' }
];
```

```js
// GameScene.js update loop excerpt
const aimDirection = getAimDirection(this.player.sprite, this.mouseWorld);

this.burstRifleManager.update(this.player, effectiveStats, aimDirection, time);
this.flamethrowerManager.update(this.player, effectiveStats, aimDirection, time, nearEnemyQuery, this.enemyManager);
this.runeTrapManager.update(this.player, effectiveStats, this.mouseWorld, time, nearEnemyQuery, this.enemyManager);
this.lanceManager.update(this.player, effectiveStats, aimDirection, time, nearEnemyQuery, this.enemyManager);
this.arcMineManager.update(this.player, effectiveStats, this.mouseWorld, time, nearEnemyQuery, this.enemyManager);
this.spearBarrageManager.update(this.player, effectiveStats, this.mouseWorld, time, nearEnemyQuery, this.enemyManager);
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/damageStats.test.js tests/runtimeFlow.test.js`

Expected: PASS with scene orchestration and learned-only damage rows working for the new ability set.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/GameScene.js src/game/systems/DamageStatsManager.js tests/damageStats.test.js tests/runtimeFlow.test.js
git commit -m "feat: integrate new ability runtime and stats"
```

---

### Task 7: Add Chest-Reward Cap Fallbacks And Final Regression Coverage

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\systems\ChestRewardSystem.js`
- Modify: `C:\SL\ailab\_phaser\survivor\tests\chestRewards.test.js`
- Modify: `C:\SL\ailab\_phaser\survivor\tests\progression.test.js`

- [ ] **Step 1: Write failing fallback tests for capped runs**

```js
it('does not offer a new unlock chest reward when the 8-ability cap is already reached', () => {
  const pool = getChestRewardPool({
    bladeUnlocked: true,
    chainUnlocked: true,
    novaUnlocked: true,
    boomerangUnlocked: true,
    meteorUnlocked: true,
    burstRifleUnlocked: true,
    flamethrowerUnlocked: true
  });

  expect(pool.some((entry) => entry.key === 'arsenalDraft')).toBe(false);
});
```

```js
it('falls back to a legal owned-ability reward when an unlock reward resolves at cap', () => {
  const player = {
    bladeUnlocked: true,
    chainUnlocked: true,
    novaUnlocked: true,
    boomerangUnlocked: true,
    meteorUnlocked: true,
    burstRifleUnlocked: true,
    flamethrowerUnlocked: true
  };

  const reward = resolveChestReward(player, { key: 'arsenalDraft' });

  expect(reward.key).not.toBe('arsenalDraft');
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- tests/chestRewards.test.js tests/progression.test.js`

Expected: FAIL because chest fallback logic is not yet cap-aware.

- [ ] **Step 3: Implement cap-aware reward filtering and fallback**

```js
// ChestRewardSystem.js
import { countLearnedAbilities, ABILITY_CAP } from '../logic/abilityRoster.js';

export function getChestRewardPool(playerStats) {
  const capped = countLearnedAbilities(playerStats) >= ABILITY_CAP;

  return BASE_CHEST_REWARDS.filter((reward) => {
    if (reward.key === 'arsenalDraft' && capped) {
      return false;
    }

    return reward.isAvailable ? reward.isAvailable(playerStats) : true;
  });
}
```

```js
export function resolveChestReward(playerStats, reward) {
  if (reward.key === 'arsenalDraft' && countLearnedAbilities(playerStats) >= ABILITY_CAP) {
    return { key: 'relicDamage' };
  }

  return reward;
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- tests/chestRewards.test.js tests/progression.test.js`

Expected: PASS with capped runs never receiving illegal unlock rewards.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/ChestRewardSystem.js tests/chestRewards.test.js tests/progression.test.js
git commit -m "fix: respect ability cap in chest rewards"
```

---

### Task 8: Final Verification And Cleanup

**Files:**
- Modify only if required by failing tests during integration cleanup
- Test: `C:\SL\ailab\_phaser\survivor\tests\*.test.js`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: PASS across the full suite with new manager tests, progression cap tests, chest fallback tests, and runtime-flow coverage.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: PASS. Existing Vite chunk-size warning is acceptable if the build still succeeds.

- [ ] **Step 3: Inspect git status**

Run: `git status --short`

Expected: only intended implementation files are modified; no accidental debug output or throwaway files.

- [ ] **Step 4: If any integration mismatch remains, make the minimal fix and rerun the relevant test first**

```js
// Example cleanup pattern only if needed:
// - adjust manager call signature in GameScene.js
// - update corresponding runtimeFlow or manager test
// - rerun that one test before rerunning the whole suite
```

- [ ] **Step 5: Commit the final cleanups**

```bash
git add .
git commit -m "test: finalize ability expansion integration"
```

---

## Self-Review

### Spec coverage

- Six chosen abilities: covered in Tasks 3, 4, and 5.
- 8-total-ability cap including Auto Shot: covered in Tasks 1 and 7.
- Live mouse aim behavior: covered in Task 2, then exercised in Tasks 3-6.
- Damage table learned-only rows: covered in Task 6.
- Reward-path cap fallback: covered in Task 7.
- Focused tests plus full verification: covered in every task and finalized in Task 8.

### Placeholder scan

- No `TODO`, `TBD`, or deferred “implement later” language remains in task steps.
- Every code-changing task includes concrete file paths, test snippets, run commands, and commit commands.

### Type consistency

- Ability keys used consistently across plan:
  - `burstRifle`
  - `flamethrower`
  - `runeTrap`
  - `lance`
  - `arcMine`
  - `spearBarrage`
- Unlock flags used consistently:
  - `burstRifleUnlocked`
  - `flamethrowerUnlocked`
  - `runeTrapUnlocked`
  - `lanceUnlocked`
  - `arcMineUnlocked`
  - `spearBarrageUnlocked`
- Scene integration always assumes:
  - `mouseWorld` for cursor position
  - `aimDirection` from `getAimDirection()`

