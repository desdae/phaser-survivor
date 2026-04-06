# Poison Blob Enemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new poison blob enemy that leaves short-lived damaging poison trails and splits into two smaller child blobs on death.

**Architecture:** Extend the existing enemy archetype system with `poisonBlob` and `miniPoisonBlob`, but only spawn the parent from the regular wave profile. Keep poison puddles near enemy management so spawning, expiry, tick damage, split-on-death, and journal integration stay localized to the current enemy seams without introducing a broad new system too early.

**Tech Stack:** Phaser 3, existing enemy/spawn/journal architecture, Vitest

---

## File Map

- **Modify:** `C:\SL\ailab\_phaser\survivor\src\game\systems\EnemyManager.js`
  - Add new enemy type definitions, split-on-death behavior, poison trail hazard tracking, puddle expiry, and player poison tick damage.
- **Modify:** `C:\SL\ailab\_phaser\survivor\src\game\logic\spawn.js`
  - Add `poisonBlob` to later-game spawn weights.
- **Modify:** `C:\SL\ailab\_phaser\survivor\src\game\logic\enemyVisuals.js`
  - Add bubbling/sloshing visual variants for `poisonBlob` and `miniPoisonBlob`.
- **Modify:** `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
  - Generate procedural blob and poison-puddle textures.
- **Modify:** `C:\SL\ailab\_phaser\survivor\src\game\logic\journalData.js`
  - Add the main poison blob to the journal roster and detail data.
- **Modify:** `C:\SL\ailab\_phaser\survivor\tests\enemyManager.test.js`
  - Cover split-on-death, child no-split behavior, puddle spawn/expiry, and poison tick damage.
- **Modify:** `C:\SL\ailab\_phaser\survivor\tests\spawn.test.js`
  - Cover poison blob unlock timing and spawn weights.
- **Modify:** `C:\SL\ailab\_phaser\survivor\tests\enemyVisuals.test.js`
  - Cover the new blob visual config keys/scales.
- **Modify:** `C:\SL\ailab\_phaser\survivor\tests\journalData.test.js`
  - Cover poison blob journal visibility and split description.
- **Modify:** `C:\SL\ailab\_phaser\survivor\tests\runtimeFlow.test.js`
  - Confirm the new blob/puddle textures are generated.

### Task 1: Add Spawn/Profile and Journal Surface

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\spawn.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\journalData.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\spawn.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\journalData.test.js`

- [ ] **Step 1: Write the failing spawn/journal tests**

Add a spawn timing test:

```js
it('adds poison blobs to later waves after the early game', () => {
  expect(getSpawnProfile(45).weights.poisonBlob).toBe(0);
  expect(getSpawnProfile(95).weights.poisonBlob).toBeGreaterThan(0);
});
```

Add a journal test:

```js
it('describes the poison blob split mechanic in the discovered journal detail', () => {
  const discoveryState = {
    enemies: { poisonBlob: true },
    abilities: {}
  };

  const detail = buildEnemyJournalDetail('poisonBlob', discoveryState);

  expect(detail.title).toBe('Blight Ooze');
  expect(detail.description).toContain('splits into two lesser poison blobbies');
  expect(detail.rows.some((row) => row.label === 'HP')).toBe(true);
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npm test -- tests/spawn.test.js tests/journalData.test.js
```

Expected: FAIL because `poisonBlob` is not yet in the spawn profile or journal registry.

- [ ] **Step 3: Implement spawn weights and journal entry**

In `spawn.js`, add a later-wave poison blob weight:

```js
poisonBlob: elapsedSeconds < 80 ? 0 : Math.min(0.16, 0.03 + (elapsedSeconds - 80) / 420)
```

In `journalData.js`, add:

```js
export const ENEMY_JOURNAL_ORDER = ['skeleton', 'zombie', 'bat', 'tough', 'spitter', 'poisonBlob'];
```

And add a registry entry:

