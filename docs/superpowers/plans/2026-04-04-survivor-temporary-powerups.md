# Survivor Temporary Powerups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rare temporary powerup pickups that drop from enemies, stack independently for 30 seconds, modify all weapon paths through derived combat stats, and show active buff state in the HUD.

**Architecture:** Keep permanent build state in `Player.stats`, introduce a dedicated temporary buff system for stack timers and effective-stat derivation, and route all weapon managers through that derived combat view. Handle drop rules and pickup spawning in existing enemy/pickup systems, then add a compact buff display in the overlay layer.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Create: `src/game/logic/temporaryPowerups.js`
- Create: `src/game/systems/TemporaryBuffSystem.js`
- Create: `tests/temporaryPowerups.test.js`
- Create: `tests/temporaryBuffSystem.test.js`
- Modify: `src/game/systems/PickupManager.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `tests/enemyManager.test.js`
- Modify: `tests/runtimeFlow.test.js`
- Modify: `tests/combat.test.js`
- Modify: `tests/overlayFactory.test.js`

### Task 1: Add Pure Temporary Powerup Logic Helpers

**Files:**
- Create: `src/game/logic/temporaryPowerups.js`
- Create: `tests/temporaryPowerups.test.js`

- [ ] **Step 1: Write the failing temporary powerup logic tests**

```js
import { describe, expect, it } from 'vitest';
import {
  POWERUP_DROP_CHANCE_BY_SOURCE,
  POWERUP_DURATION_MS,
  POWERUP_KEYS,
  buildPowerupSummaryRows,
  createPowerupStack,
  getEffectiveStats,
  pruneExpiredStacks,
  rollPowerupDrop
} from '../src/game/logic/temporaryPowerups.js';

describe('rollPowerupDrop', () => {
  it('uses the normal enemy drop chance and chooses a buff key', () => {
    const result = rollPowerupDrop({
      isElite: false,
      keyRoll: 0.4,
      roll: 0.01
    });

    expect(result).toBe(POWERUP_KEYS[1]);
    expect(POWERUP_DROP_CHANCE_BY_SOURCE.normal).toBe(0.015);
  });

  it('uses the elite drop chance and returns null when the roll misses', () => {
    const result = rollPowerupDrop({
      isElite: true,
      keyRoll: 0.2,
      roll: 0.5
    });

    expect(result).toBeNull();
    expect(POWERUP_DROP_CHANCE_BY_SOURCE.elite).toBe(0.06);
  });
});

describe('powerup stack lifecycle', () => {
  it('creates a stack with its own expiresAt and prunes expired stacks independently', () => {
    const stacks = [
      createPowerupStack('frenzy', 1000),
      createPowerupStack('frenzy', 4000),
      createPowerupStack('overcharge', 2000)
    ];

    expect(pruneExpiredStacks(stacks, 30999)).toHaveLength(3);
    expect(pruneExpiredStacks(stacks, 31000)).toEqual([
      expect.objectContaining({ buffKey: 'frenzy', expiresAt: 34000 }),
      expect.objectContaining({ buffKey: 'overcharge', expiresAt: 32000 })
    ]);
  });
});

describe('getEffectiveStats', () => {
  it('applies frenzy, overcharge, and volley stacks to derived weapon values only', () => {
    const baseStats = {
      fireCooldownMs: 500,
      chainCooldownMs: 1000,
      projectileDamage: 20,
      bladeDamage: 12,
      projectileCount: 1,
      bladeCount: 2,
      chainLinks: 3,
      novaEchoCount: 1,
      boomerangCount: 1,
      meteorCount: 1
    };
    const activeStacks = [
      createPowerupStack('frenzy', 0),
      createPowerupStack('overcharge', 0),
      createPowerupStack('volley', 0),
      createPowerupStack('volley', 0)
    ];

    const effective = getEffectiveStats(baseStats, activeStacks, 1000);

    expect(effective).not.toBe(baseStats);
    expect(effective.fireCooldownMs).toBe(350);
    expect(effective.chainCooldownMs).toBe(700);
    expect(effective.projectileDamage).toBe(28);
    expect(effective.bladeDamage).toBeCloseTo(16.8);
    expect(effective.projectileCount).toBe(3);
    expect(effective.bladeCount).toBe(4);
    expect(effective.chainLinks).toBe(5);
  });

  it('does not mutate the base stats object', () => {
    const baseStats = {
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    };

    getEffectiveStats(baseStats, [createPowerupStack('volley', 0)], 1000);

    expect(baseStats).toEqual({
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    });
  });
});

