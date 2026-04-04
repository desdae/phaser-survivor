# Survivor Elite Waves, Reward Chests, and Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add timed elite waves, elite chest rewards, and a dark-fantasy procedural audio pass while preserving the current endless survivor loop and stable overlay interactions.

**Architecture:** Keep the one-scene Phaser runtime, but add three focused modules around it: an elite wave state machine, a chest reward system, and a procedural audio manager. Extend the existing pickup, enemy, and overlay flows instead of replacing them so we can reuse the working pause, click, and progression paths.

**Tech Stack:** JavaScript, Phaser 3, Web Audio API, Vite, Vitest

---

## File Structure

- Create: `src/game/logic/eliteWaves.js`
- Create: `src/game/logic/chestRewards.js`
- Create: `src/game/systems/EliteWaveSystem.js`
- Create: `src/game/systems/ChestRewardSystem.js`
- Create: `src/game/systems/AudioManager.js`
- Create: `tests/eliteWaves.test.js`
- Create: `tests/chestRewards.test.js`
- Create: `tests/audioManager.test.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/PickupManager.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `tests/enemyManager.test.js`
- Modify: `tests/overlayFactory.test.js`
- Modify: `tests/runtimeFlow.test.js`

### Task 1: Add Elite Wave Scheduling Logic

**Files:**
- Create: `src/game/logic/eliteWaves.js`
- Create: `src/game/systems/EliteWaveSystem.js`
- Create: `tests/eliteWaves.test.js`

- [ ] **Step 1: Write the failing elite wave tests**

```js
import { describe, expect, it } from 'vitest';
import {
  ELITE_WARNING_DURATION_MS,
  ELITE_WAVE_INTERVAL_MS,
  advanceEliteWaveState,
  consumePendingElite,
  createEliteState,
  getEliteModifiers
} from '../src/game/logic/eliteWaves.js';

describe('advanceEliteWaveState', () => {
  it('marks a pending elite wave once the interval is reached', () => {
    const state = createEliteState();

    const advanced = advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS);

    expect(advanced.pendingElite).toBe(true);
    expect(advanced.warningUntilMs).toBe(ELITE_WAVE_INTERVAL_MS + ELITE_WARNING_DURATION_MS);
    expect(advanced.nextEliteAtMs).toBe(ELITE_WAVE_INTERVAL_MS * 2);
  });

  it('does not retrigger early', () => {
    const state = createEliteState();

    const advanced = advanceEliteWaveState(state, ELITE_WAVE_INTERVAL_MS - 1);

    expect(advanced.pendingElite).toBe(false);
    expect(advanced.warningUntilMs).toBe(0);
  });
});

describe('consumePendingElite', () => {
  it('clears only the pending flag after an elite spawn is consumed', () => {
    const consumed = consumePendingElite({
      nextEliteAtMs: ELITE_WAVE_INTERVAL_MS * 2,
      pendingElite: true,
      warningUntilMs: ELITE_WAVE_INTERVAL_MS + ELITE_WARNING_DURATION_MS
    });

    expect(consumed.pendingElite).toBe(false);
    expect(consumed.nextEliteAtMs).toBe(ELITE_WAVE_INTERVAL_MS * 2);
  });
});

describe('getEliteModifiers', () => {
  it('returns stronger multipliers and a presentation payload', () => {
    expect(getEliteModifiers()).toEqual({
      healthMultiplier: 4,
      contactDamageMultiplier: 1.5,
      xpMultiplier: 1.6,
      scaleMultiplier: 1.32,
      tint: 0xf4bf63
    });
  });
});
```

- [ ] **Step 2: Run the elite wave tests to verify they fail**

Run: `npm test -- tests/eliteWaves.test.js`  
Expected: FAIL because `src/game/logic/eliteWaves.js` does not exist yet

- [ ] **Step 3: Add the pure elite wave helper module**

```js
export const ELITE_WAVE_INTERVAL_MS = 90_000;
export const ELITE_WARNING_DURATION_MS = 3_000;