```js
poisonBlob: {
  name: 'Blight Ooze',
  textureKey: 'mob-poison-1',
  attackType: 'Melee + poison trail',
  specialAbilities: 'Leaves toxic puddles and splits into two lesser blobbies on death.',
  description: 'A slow, bloated ooze that fouls the ground and bursts into smaller spawn when slain.'
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
npm test -- tests/spawn.test.js tests/journalData.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/spawn.js src/game/logic/journalData.js tests/spawn.test.js tests/journalData.test.js
git commit -m "feat: add poison blob spawn profile and journal entry"
```

### Task 2: Add Visual Config and Procedural Textures

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\logic\enemyVisuals.js`
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\scenes\GameScene.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\enemyVisuals.test.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\runtimeFlow.test.js`

- [ ] **Step 1: Write the failing visual tests**

Add a visual config test:

```js
it('returns poison blob and mini poison blob visual configs', () => {
  expect(getEnemyVisualConfig('poisonBlob', 0).frames).toEqual([
    'mob-poison-0',
    'mob-poison-1',
    'mob-poison-2'
  ]);
  expect(getEnemyVisualConfig('miniPoisonBlob', 0).scale).toBeLessThan(
    getEnemyVisualConfig('poisonBlob', 0).scale
  );
});
```

Add a runtime texture test:

```js
expect(textureKeys).toContain('mob-poison-0');
expect(textureKeys).toContain('mob-poison-1');
expect(textureKeys).toContain('mob-poison-2');
expect(textureKeys).toContain('poison-puddle');
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npm test -- tests/enemyVisuals.test.js tests/runtimeFlow.test.js
```

Expected: FAIL because the new visual keys do not exist yet.

- [ ] **Step 3: Implement blob visual config and texture generation**

Add entries in `enemyVisuals.js`:

```js
poisonBlob: [
  {
    key: 'poisonBlob',
    frames: ['mob-poison-0', 'mob-poison-1', 'mob-poison-2'],
    frameDurationMs: 210,
    scale: 1.18
  }
],
miniPoisonBlob: [
  {
    key: 'miniPoisonBlob',
    frames: ['mob-poison-0', 'mob-poison-1', 'mob-poison-2'],
    frameDurationMs: 190,
    scale: 0.82
  }
]
```

In `GameScene.createTextures()`, add three poison blob frames and one puddle:

```js
const createPoisonBlobFrame = (frame) => {
  generateMobTexture(`mob-poison-${frame}`, 40, 40, () => {
    const wobble = frame === 0 ? -2 : frame === 2 ? 2 : 0;
    graphics.fillStyle(0x75d322, 0.96);
    graphics.fillEllipse(20 + wobble, 20, 25, 22);
    graphics.fillStyle(0x325707, 0.9);
    graphics.fillEllipse(20 - wobble, 22, 16, 14);
    graphics.fillStyle(0xd6ff79, 0.68);
    graphics.fillCircle(14 + wobble, 14, 5);
    graphics.fillCircle(25 - wobble, 18, 4);
    graphics.fillStyle(0xf4ffc1, 0.5);
    graphics.fillCircle(12 + wobble, 12, 2);
    graphics.fillCircle(23 - wobble, 16, 1.6);
  });
};
```

And:

```js
graphics.clear();
graphics.fillStyle(0x7fd11e, 0.72);
graphics.fillEllipse(20, 20, 28, 24);
graphics.fillStyle(0x284d09, 0.66);
graphics.fillEllipse(20, 21, 18, 15);
graphics.lineStyle(2, 0xc9ff73, 0.7);
graphics.strokeEllipse(20, 20, 26, 22);
graphics.generateTexture('poison-puddle', 40, 40);
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
npm test -- tests/enemyVisuals.test.js tests/runtimeFlow.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/enemyVisuals.js src/game/scenes/GameScene.js tests/enemyVisuals.test.js tests/runtimeFlow.test.js
git commit -m "feat: add poison blob visuals"
```