describe('buildPowerupSummaryRows', () => {
  it('returns one row per active buff type with stack count and next expiry countdown', () => {
    const rows = buildPowerupSummaryRows(
      [
        createPowerupStack('frenzy', 0),
        createPowerupStack('frenzy', 5000),
        createPowerupStack('volley', 10000)
      ],
      12000
    );

    expect(rows).toEqual([
      { buffKey: 'frenzy', label: 'Frenzy', stacks: 2, secondsLeft: 18 },
      { buffKey: 'volley', label: 'Volley', stacks: 1, secondsLeft: 28 }
    ]);
  });
});
```

- [ ] **Step 2: Run the logic tests to verify they fail**

Run: `npm test -- tests/temporaryPowerups.test.js`  
Expected: FAIL because `src/game/logic/temporaryPowerups.js` does not exist yet

- [ ] **Step 3: Add the pure temporary powerup helpers**

```js
export const POWERUP_DURATION_MS = 30000;
export const POWERUP_DROP_CHANCE_BY_SOURCE = {
  normal: 0.015,
  elite: 0.06
};
export const POWERUP_KEYS = ['frenzy', 'overcharge', 'volley'];
const POWERUP_LABELS = {
  frenzy: 'Frenzy',
  overcharge: 'Overcharge',
  volley: 'Volley'
};
const FRENZY_SCALAR_PER_STACK = 0.7;
const OVERCHARGE_BONUS_PER_STACK = 0.4;
const MIN_COOLDOWN_MS = 60;
const COOLDOWN_KEYS = [
  'fireCooldownMs',
  'chainCooldownMs',
  'novaCooldownMs',
  'boomerangCooldownMs',
  'meteorCooldownMs'
];
const DAMAGE_KEYS = [
  'projectileDamage',
  'bladeDamage',
  'chainDamage',
  'novaDamage',
  'boomerangDamage',
  'meteorDamage'
];
const VOLLEY_KEYS = [
  'projectileCount',
  'bladeCount',
  'chainLinks',
  'novaEchoCount',
  'boomerangCount',
  'meteorCount'
];

export function rollPowerupDrop({ isElite = false, roll = Math.random(), keyRoll = Math.random() } = {}) {
  const chance = isElite ? POWERUP_DROP_CHANCE_BY_SOURCE.elite : POWERUP_DROP_CHANCE_BY_SOURCE.normal;

  if (roll >= chance) {
    return null;
  }

  const index = Math.min(POWERUP_KEYS.length - 1, Math.floor(keyRoll * POWERUP_KEYS.length));
  return POWERUP_KEYS[index];
}

export function createPowerupStack(buffKey, now) {
  return {
    buffKey,
    expiresAt: now + POWERUP_DURATION_MS
  };
}

export function pruneExpiredStacks(stacks, now) {
  return (stacks ?? []).filter((stack) => stack.expiresAt > now);
}

function countStacks(stacks, now) {
  const counts = {
    frenzy: 0,
    overcharge: 0,
    volley: 0
  };

  for (const stack of pruneExpiredStacks(stacks, now)) {
    counts[stack.buffKey] += 1;
  }

  return counts;
}

export function getEffectiveStats(baseStats, stacks, now) {
  const counts = countStacks(stacks, now);
  const effective = { ...baseStats };
  const frenzyScalar = FRENZY_SCALAR_PER_STACK ** counts.frenzy;
  const damageScalar = 1 + counts.overcharge * OVERCHARGE_BONUS_PER_STACK;

  COOLDOWN_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] = Math.max(MIN_COOLDOWN_MS, Math.round(effective[key] * frenzyScalar));
    }
  });

  DAMAGE_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] = effective[key] * damageScalar;
    }
  });

  VOLLEY_KEYS.forEach((key) => {
    if (typeof effective[key] === 'number' && effective[key] > 0) {
      effective[key] += counts.volley;
    }
  });

  return effective;
}