export function createEliteState() {
  return {
    nextEliteAtMs: ELITE_WAVE_INTERVAL_MS,
    pendingElite: false,
    warningUntilMs: 0
  };
}

export function advanceEliteWaveState(state, elapsedMs) {
  if (elapsedMs < state.nextEliteAtMs || state.pendingElite) {
    return state;
  }

  return {
    nextEliteAtMs: state.nextEliteAtMs + ELITE_WAVE_INTERVAL_MS,
    pendingElite: true,
    warningUntilMs: elapsedMs + ELITE_WARNING_DURATION_MS
  };
}

export function consumePendingElite(state) {
  return {
    ...state,
    pendingElite: false
  };
}

export function getEliteModifiers() {
  return {
    healthMultiplier: 4,
    contactDamageMultiplier: 1.5,
    xpMultiplier: 1.6,
    scaleMultiplier: 1.32,
    tint: 0xf4bf63
  };
}
```

- [ ] **Step 4: Add a small system wrapper so the scene can query elite state cleanly**

```js
import {
  advanceEliteWaveState,
  consumePendingElite,
  createEliteState
} from '../logic/eliteWaves.js';

export class EliteWaveSystem {
  constructor() {
    this.state = createEliteState();
  }

  update(elapsedMs) {
    this.state = advanceEliteWaveState(this.state, elapsedMs);
    return this.state;
  }

  consumeSpawn() {
    this.state = consumePendingElite(this.state);
  }

  isWarningActive(nowMs) {
    return nowMs <= this.state.warningUntilMs;
  }
}
```

- [ ] **Step 5: Run the elite wave tests to verify they pass**

Run: `npm test -- tests/eliteWaves.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the elite wave scheduler**

```bash
git add src/game/logic/eliteWaves.js src/game/systems/EliteWaveSystem.js tests/eliteWaves.test.js
git commit -m "feat: add elite wave scheduler"
```

### Task 2: Add Elite Enemy Promotion and Chest Drops

**Files:**
- Modify: `src/game/systems/EnemyManager.js`
- Modify: `src/game/systems/PickupManager.js`
- Modify: `tests/enemyManager.test.js`

- [ ] **Step 1: Write the failing tests for elite promotion and chest drops**

```js
import { describe, expect, it, vi } from 'vitest';
import { EnemyManager } from '../src/game/systems/EnemyManager.js';

describe('EnemyManager spawnEnemy', () => {
  it('applies elite modifiers when requested', () => {
    const manager = createEnemyManagerHarness();

    const enemy = manager.spawnEnemy('basic', { elite: true });

    expect(enemy.isElite).toBe(true);
    expect(enemy.health).toBeGreaterThan(100);
    expect(enemy.contactDamage).toBeGreaterThan(8);
    expect(enemy.scaleX).toBeGreaterThan(1);
    expect(enemy.tintTopLeft).toBe(0xf4bf63);
  });
});

describe('EnemyManager damageEnemy', () => {
  it('drops a chest when an elite dies', () => {
    const manager = createEnemyManagerHarness();
    const enemy = manager.spawnEnemy('basic', { elite: true });

    manager.damageEnemy(enemy, enemy.health, 'autoShot');

    expect(manager.pickupManager.spawnChest).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the enemy manager tests to verify they fail**

Run: `npm test -- tests/enemyManager.test.js`  
Expected: FAIL because `spawnEnemy` does not accept an elite option yet and `spawnChest` does not exist

- [ ] **Step 3: Extend the pickup manager with chest pickups**

```js
spawnChest(x, y, rewardSeed = null) {
  const chest = this.spawnPickup(x, y, 'reward-chest', 'chest', 0);
  chest.rewardSeed = rewardSeed;
  chest.setDepth(2.4);
  return chest;
}
```

- [ ] **Step 4: Add elite promotion support to enemy spawning and death handling**

```js
import { getEliteModifiers } from '../logic/eliteWaves.js';