### Task 3: Add Enemy Definitions and Split-on-Death

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\systems\EnemyManager.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\enemyManager.test.js`

- [ ] **Step 1: Write the failing split behavior tests**

Add a parent split test:

```js
it('splits a poison blob into two mini poison blobs on death', () => {
  const manager = createEnemyManagerHarness();
  const spawnChild = vi.spyOn(manager, 'spawnEnemy').mockReturnValue({});
  const enemy = {
    active: true,
    destroy: vi.fn(),
    health: 10,
    isElite: false,
    type: 'poisonBlob',
    x: 48,
    y: 72
  };

  manager.damageEnemy(enemy, 10, 'projectile');

  expect(spawnChild).toHaveBeenCalledWith('miniPoisonBlob', expect.objectContaining({ splitChild: true, x: expect.any(Number), y: expect.any(Number) }));
  expect(spawnChild).toHaveBeenCalledTimes(2);
});
```

Add a child no-split test:

```js
it('does not split mini poison blobs when they die', () => {
  const manager = createEnemyManagerHarness();
  const spawnChild = vi.spyOn(manager, 'spawnEnemy');
  const enemy = {
    active: true,
    destroy: vi.fn(),
    health: 6,
    isElite: false,
    type: 'miniPoisonBlob',
    x: 48,
    y: 72
  };

  manager.damageEnemy(enemy, 6, 'projectile');

  expect(spawnChild).not.toHaveBeenCalledWith('miniPoisonBlob', expect.anything());
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- tests/enemyManager.test.js
```

Expected: FAIL because neither poison type nor split logic exists yet.

- [ ] **Step 3: Implement poison enemy types and split rules**

Add enemy types in `ENEMY_TYPES`:

```js
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
```

Persist these flags in `spawnEnemy()`:

```js
enemy.canSplit = type.canSplit ?? false;
enemy.poisonTickDamage = type.poisonTickDamage ?? 0;
enemy.trailDropIntervalMs = type.trailDropIntervalMs ?? 0;
enemy.nextTrailDropAt = 0;
```

Split on death:

```js
if (enemy.type === 'poisonBlob' && enemy.canSplit) {
  this.spawnEnemy('miniPoisonBlob', { splitChild: true, x: enemy.x - 14, y: enemy.y + 6 });
  this.spawnEnemy('miniPoisonBlob', { splitChild: true, x: enemy.x + 14, y: enemy.y - 6 });
}
```

And let `spawnEnemy()` accept explicit coordinates:

```js
const position = options.x !== undefined && options.y !== undefined
  ? { x: options.x, y: options.y }
  : getSpawnPosition(view, 100);
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npm test -- tests/enemyManager.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/EnemyManager.js tests/enemyManager.test.js
git commit -m "feat: add poison blob split behavior"
```

### Task 4: Add Poison Trail Puddles and Tick Damage

**Files:**
- Modify: `C:\SL\ailab\_phaser\survivor\src\game\systems\EnemyManager.js`
- Test: `C:\SL\ailab\_phaser\survivor\tests\enemyManager.test.js`

- [ ] **Step 1: Write the failing trail/damage tests**

Add a puddle spawn/expiry test:

```js
it('spawns poison puddles behind poison blobs and expires them after five seconds', () => {
  const manager = createEnemyManagerHarness();
  const blob = makeEnemy({ x: 100, y: 120, speed: 42 });
  blob.type = 'poisonBlob';
  blob.poisonTickDamage = 2;
  blob.trailDropIntervalMs = 650;
  blob.nextTrailDropAt = 0;

  manager.group.getChildren.mockReturnValue([blob]);
  manager.update(16, 90, 1000);

  expect(manager.poisonPuddles).toHaveLength(1);

  manager.update(16, 90, 7001);

  expect(manager.poisonPuddles).toHaveLength(0);
});
```

Add a player damage tick test:

```js
it('ticks poison damage while the player stands inside an active puddle', () => {
  const player = { sprite: { x: 100, y: 100 }, takeDamage: vi.fn().mockReturnValue(false) };
  const manager = createEnemyManagerHarness(player);
  manager.poisonPuddles = [
    { x: 100, y: 100, radius: 18, damage: 2, expiresAt: 7000, nextDamageAt: 0 }
  ];

  manager.update(16, 90, 1000);
  manager.update(16, 90, 1100);

  expect(player.takeDamage).toHaveBeenCalledTimes(2);
  expect(player.takeDamage).toHaveBeenCalledWith(2);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- tests/enemyManager.test.js
```

Expected: FAIL because poison puddles are not yet tracked or applied.

- [ ] **Step 3: Implement puddle spawn, expiry, and tick damage**

Add manager state:

```js
this.poisonPuddles = [];
this.poisonDamageIntervalMs = 500;
```

During `update()`:

```js
this.poisonPuddles = this.poisonPuddles.filter((puddle) => puddle.expiresAt > now);
livingEnemies.forEach((enemy) => {
  if ((enemy.type === 'poisonBlob' || enemy.type === 'miniPoisonBlob') && now >= (enemy.nextTrailDropAt ?? 0)) {
    this.poisonPuddles.push({
      x: enemy.x,
      y: enemy.y,
      radius: enemy.type === 'poisonBlob' ? 18 : 13,
      damage: enemy.poisonTickDamage ?? 0,
      expiresAt: now + 5000,
      nextDamageAt: now
    });
    enemy.nextTrailDropAt = now + (enemy.trailDropIntervalMs ?? 650);
  }
});
```

Then tick player damage:

```js
for (const puddle of this.poisonPuddles) {
  const dx = this.player.sprite.x - puddle.x;
  const dy = this.player.sprite.y - puddle.y;
  if (dx * dx + dy * dy <= puddle.radius * puddle.radius && now >= puddle.nextDamageAt) {
    const died = this.player.takeDamage(puddle.damage);
    puddle.nextDamageAt = now + this.poisonDamageIntervalMs;
    if (died) {
      this.scene.openGameOver?.();
    }
  }
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npm test -- tests/enemyManager.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/EnemyManager.js tests/enemyManager.test.js
git commit -m "feat: add poison blob trail hazards"
```

### Task 5: Final Verification and Integration Sweep

**Files:**
- Review the files above plus runtime coverage

- [ ] **Step 1: Run targeted verification**

Run:

```bash
npm test -- tests/spawn.test.js tests/enemyVisuals.test.js tests/enemyManager.test.js tests/journalData.test.js tests/runtimeFlow.test.js
```

Expected: PASS

- [ ] **Step 2: Run the full suite**

Run:

```bash
npm test
```

Expected: PASS with the entire test suite green.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS, with only the existing non-blocking chunk-size warning.

- [ ] **Step 4: Commit the integrated feature**

```bash
git add src/game/logic/spawn.js src/game/logic/enemyVisuals.js src/game/logic/journalData.js src/game/scenes/GameScene.js src/game/systems/EnemyManager.js tests/spawn.test.js tests/enemyVisuals.test.js tests/enemyManager.test.js tests/journalData.test.js tests/runtimeFlow.test.js
git commit -m "feat: add poison blob enemy"
```

## Self-Review

- **Spec coverage:** The plan covers the parent poison blob, child mini blobs, split-on-death, poison trail spawn/expiry, repeated poison damage ticks, spawn timing, visuals, and journal detail updates.
- **Placeholder scan:** No `TODO`/`TBD` placeholders remain. Every task includes concrete file paths, code snippets, commands, and expected outcomes.
- **Type consistency:** The plan uses `poisonBlob`, `miniPoisonBlob`, `poisonPuddles`, `poisonTickDamage`, `trailDropIntervalMs`, and `canSplit` consistently across spawn, enemy definitions, tests, and journal wiring.