export function buildPowerupSummaryRows(stacks, now) {
  const activeStacks = pruneExpiredStacks(stacks, now);

  return POWERUP_KEYS.map((buffKey) => {
    const matchingStacks = activeStacks.filter((stack) => stack.buffKey === buffKey);

    if (matchingStacks.length === 0) {
      return null;
    }

    const nextExpiresAt = Math.min(...matchingStacks.map((stack) => stack.expiresAt));
    return {
      buffKey,
      label: POWERUP_LABELS[buffKey],
      stacks: matchingStacks.length,
      secondsLeft: Math.max(0, Math.ceil((nextExpiresAt - now) / 1000))
    };
  }).filter(Boolean);
}
```

- [ ] **Step 4: Run the logic tests to verify they pass**

Run: `npm test -- tests/temporaryPowerups.test.js`  
Expected: PASS

- [ ] **Step 5: Commit the temporary powerup logic**

```bash
git add src/game/logic/temporaryPowerups.js tests/temporaryPowerups.test.js
git commit -m "feat: add temporary powerup logic"
```

### Task 2: Add a Temporary Buff System and Derived Combat Stats

**Files:**
- Create: `src/game/systems/TemporaryBuffSystem.js`
- Create: `tests/temporaryBuffSystem.test.js`

- [ ] **Step 1: Write the failing system tests**

```js
import { describe, expect, it } from 'vitest';
import { TemporaryBuffSystem } from '../src/game/systems/TemporaryBuffSystem.js';

describe('TemporaryBuffSystem', () => {
  it('adds stacks, expires them by time, and reports summary rows', () => {
    const system = new TemporaryBuffSystem();

    system.addStack('frenzy', 1000);
    system.addStack('frenzy', 4000);
    system.addStack('volley', 5000);

    expect(system.getSummaryRows(12000)).toEqual([
      { buffKey: 'frenzy', label: 'Frenzy', stacks: 2, secondsLeft: 19 },
      { buffKey: 'volley', label: 'Volley', stacks: 1, secondsLeft: 23 }
    ]);

    system.update(31000);

    expect(system.getSummaryRows(31000)).toEqual([
      { buffKey: 'frenzy', label: 'Frenzy', stacks: 1, secondsLeft: 3 },
      { buffKey: 'volley', label: 'Volley', stacks: 1, secondsLeft: 4 }
    ]);
  });

  it('returns derived effective stats without mutating the permanent stats source', () => {
    const system = new TemporaryBuffSystem();
    const baseStats = {
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    };

    system.addStack('frenzy', 0);
    system.addStack('overcharge', 0);
    system.addStack('volley', 0);

    expect(system.getEffectiveStats(baseStats, 1000)).toEqual({
      fireCooldownMs: 350,
      projectileDamage: 28,
      projectileCount: 2
    });
    expect(baseStats).toEqual({
      fireCooldownMs: 500,
      projectileDamage: 20,
      projectileCount: 1
    });
  });
});
```

- [ ] **Step 2: Run the system tests to verify they fail**

Run: `npm test -- tests/temporaryBuffSystem.test.js`  
Expected: FAIL because `src/game/systems/TemporaryBuffSystem.js` does not exist yet

- [ ] **Step 3: Add the temporary buff system wrapper**

```js
import {
  buildPowerupSummaryRows,
  createPowerupStack,
  getEffectiveStats,
  pruneExpiredStacks
} from '../logic/temporaryPowerups.js';

export class TemporaryBuffSystem {
  constructor() {
    this.stacks = [];
  }

  addStack(buffKey, now) {
    this.stacks.push(createPowerupStack(buffKey, now));
    return this.stacks[this.stacks.length - 1];
  }

  update(now) {
    this.stacks = pruneExpiredStacks(this.stacks, now);
    return this.stacks;
  }

  getEffectiveStats(baseStats, now) {
    return getEffectiveStats(baseStats, this.stacks, now);
  }

  getSummaryRows(now) {
    return buildPowerupSummaryRows(this.stacks, now);
  }

  clear() {
    this.stacks = [];
  }
}
```

- [ ] **Step 4: Run the system tests to verify they pass**

Run: `npm test -- tests/temporaryBuffSystem.test.js`  
Expected: PASS

- [ ] **Step 5: Commit the temporary buff system**

```bash
git add src/game/systems/TemporaryBuffSystem.js tests/temporaryBuffSystem.test.js
git commit -m "feat: add temporary buff system"
```

### Task 3: Add Powerup Drops and Pickup Spawning

**Files:**
- Modify: `src/game/systems/PickupManager.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `tests/enemyManager.test.js`

- [ ] **Step 1: Write the failing drop and pickup tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { PickupManager } from '../src/game/systems/PickupManager.js';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