spawnEnemy(typeKey, options = {}) {
  const type = ENEMY_TYPES[typeKey];
  const enemy = this.group.create(position.x, position.y, visual.frames[0] ?? type.texture);

  enemy.type = typeKey;
  enemy.isElite = options.elite === true;
  enemy.speed = type.speed;
  enemy.health = type.maxHealth;
  enemy.xpValue = type.xpValue;
  enemy.contactDamage = type.contactDamage;

  if (enemy.isElite) {
    const elite = getEliteModifiers();
    enemy.health = Math.round(type.maxHealth * elite.healthMultiplier);
    enemy.xpValue = Math.round(type.xpValue * elite.xpMultiplier);
    enemy.contactDamage = Math.round(type.contactDamage * elite.contactDamageMultiplier);
    enemy.setScale((visual.scale ?? 1) * elite.scaleMultiplier);
    enemy.setTint(elite.tint);
  } else {
    enemy.setScale(visual.scale ?? 1);
  }

  return enemy;
}

damageEnemy(enemy, damage, sourceKey = null) {
  // existing damage logic...

  if (enemy.health <= 0) {
    this.pickupManager.spawnOrb(enemy.x, enemy.y, enemy.xpValue);

    if (enemy.isElite) {
      this.pickupManager.spawnChest(enemy.x, enemy.y, enemy.type);
    }

    enemy.destroy();
    return true;
  }
}
```

- [ ] **Step 5: Run the enemy manager tests to verify they pass**

Run: `npm test -- tests/enemyManager.test.js`  
Expected: PASS

- [ ] **Step 6: Commit elite enemy promotion and chest drops**

```bash
git add src/game/systems/EnemyManager.js src/game/systems/PickupManager.js tests/enemyManager.test.js
git commit -m "feat: add elite chest drops"
```

### Task 3: Add Chest Reward Logic and Overlay Interaction

**Files:**
- Create: `src/game/logic/chestRewards.js`
- Create: `src/game/systems/ChestRewardSystem.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `src/game/systems/PickupManager.js`
- Modify: `src/game/scenes/GameScene.js`
- Create: `tests/chestRewards.test.js`
- Modify: `tests/overlayFactory.test.js`
- Modify: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing chest reward tests**

```js
import { describe, expect, it, vi } from 'vitest';
import {
  applyChestReward,
  getChestRewardPool,
  rollChestChoices
} from '../src/game/logic/chestRewards.js';

describe('getChestRewardPool', () => {
  it('includes arsenal draft while weapons are still locked', () => {
    const pool = getChestRewardPool({
      bladeUnlocked: false,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true
    });

    expect(pool.some((entry) => entry.key === 'arsenalDraft')).toBe(true);
  });

  it('falls back to relic rewards once all weapons are unlocked', () => {
    const pool = getChestRewardPool({
      bladeUnlocked: true,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true
    });

    expect(pool.some((entry) => entry.key === 'arsenalDraft')).toBe(false);
  });
});

describe('applyChestReward', () => {
  it('unlocks a missing weapon through arsenal draft', () => {
    const player = {
      bladeUnlocked: false,
      chainUnlocked: true,
      novaUnlocked: true,
      boomerangUnlocked: true,
      meteorUnlocked: true,
      bladeCount: 0,
      bladeDamage: 0,
      bladeOrbitRadius: 0,
      bladeOrbitSpeed: 0,
      maxHealth: 100,
      health: 25,
      projectileDamage: 18,
      fireCooldownMs: 520
    };

    applyChestReward(player, { key: 'arsenalDraft' }, { pullNearbyToPlayer: () => {} });

    expect(player.bladeUnlocked).toBe(true);
    expect(player.bladeCount).toBe(1);
  });

  it('pulls nearby pickups for soul magnet', () => {
    const pullNearbyToPlayer = vi.fn();

    applyChestReward(
      { maxHealth: 100, health: 40 },
      { key: 'soulMagnet' },
      { pullNearbyToPlayer }
    );

    expect(pullNearbyToPlayer).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the chest reward tests to verify they fail**

Run: `npm test -- tests/chestRewards.test.js`  
Expected: FAIL because `src/game/logic/chestRewards.js` does not exist yet

- [ ] **Step 3: Add the chest reward logic module**

```js
import { applyUpgrade } from './progression.js';