function createEnemySceneHarness() {
  const enemyGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };
  const enemyProjectileGroup = {
    children: {
      iterate: vi.fn()
    },
    getChildren: vi.fn().mockReturnValue([])
  };

  return {
    physics: {
      add: {
        collider: vi.fn(),
        group: vi
          .fn()
          .mockReturnValueOnce(enemyGroup)
          .mockReturnValueOnce(enemyProjectileGroup)
      }
    },
    time: {
      now: 0,
      delayedCall: vi.fn()
    }
  };
}

describe('PickupManager', () => {
  it('spawns a temporary powerup pickup with buff metadata', () => {
    const created = {
      setDepth: vi.fn().mockReturnThis(),
      setDamping: vi.fn().mockReturnThis(),
      setDrag: vi.fn().mockReturnThis(),
      setMaxVelocity: vi.fn().mockReturnThis()
    };
    const manager = new PickupManager(
      {
        physics: {
          add: {
            group: () => ({
              create: vi.fn(() => created),
              getChildren: () => []
            })
          }
        }
      },
      () => false
    );

    const pickup = manager.spawnPowerup(10, 20, 'frenzy');

    expect(pickup.kind).toBe('powerup');
    expect(pickup.buffKey).toBe('frenzy');
  });
});

describe('EnemyManager', () => {
  it('spawns a temporary powerup pickup when a normal enemy wins the drop roll', () => {
    const spawnPowerup = vi.fn();
    const manager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnPowerup },
      null,
      () => 1
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 5,
      type: 'basic',
      x: 40,
      xpValue: 4,
      y: 80
    };

    manager.powerupDropRoll = () => 'overcharge';
    manager.damageEnemy(enemy, 6);

    expect(spawnPowerup).toHaveBeenCalledWith(40, 80, 'overcharge');
  });

  it('passes elite state through to the powerup drop roll', () => {
    const manager = new EnemyManager(
      createEnemySceneHarness(),
      { sprite: { x: 0, y: 0 } },
      { spawnOrb: vi.fn(), spawnPowerup: vi.fn() },
      null,
      () => 1
    );
    const enemy = {
      active: true,
      destroy: vi.fn(),
      health: 5,
      isElite: true,
      type: 'tough',
      x: 10,
      xpValue: 4,
      y: 20
    };
    manager.powerupDropRoll = vi.fn().mockReturnValue(null);

    manager.damageEnemy(enemy, 6);

    expect(manager.powerupDropRoll).toHaveBeenCalledWith({ isElite: true });
  });
});
```

- [ ] **Step 2: Run the pickup/drop tests to verify they fail**

Run: `npm test -- tests/enemyManager.test.js`  
Expected: FAIL because `spawnPowerup(...)` and powerup drop routing do not exist yet

- [ ] **Step 3: Add powerup pickup spawning to `PickupManager`**

```js
spawnPowerup(x, y, buffKey) {
  const textureKey = `powerup-${buffKey}`;
  const pickup = this.spawnPickup(x, y, textureKey, 'powerup', 0);
  pickup.buffKey = buffKey;
  pickup.setDepth(2.2);
  return pickup;
}
```

- [ ] **Step 4: Add powerup drop routing to `EnemyManager`**

```js
import { rollPowerupDrop } from '../logic/temporaryPowerups.js';

constructor(scene, player, pickupManager, effects = null, dropRoll = Math.random, damageStats = null, audioManager = null) {
  this.scene = scene;
  this.player = player;
  this.pickupManager = pickupManager;
  this.effects = effects;
  this.dropRoll = dropRoll;
  this.damageStats = damageStats;
  this.audioManager = audioManager;
  this.group = scene.physics.add.group();
  this.enemyProjectileGroup = scene.physics.add.group();
  this.powerupDropRoll = ({ isElite }) =>
    rollPowerupDrop({
      isElite,
      keyRoll: Math.random(),
      roll: Math.random()
    });
}

damageEnemy(enemy, damage, sourceKey = null) {
  // existing kill path...
  const powerupKey = this.powerupDropRoll?.({ isElite: Boolean(enemy.isElite) });

  if (powerupKey) {
    this.pickupManager.spawnPowerup?.(enemy.x, enemy.y, powerupKey);
  }

  enemy.destroy();
  return true;
}
```

- [ ] **Step 5: Run the pickup/drop tests to verify they pass**

Run: `npm test -- tests/enemyManager.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the powerup drop and pickup support**

```bash
git add src/game/systems/PickupManager.js src/game/systems/EnemyManager.js tests/enemyManager.test.js
git commit -m "feat: add temporary powerup drops"
```

### Task 4: Wire Temporary Buffs into GameScene and Combat Stats

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/ProjectileManager.js`
- Modify: `tests/runtimeFlow.test.js`
- Modify: `tests/combat.test.js`

- [ ] **Step 1: Write the failing runtime and projectile tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('GameScene handlePickupCollected', () => {
  it('collects powerups through the temporary buff system', () => {
    const sceneLike = {
      audioManager: {
        playPickup: vi.fn()
      },
      isGameOver: false,
      temporaryBuffSystem: {
        addStack: vi.fn()
      },
      refreshHud: vi.fn(),
      time: {
        now: 1234
      }
    };

    const result = GameScene.prototype.handlePickupCollected.call(sceneLike, {
      kind: 'powerup',
      buffKey: 'frenzy'
    });

    expect(result).toBe(false);
    expect(sceneLike.temporaryBuffSystem.addStack).toHaveBeenCalledWith('frenzy', 1234);
    expect(sceneLike.audioManager.playPickup).toHaveBeenCalledOnce();
  });
});

describe('GameScene update', () => {
  it('passes derived effective stats to all weapon systems', () => {
    const returnedEnemies = [{ active: true, id: 'returned' }];
    const nearQuery = {
      cellSize: 96,
      cells: new Map(),
      enemies: [{ active: true, id: 'near-1' }],
      enemiesByTier: { near: [{ active: true, id: 'near-1' }], mid: [], far: [] }
    };
    const effectiveStats = {
      bladeCount: 3,
      fireCooldownMs: 400,
      pickupRadius: 48,
      projectileCount: 2
    };
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      elapsedMs: 0,
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue(nearQuery),
        update: vi.fn().mockReturnValue(returnedEnemies)
      },
      handleStatsToggle: vi.fn(),
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: {
          bladeCount: 0,
          pickupRadius: 48,
          projectileCount: 1
        },
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      scale: {
        width: 1280,
        height: 720
      },
      statsKey: {},
      updateEliteWave: vi.fn(),
      temporaryBuffSystem: {
        getEffectiveStats: vi.fn().mockReturnValue(effectiveStats),
        getSummaryRows: vi.fn().mockReturnValue([]),
        update: vi.fn()
      },
      audioManager: {},
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      input: {
        keyboard: {
          addCapture: vi.fn()
        }
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);

    expect(sceneLike.projectileManager.tryFire).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      expect.any(Array),
      16
    );
    expect(sceneLike.bladeManager.syncToPlayer).toHaveBeenCalledWith(effectiveStats);
    expect(sceneLike.novaManager.update).toHaveBeenCalledWith(
      sceneLike.player,
      effectiveStats,
      16,
      expect.anything(),
      sceneLike.enemyManager
    );
  });
});
```

- [ ] **Step 2: Run the runtime and projectile tests to verify they fail**

Run: `npm test -- tests/runtimeFlow.test.js tests/combat.test.js`  
Expected: FAIL because powerup pickup routing and explicit effective-stats weapon calls do not exist yet

- [ ] **Step 3: Update `ProjectileManager` to accept explicit combat stats**

```js
tryFire(player, stats, enemies, now) {
  if (now < this.nextShotAt) {
    return [];
  }

  const target = getNearestEnemy(player.sprite, enemies);

  if (!target) {
    return [];
  }

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
```

- [ ] **Step 4: Wire the temporary buff system into `GameScene`**