const LOCKED_WEAPON_UNLOCKS = [
  { unlocked: 'bladeUnlocked', key: 'unlockBlade' },
  { unlocked: 'chainUnlocked', key: 'unlockChain' },
  { unlocked: 'novaUnlocked', key: 'unlockNova' },
  { unlocked: 'boomerangUnlocked', key: 'unlockBoomerang' },
  { unlocked: 'meteorUnlocked', key: 'unlockMeteor' }
];

export function getChestRewardPool(player) {
  const allWeaponsUnlocked = LOCKED_WEAPON_UNLOCKS.every((entry) => player[entry.unlocked]);

  return [
    { key: 'relicDamage', label: 'Blood Relic', description: '+14 projectile damage' },
    { key: 'relicFrenzy', label: 'War Drum', description: '-120ms fire cooldown' },
    { key: 'vitalSurge', label: 'Vital Surge', description: 'Restore 40 health' },
    { key: 'soulMagnet', label: 'Soul Magnet', description: 'Pull nearby drops to you instantly' },
    ...(allWeaponsUnlocked
      ? []
      : [{ key: 'arsenalDraft', label: 'Arsenal Draft', description: 'Unlock a new weapon if one remains' }])
  ];
}

export function rollChestChoices(pool, rng = Math.random, count = 3) {
  const bag = [...pool];
  const picks = [];

  while (bag.length > 0 && picks.length < count) {
    const index = Math.floor(rng() * bag.length);
    picks.push(...bag.splice(index, 1));
  }

  return picks;
}

export function applyChestReward(player, reward, pickupManager) {
  switch (reward.key) {
    case 'relicDamage':
      player.projectileDamage += 14;
      return;
    case 'relicFrenzy':
      player.fireCooldownMs = Math.max(140, player.fireCooldownMs - 120);
      return;
    case 'vitalSurge':
      player.health = Math.min(player.maxHealth, player.health + 40);
      return;
    case 'soulMagnet':
      pickupManager.pullNearbyToPlayer?.();
      return;
    case 'arsenalDraft': {
      const unlock = LOCKED_WEAPON_UNLOCKS.find((entry) => !player[entry.unlocked])?.key ?? 'damage';
      applyUpgrade(player, unlock);
      return;
    }
    default:
      throw new Error(`Unknown chest reward: ${reward.key}`);
  }
}
```

- [ ] **Step 4: Add a reward system wrapper and pickup magnet helper**

```js
import { applyChestReward, getChestRewardPool, rollChestChoices } from '../logic/chestRewards.js';

export class ChestRewardSystem {
  getChoices(playerStats) {
    return rollChestChoices(getChestRewardPool(playerStats));
  }