```js
import { TemporaryBuffSystem } from '../systems/TemporaryBuffSystem.js';

create() {
  this.player = new Player(this, 0, 0);
  this.pickupManager = new PickupManager(this, (pickup) => this.handlePickupCollected(pickup));
  this.damageStatsManager = new DamageStatsManager();
  this.bloodEffectsManager = new BloodEffectsManager(this);
  this.audioManager = new AudioManager();
  this.enemyManager = new EnemyManager(
    this,
    this.player,
    this.pickupManager,
    this.bloodEffectsManager,
    Math.random,
    this.damageStatsManager,
    this.audioManager
  );
  this.projectileManager = new ProjectileManager(this);
  this.bladeManager = new BladeManager(this);
  this.chainManager = new ChainManager(this);
  this.novaManager = new NovaManager(this);
  this.boomerangManager = new BoomerangManager(this);
  this.meteorManager = new MeteorManager(this);
  this.temporaryBuffSystem = new TemporaryBuffSystem();
}

update(time, delta) {
  if (this.isGameOver && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
    this.scene.restart();
    return;
  }

  if (this.isGameplayPaused) {
    this.handlePauseHotkeys();
    this.refreshHud();
    return;
  }

  this.temporaryBuffSystem.update(time);
  const effectiveStats = this.temporaryBuffSystem.getEffectiveStats(this.player.stats, time);
  const livingEnemies = this.enemyManager.update(delta, this.elapsedMs / 1000, time) ?? [];
  const nearEnemyQuery =
    this.enemyManager.getNearEnemyQuery?.() ?? this.enemyManager.getEnemyQuery?.() ?? livingEnemies;

  this.projectileManager.update(time);
  this.projectileManager.tryFire(this.player, effectiveStats, livingEnemies, time);
  this.bladeManager.syncToPlayer(effectiveStats);
  this.bladeManager.update(this.player, effectiveStats, delta, time, nearEnemyQuery, this.enemyManager);
  this.chainManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
  this.novaManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
  this.boomerangManager.update(this.player, effectiveStats, delta, time, nearEnemyQuery, this.enemyManager);
  this.meteorManager.update(this.player, effectiveStats, time, nearEnemyQuery, this.enemyManager);
  this.pickupManager.update(this.player.sprite, effectiveStats.pickupRadius);
  this.refreshHud(livingEnemies.length);
}

handlePickupCollected(pickup) {
  if (pickup.kind === 'powerup') {
    this.audioManager?.playPickup?.();
    this.temporaryBuffSystem.addStack(pickup.buffKey, this.time.now);
    this.refreshHud();
    return false;
  }

  if (pickup.kind === 'chest') {
    this.audioManager?.playChestOpen?.();
    this.openChestReward(pickup);
    return true;
  }

  if (pickup.kind === 'heart') {
    this.audioManager?.playPickup?.();
    this.player.heal(pickup.value);
    this.refreshHud();
    return false;
  }

  const result = this.player.gainXp(pickup.value);

  if (result.leveledUp) {
    this.audioManager?.playLevelUp?.();
    this.openLevelUp();
  }

  return result.leveledUp;
}
```

- [ ] **Step 5: Run the runtime and projectile tests to verify they pass**

Run: `npm test -- tests/runtimeFlow.test.js tests/combat.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the temporary combat stat wiring**

```bash
git add src/game/scenes/GameScene.js src/game/systems/ProjectileManager.js tests/runtimeFlow.test.js tests/combat.test.js
git commit -m "feat: wire temporary powerups into combat stats"
```

### Task 5: Add Powerup HUD and Visual Assets

**Files:**
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `tests/overlayFactory.test.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing HUD and texture tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { createPowerupHud } from '../src/game/ui/overlayFactory.js';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('createPowerupHud', () => {
  it('renders one line per active buff and hides empty rows', () => {
    const textNodes = [];
    const scene = {
      add: {
        rectangle: () => ({ setOrigin: vi.fn().mockReturnThis(), setStrokeStyle: vi.fn().mockReturnThis() }),
        text: (...args) => {
          const node = {
            args,
            setText: vi.fn(function setText(value) {
              this.value = value;
              return this;
            }),
            value: ''
          };
          textNodes.push(node);
          return node;
        },
        container: () => ({
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis()
        })
      }
    };

    const hud = createPowerupHud(scene);
    hud.update([
      { buffKey: 'frenzy', label: 'Frenzy', stacks: 2, secondsLeft: 18 },
      { buffKey: 'volley', label: 'Volley', stacks: 1, secondsLeft: 9 }
    ]);

    expect(textNodes.some((node) => node.value === 'Frenzy x2 18s')).toBe(true);
    expect(textNodes.some((node) => node.value === 'Volley x1 9s')).toBe(true);
  });
});