  apply(player, reward, pickupManager) {
    applyChestReward(player.stats, reward, pickupManager);
  }
}
```

```js
pullNearbyToPlayer(playerSprite, radius = 260, speed = 440) {
  for (const pickup of this.group.getChildren()) {
    if (!pickup?.active || pickup.kind === 'chest') {
      continue;
    }

    const dx = playerSprite.x - pickup.x;
    const dy = playerSprite.y - pickup.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq > radius * radius) {
      continue;
    }

    const distance = Math.hypot(dx, dy) || 1;
    pickup.setVelocity((dx / distance) * speed, (dy / distance) * speed);
  }
}
```

- [ ] **Step 5: Add the chest overlay and scene flow wiring**

```js
export function createChestOverlay(scene, onSelect) {
  const backdrop = scene.add.rectangle(0, 0, 100, 100, 0x050306, 0.8).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 940, 420, 0x24140f, 0.97).setStrokeStyle(2, 0xe0aa61, 0.72);
  const title = scene.add.text(0, 0, 'Reward Chest', {
    fontFamily: 'Trebuchet MS',
    fontSize: '38px',
    color: '#ffe9c8',
    fontStyle: 'bold'
  });
  const cards = [createButtonCard(scene), createButtonCard(scene), createButtonCard(scene)];
  const container = scene.add.container(0, 0, [backdrop, panel, title, ...cards]);

  title.setOrigin(0.5);
  container.setDepth(62);
  container.setScrollFactor(0);
  container.setVisible(false);

  return {
    show(choices) {
      cards.forEach((card, index) => {
        const choice = choices[index];
        card.choice = choice ?? null;
        card.setVisible(Boolean(choice));
        if (choice) {
          card.background.setFillStyle(0x3a2419, 0.98);
          card.background.setStrokeStyle(2, 0xf0c17d, 0.82);
          card.badge.setText('CHEST');
          card.title.setText(choice.label);
          card.description.setText(choice.description);
          card.hint.setText(`Press ${index + 1} or click`);
        }
      });
      container.setVisible(true);
    },
    hide() {
      container.setVisible(false);
    },
    chooseIndex(index) {
      const choice = cards[index]?.choice;
      if (choice) {
        onSelect(choice);
      }
    },
    choosePointer(pointerX, pointerY) {
      for (const card of cards) {
        if (!card.visible || !card.choice) {
          continue;
        }

        const width = 280 * card.scaleX;
        const height = 170 * card.scaleY;
        const withinX = pointerX >= card.x - width / 2 && pointerX <= card.x + width / 2;
        const withinY = pointerY >= card.y - height / 2 && pointerY <= card.y + height / 2;

        if (withinX && withinY) {
          onSelect(card.choice);
          return true;
        }
      }

      return false;
    },
    layout(width, height) {
      backdrop.setSize(width, height);
      panel.setPosition(width / 2, height / 2);
      title.setPosition(width / 2, height / 2 - 150);
      cards.forEach((card, index) => {
        card.setPosition(width / 2 - 300 + index * 300, height / 2 + 48);
      });
    }
  };
}
```

```js
handlePickupCollected(pickup) {
  if (pickup.kind === 'chest') {
    this.openChestReward();
    return true;
  }

  // existing heart and xp logic...
}

openChestReward() {
  this.isGameplayPaused = true;
  this.physics.world.pause();
  this.player.stop();
  this.chestOverlay.show(this.chestRewardSystem.getChoices(this.player.stats));
}

handleChestRewardSelected(reward) {
  this.chestRewardSystem.apply(this.player, reward, this.pickupManager, this.player.sprite);
  this.chestOverlay.hide();
  this.physics.world.resume();
  this.isGameplayPaused = false;
}
```

- [ ] **Step 6: Add overlay and runtime regression tests**

```js
it('selects a chest reward by pointer hit test', () => {
  const overlay = createChestOverlay(scene, onSelect);
  overlay.layout(1280, 720);
  overlay.show([{ key: 'vitalSurge', label: 'Vital Surge', description: 'Restore 40 health' }]);

  expect(overlay.choosePointer(640, 410)).toBe(true);
  expect(onSelect).toHaveBeenCalledWith(
    expect.objectContaining({ key: 'vitalSurge' })
  );
});