describe('GameScene createTextures', () => {
  it('generates the temporary powerup textures', () => {
    const generateTexture = vi.fn();
    const graphics = {
      clear: vi.fn(),
      fillCircle: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: vi.fn(),
      lineStyle: vi.fn(),
      strokeCircle: vi.fn(),
      strokeRect: vi.fn(),
      generateTexture
    };
    const sceneLike = {
      add: {
        graphics: () => graphics
      },
      textures: {
        exists: () => false
      }
    };

    GameScene.prototype.createTextures.call(sceneLike);

    expect(generateTexture).toHaveBeenCalledWith('powerup-frenzy', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-overcharge', 22, 22);
    expect(generateTexture).toHaveBeenCalledWith('powerup-volley', 22, 22);
  });
});
```

- [ ] **Step 2: Run the HUD and texture tests to verify they fail**

Run: `npm test -- tests/overlayFactory.test.js tests/runtimeFlow.test.js`  
Expected: FAIL because the powerup HUD and texture generation do not exist yet

- [ ] **Step 3: Add a compact powerup HUD in `overlayFactory.js`**

```js
export function createPowerupHud(scene) {
  const panel = scene.add.rectangle(0, 0, 220, 104, 0x08121c, 0.78).setOrigin(0);
  panel.setStrokeStyle(2, 0x8ad2ff, 0.28);
  const title = scene.add.text(12, 10, 'Active Buffs', {
    fontFamily: 'Trebuchet MS',
    fontSize: '16px',
    color: '#f4f8ff',
    fontStyle: 'bold'
  });
  const rows = Array.from({ length: 3 }, (_, index) =>
    scene.add.text(12, 34 + index * 22, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#ffdca0'
    })
  );
  const container = scene.add.container(0, 0, [panel, title, ...rows]);

  container.setDepth(41);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    layout(width) {
      container.setPosition(width - 238, 278);
    },
    update(summaryRows) {
      container.setVisible(summaryRows.length > 0);
      rows.forEach((row, index) => {
        const item = summaryRows[index];
        row.setText(item ? `${item.label} x${item.stacks} ${item.secondsLeft}s` : '');
      });
    }
  };
}
```

- [ ] **Step 4: Wire the powerup HUD and textures into `GameScene`**

```js
import { createPowerupHud } from '../ui/overlayFactory.js';

create() {
  this.hud = createHud(this);
  this.fpsCounter = createFpsCounter(this);
  this.damageStatsOverlay = createDamageStatsOverlay(this);
  this.powerupHud = createPowerupHud(this);
}

refreshHud(enemyCount = this.enemyManager.getLivingEnemies().length) {
  this.hud.update({
    health: this.player.stats.health,
    maxHealth: this.player.stats.maxHealth,
    level: this.player.stats.level,
    xp: this.player.stats.xp,
    xpToNext: this.player.stats.xpToNext,
    timeMs: this.elapsedMs,
    enemyCount,
    projectileCount: this.player.stats.projectileCount,
    bladeCount: this.player.stats.bladeCount,
    activeWeapons:
      1 +
      Number(this.player.stats.bladeUnlocked) +
      Number(this.player.stats.chainUnlocked) +
      Number(this.player.stats.novaUnlocked) +
      Number(this.player.stats.boomerangUnlocked) +
      Number(this.player.stats.meteorUnlocked),
    eliteWarning: this.eliteWaveSystem.isWarningActive(this.elapsedMs) ? 'Elite wave incoming' : ''
  });
  this.powerupHud?.update(this.temporaryBuffSystem.getSummaryRows(this.time.now));
}

handleResize(gameSize) {
  if (this.hud) {
    this.hud.layout(gameSize.width, gameSize.height);
  }
  if (this.fpsCounter) {
    this.fpsCounter.layout(gameSize.width, gameSize.height);
  }
  if (this.damageStatsOverlay) {
    this.damageStatsOverlay.layout(gameSize.width, gameSize.height);
  }
  if (this.powerupHud) {
    this.powerupHud.layout(gameSize.width, gameSize.height);
  }
}

createTextures() {
  graphics.clear();
  graphics.fillStyle(0x7ae2ff, 1);
  graphics.fillCircle(11, 11, 9);
  graphics.lineStyle(2, 0xe7fbff, 1);
  graphics.strokeCircle(11, 11, 9);
  graphics.generateTexture('powerup-frenzy', 22, 22);

  graphics.clear();
  graphics.fillStyle(0xff9a63, 1);
  graphics.fillRect(4, 4, 14, 14);
  graphics.lineStyle(2, 0xffe5c7, 1);
  graphics.strokeRect(4, 4, 14, 14);
  graphics.generateTexture('powerup-overcharge', 22, 22);

  graphics.clear();
  graphics.fillStyle(0xb89cff, 1);
  graphics.fillCircle(7, 11, 4);
  graphics.fillCircle(15, 11, 4);
  graphics.lineStyle(2, 0xf2ebff, 1);
  graphics.strokeCircle(7, 11, 4);
  graphics.strokeCircle(15, 11, 4);
  graphics.generateTexture('powerup-volley', 22, 22);
}
```

- [ ] **Step 5: Run the HUD and texture tests to verify they pass**

Run: `npm test -- tests/overlayFactory.test.js tests/runtimeFlow.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the HUD and visual powerup layer**