it('opens the chest overlay when a chest pickup is collected', () => {
  const sceneLike = {
    isGameplayPaused: false,
    physics: { world: { pause: vi.fn() } },
    player: { stop: vi.fn(), stats: {} },
    chestRewardSystem: { getChoices: vi.fn().mockReturnValue([{ key: 'vitalSurge' }]) },
    chestOverlay: { show: vi.fn() }
  };

  GameScene.prototype.openChestReward.call(sceneLike);

  expect(sceneLike.physics.world.pause).toHaveBeenCalledOnce();
  expect(sceneLike.chestOverlay.show).toHaveBeenCalledWith([{ key: 'vitalSurge' }]);
});
```

- [ ] **Step 7: Run the chest reward and overlay tests to verify they pass**

Run: `npm test -- tests/chestRewards.test.js`  
Expected: PASS

Run: `npm test -- tests/overlayFactory.test.js`  
Expected: PASS

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: PASS

- [ ] **Step 8: Commit chest rewards and overlay flow**

```bash
git add src/game/logic/chestRewards.js src/game/systems/ChestRewardSystem.js src/game/systems/PickupManager.js src/game/scenes/GameScene.js src/game/ui/overlayFactory.js tests/chestRewards.test.js tests/overlayFactory.test.js tests/runtimeFlow.test.js
git commit -m "feat: add elite chest reward flow"
```

### Task 4: Add Procedural Dark-Fantasy Audio

**Files:**
- Create: `src/game/systems/AudioManager.js`
- Create: `tests/audioManager.test.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/EnemyManager.js`

- [ ] **Step 1: Write the failing audio manager tests**

```js
import { describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../src/game/systems/AudioManager.js';

describe('AudioManager', () => {
  it('fails safely when audio context creation is unavailable', () => {
    const manager = new AudioManager(() => {
      throw new Error('blocked');
    });

    expect(() => manager.unlock()).not.toThrow();
    expect(() => manager.playEnemyHit()).not.toThrow();
  });

  it('reuses the unlocked context for playback', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const context = createAudioContextHarness({ start, stop });
    const manager = new AudioManager(() => context);

    manager.unlock();
    manager.playEliteWarning();

    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the audio tests to verify they fail**

Run: `npm test -- tests/audioManager.test.js`  
Expected: FAIL because `src/game/systems/AudioManager.js` does not exist yet

- [ ] **Step 3: Add the procedural audio manager with safe fallback behavior**

```js
export class AudioManager {
  constructor(contextFactory = () => new window.AudioContext()) {
    this.contextFactory = contextFactory;
    this.context = null;
    this.enabled = true;
  }

  unlock() {
    if (this.context || !this.enabled) {
      return this.context;
    }

    try {
      this.context = this.contextFactory();
      this.context.resume?.();
    } catch {
      this.enabled = false;
    }

    return this.context;
  }

  playEnemyHit() {
    this.playTone({ frequency: 120, duration: 0.05, gain: 0.018, type: 'triangle' });
  }

  playEliteWarning() {
    this.playTone({ frequency: 170, duration: 0.22, gain: 0.04, type: 'sawtooth', slideTo: 110 });
  }

  playChestOpen() {
    this.playTone({ frequency: 280, duration: 0.18, gain: 0.035, type: 'triangle', slideTo: 420 });
  }

  playTone({ frequency, duration, gain, type, slideTo = null }) {
    const context = this.unlock();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo !== null) {
      oscillator.frequency.linearRampToValueAtTime(slideTo, now + duration);
    }

    envelope.gain.setValueAtTime(gain, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
```

- [ ] **Step 4: Wire audio events into scene and enemy flow**

```js
this.audioManager = new AudioManager();
this.input.once('pointerdown', () => this.audioManager.unlock());
this.input.once('keydown', () => this.audioManager.unlock());
```

```js
if (result.leveledUp) {
  this.audioManager.playLevelUp?.();
  this.openLevelUp();
}

if (pickup.kind === 'heart') {
  this.audioManager.playPickup?.();
}
```

```js
if (enemy.health > 0) {
  this.audioManager?.playEnemyHit?.();
} else if (enemy.isElite) {
  this.audioManager?.playEliteDeath?.();
} else {
  this.audioManager?.playEnemyDeath?.();
}
```

- [ ] **Step 5: Run the audio tests to verify they pass**

Run: `npm test -- tests/audioManager.test.js`  
Expected: PASS

- [ ] **Step 6: Commit the procedural audio layer**

```bash
git add src/game/systems/AudioManager.js src/game/scenes/GameScene.js src/game/systems/EnemyManager.js tests/audioManager.test.js
git commit -m "feat: add dark fantasy procedural audio"
```

### Task 5: Integrate Elite Warning HUD, Chest Pause Rules, and Final Verification

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/ui/overlayFactory.js`
- Modify: `tests/runtimeFlow.test.js`
- Modify: `tests/overlayFactory.test.js`

- [ ] **Step 1: Add the failing scene and overlay regression tests**

```js
it('shows an elite warning while the warning window is active', () => {
  const hud = createHud(scene);

  hud.update({
    health: 100,
    maxHealth: 100,
    level: 4,
    xp: 3,
    xpToNext: 20,
    timeMs: 90_000,
    enemyCount: 12,
    projectileCount: 2,
    bladeCount: 1,
    activeWeapons: 3,
    eliteWarning: 'Elite wave incoming'
  });

  expect(hud.warningText.text).toContain('Elite wave incoming');
});

it('does not open a chest reward while another pause overlay is already active', () => {
  const sceneLike = {
    isGameplayPaused: true,
    chestOverlay: { show: vi.fn() },
    chestRewardSystem: { getChoices: vi.fn() }
  };

  GameScene.prototype.handlePickupCollected.call(sceneLike, { kind: 'chest' });

  expect(sceneLike.chestOverlay.show).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the regression tests to verify they fail**

Run: `npm test -- tests/runtimeFlow.test.js`  
Expected: FAIL because chest pause gating and elite warning HUD do not exist yet

Run: `npm test -- tests/overlayFactory.test.js`  
Expected: FAIL because the HUD has no warning text yet

- [ ] **Step 3: Wire the scene-level elite and chest orchestration**

```js
import { getSpawnProfile } from '../logic/spawn.js';

this.eliteWaveSystem = new EliteWaveSystem();
this.chestRewardSystem = new ChestRewardSystem();
this.pendingEliteSpawn = false;
```

```js
const eliteState = this.eliteWaveSystem.update(this.elapsedMs);

if (eliteState.pendingElite) {
  const profile = getSpawnProfile(this.elapsedMs / 1000);
  const eliteType = this.enemyManager.pickEnemyType(profile.weights);
  this.audioManager.playEliteWarning?.();
  this.enemyManager.spawnEnemy(eliteType, { elite: true });
  this.eliteWaveSystem.consumeSpawn();
}
```

```js
if (pickup.kind === 'chest') {
  if (this.isGameplayPaused || this.isGameOver) {
    return false;
  }

  this.audioManager.playChestOpen?.();
  this.openChestReward();
  return true;
}
```

- [ ] **Step 4: Add HUD warning text and chest overlay layout support**

```js
const warningText = scene.add.text(18, 136, '', {
  fontFamily: 'Trebuchet MS',
  fontSize: '18px',
  color: '#ffcc7a',
  fontStyle: 'bold'
});

graphics.clear();
graphics.fillStyle(0x7b5227, 1);
graphics.fillRoundedRect(2, 6, 28, 20, 5);
graphics.lineStyle(2, 0xe7bf78, 1);
graphics.strokeRoundedRect(2, 6, 28, 20, 5);
graphics.fillStyle(0xf0d39a, 1);
graphics.fillRect(11, 12, 10, 4);
graphics.generateTexture('reward-chest', 32, 32);

return {
  warningText,
  layout() {
    container.setPosition(18, 18);
  },
  update({ eliteWarning, ...stats }) {
    hpText.setText(`HP ${Math.ceil(stats.health)} / ${stats.maxHealth}`);
    levelText.setText(`Level ${stats.level}   Threats ${stats.enemyCount}`);
    xpText.setText(`XP ${stats.xp} / ${stats.xpToNext}   Shots ${stats.projectileCount}   Blades ${stats.bladeCount}`);
    timeText.setText(`Time ${formatTime(stats.timeMs)}   Arsenal ${stats.activeWeapons}`);
    warningText.setText(eliteWarning ?? '');
  }
};
```

- [ ] **Step 5: Run the full verification set**

Run: `npm test`  
Expected: PASS with all elite, chest, audio, overlay, and runtime tests green

Run: `npm run build`  
Expected: PASS with a production build generated successfully

Run: `git status --short`  
Expected: clean or only intended plan-task changes before the final commit

- [ ] **Step 6: Commit the integrated elite event loop**

```bash
git add src/game/scenes/GameScene.js src/game/ui/overlayFactory.js tests/runtimeFlow.test.js tests/overlayFactory.test.js
git commit -m "feat: integrate elite waves chest rewards and audio"
```