```bash
git add src/game/ui/overlayFactory.js src/game/scenes/GameScene.js tests/overlayFactory.test.js tests/runtimeFlow.test.js
git commit -m "feat: add temporary powerup hud"
```

### Task 6: Final Verification and Pickup Feel Polish

**Files:**
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Add the final integration regression**

```js
import { describe, expect, it, vi } from 'vitest';
import { GameScene } from '../src/game/scenes/GameScene.js';

describe('GameScene update', () => {
  it('keeps temporary buffs out of permanent stats after expiration', () => {
    const baseStats = {
      bladeCount: 0,
      fireCooldownMs: 520,
      pickupRadius: 48,
      projectileCount: 1
    };
    const sceneLike = {
      activePauseOverlay: null,
      background: {
        tilePositionX: 0,
        tilePositionY: 0
      },
      bladeManager: {
        syncToPlayer: vi.fn(),
        update: vi.fn()
      },
      boomerangManager: {
        update: vi.fn()
      },
      cameras: {
        main: {
          scrollX: 0,
          scrollY: 0
        }
      },
      chainManager: {
        update: vi.fn()
      },
      elapsedMs: 0,
      enemyManager: {
        getNearEnemyQuery: vi.fn().mockReturnValue({ enemies: [], cells: new Map(), cellSize: 96, enemiesByTier: { near: [], mid: [], far: [] } }),
        update: vi.fn().mockReturnValue([])
      },
      handleStatsToggle: vi.fn(),
      isGameOver: false,
      isGameplayPaused: false,
      keys: {},
      meteorManager: {
        update: vi.fn()
      },
      novaManager: {
        update: vi.fn()
      },
      pickupManager: {
        update: vi.fn()
      },
      player: {
        sprite: { x: 0, y: 0 },
        stats: baseStats,
        updateMovement: vi.fn()
      },
      projectileManager: {
        tryFire: vi.fn(),
        update: vi.fn()
      },
      refreshHud: vi.fn(),
      scale: {
        width: 1280,
        height: 720
      },
      statsKey: {},
      updateEliteWave: vi.fn(),
      temporaryBuffSystem: {
        getEffectiveStats: vi
          .fn()
          .mockReturnValueOnce({ ...baseStats, projectileCount: 3 })
          .mockReturnValueOnce(baseStats),
        getSummaryRows: vi.fn().mockReturnValue([]),
        update: vi.fn()
      },
      audioManager: {},
      damageStatsOverlay: {
        update: vi.fn()
      },
      damageStatsManager: {
        getRows: vi.fn().mockReturnValue([])
      },
      input: {
        keyboard: {
          addCapture: vi.fn()
        }
      },
      time: {
        now: 16
      },
      upgradeKeys: []
    };

    GameScene.prototype.update.call(sceneLike, 16, 16);
    GameScene.prototype.update.call(sceneLike, 30016, 16);

    expect(sceneLike.player.stats.projectileCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run the runtime test to verify it fails if permanent stats are corrupted**

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: FAIL if update flow ever mutates `player.stats` through the temporary buff path

- [ ] **Step 3: Make any final compatibility adjustments**

```js
const effectiveStats = this.temporaryBuffSystem.getEffectiveStats(this.player.stats, time);

this.projectileManager.tryFire(this.player, effectiveStats, livingEnemies, time);
this.bladeManager.syncToPlayer(effectiveStats);
this.pickupManager.update(this.player.sprite, effectiveStats.pickupRadius);

// Never assign effectiveStats back onto this.player.stats.
```

- [ ] **Step 4: Run the full verification set**

Run: `npm test`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

Run: `git status --short`  
Expected: only the intended plan file remains untracked outside implementation work, or a clean tree after commits

- [ ] **Step 5: Commit the final temporary powerup integration**

```bash
git add tests/runtimeFlow.test.js
git commit -m "feat: integrate temporary powerup runtime"
```
