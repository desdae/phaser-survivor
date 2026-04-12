# Spear Direction Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Spear Barrage` and `Lance` both read as point-first spear attacks without changing damage, cooldowns, or hit logic.

**Architecture:** Keep ownership in the existing weapon systems. `SpearBarrageManager` gets a small rotation correction so the current falling spear texture points along its flight path, while `LanceManager` upgrades from a graphics line to a short-lived spear-shaped sprite plus a faint trail. `GameScene.createTextures()` remains the home for any procedural spear textures, and tests stay focused on orientation, rendering lifecycle, and texture generation.

**Tech Stack:** JavaScript, Phaser 3, Vite, Vitest

---

## File Structure

- Modify: `src/game/logic/spearBarrageVisuals.js`
- Modify: `src/game/scenes/GameScene.js`
- Modify: `src/game/systems/SpearBarrageManager.js`
- Modify: `src/game/systems/LanceManager.js`
- Modify: `tests/runtimeFlow.test.js`
- Modify: `tests/spearBarrage.test.js`
- Modify: `tests/lance.test.js`

`src/game/logic/spearBarrageVisuals.js` stays the pure helper boundary for barrage math and gains a dedicated flight rotation helper.

`src/game/scenes/GameScene.js` owns any new procedural lance textures only. The barrage textures stay as they are unless a runtime fix proves impossible.

`src/game/systems/SpearBarrageManager.js` keeps the existing strike lifecycle, but applies the corrected spear rotation.

`src/game/systems/LanceManager.js` keeps the current hit logic and cooldown flow, but swaps the visual from a plain graphics line to a short-lived spear sprite effect.

### Task 1: Correct Spear Barrage Tip Direction

**Files:**
- Modify: `src/game/logic/spearBarrageVisuals.js`
- Modify: `src/game/systems/SpearBarrageManager.js`
- Test: `tests/spearBarrage.test.js`

- [ ] **Step 1: Write the failing barrage orientation regression**

Update `tests/spearBarrage.test.js` so it proves the barrage spear points in the same direction it travels:

```js
import { describe, expect, it, vi } from 'vitest';
import { SpearBarrageManager } from '../src/game/systems/SpearBarrageManager.js';

describe('SpearBarrageManager', () => {
  it('rotates the barrage spear so the tip leads the fall direction', () => {
    const createdSprites = [];
    const makeSprite = (x, y, key) => ({
      active: true,
      alpha: 1,
      rotation: 0,
      texture: { key },
      x,
      y,
      setAlpha(value) { this.alpha = value; return this; },
      setDepth() { return this; },
      setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
      setRotation(value) { this.rotation = value; return this; },
      setScale() { return this; },
      setTintFill() { return this; },
      destroy() { this.active = false; }
    });

    const manager = new SpearBarrageManager({
      add: {
        image: (x, y, key) => {
          const sprite = makeSprite(x, y, key);
          createdSprites.push(sprite);
          return sprite;
        }
      },
      cameras: {
        main: { scrollY: 100, width: 800 }
      },
      tweens: {
        add: vi.fn((config) => config)
      }
    });

    manager.update(
      { sprite: { x: 0, y: 0 } },
      {
        spearBarrageUnlocked: true,
        spearBarrageDamage: 18,
        spearBarrageCount: 1,
        spearBarrageRadius: 30,
        spearBarrageCooldownMs: 1200
      },
      { x: 120, y: 100 },
      1000,
      [],
      { damageEnemy: () => {} }
    );

    const fallingSpear = createdSprites.find((entry) => entry.texture.key === 'spear-barrage-fall');

    expect(fallingSpear.rotation).toBeCloseTo(Math.atan2(140, 72) + Math.PI / 2, 5);
  });
});
```

- [ ] **Step 2: Run the barrage regression and verify it fails**

Run: `npm test -- tests/spearBarrage.test.js`
Expected: FAIL because the current barrage rotation still points the spear backward relative to the travel vector.

- [ ] **Step 3: Add a pure rotation helper and use it in the manager**

Update `src/game/logic/spearBarrageVisuals.js`:

```js
export function getSpearFlightRotation(startX, startY, targetX, targetY) {
  return Math.atan2(targetY - startY, targetX - startX) + Math.PI / 2;
}
```

Update the barrage manager import and rotation assignment in `src/game/systems/SpearBarrageManager.js`:

```js
import {
  SPEAR_WARNING_MS,
  getSpearFlightRotation,
  getSpearSpawnPosition,
  getSpearVisualState
} from '../logic/spearBarrageVisuals.js';
```

```js
const rotation = getSpearFlightRotation(spawnX, spawnY, x, y);
```

- [ ] **Step 4: Re-run the barrage regression and verify it passes**

Run: `npm test -- tests/spearBarrage.test.js`
Expected: PASS

- [ ] **Step 5: Commit the barrage direction fix**

```bash
git add src/game/logic/spearBarrageVisuals.js src/game/systems/SpearBarrageManager.js tests/spearBarrage.test.js
git commit -m "Fix spear barrage tip direction"
```

### Task 2: Add Lance Spear Textures

**Files:**
- Modify: `src/game/scenes/GameScene.js`
- Test: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Write the failing texture regression for lance visuals**

Add these expectations to the `GameScene createTextures` test in `tests/runtimeFlow.test.js`:

```js
expect(generateTexture).toHaveBeenCalledWith('lance-strike', 180, 28);
expect(generateTexture).toHaveBeenCalledWith('lance-trail', 180, 24);
```

- [ ] **Step 2: Run the texture regression and verify it fails**

Run: `npm test -- tests/runtimeFlow.test.js`
Expected: FAIL because the new lance texture keys are not generated yet.

- [ ] **Step 3: Add the procedural lance textures**

Add these texture generators near the current combat textures in `src/game/scenes/GameScene.js`:

```js
graphics.clear();
graphics.fillStyle(0x2b313a, 0.96);
graphics.fillRect(16, 12, 112, 4);
graphics.fillStyle(0x48515d, 0.9);
graphics.fillRect(20, 10, 104, 2);
graphics.fillStyle(0xc6edf6, 0.98);
graphics.fillTriangle(126, 7, 178, 14, 126, 21);
graphics.fillStyle(0xeffbff, 0.82);
graphics.fillTriangle(132, 10, 170, 14, 132, 18);
graphics.lineStyle(2, 0xa9f1ff, 0.82);
graphics.lineBetween(118, 14, 138, 4);
graphics.lineBetween(118, 14, 138, 24);
graphics.generateTexture('lance-strike', 180, 28);

graphics.clear();
graphics.fillStyle(0x7ce4ff, 0.18);
graphics.fillEllipse(78, 12, 136, 12);
graphics.fillStyle(0xc1f6ff, 0.14);
graphics.fillEllipse(96, 12, 96, 8);
graphics.generateTexture('lance-trail', 180, 24);
```

- [ ] **Step 4: Re-run the texture regression and verify it passes**

Run: `npm test -- tests/runtimeFlow.test.js`
Expected: PASS

- [ ] **Step 5: Commit the lance texture support**

```bash
git add src/game/scenes/GameScene.js tests/runtimeFlow.test.js
git commit -m "Add lance spear strike textures"
```

### Task 3: Upgrade Lance Rendering To A Point-First Spear Thrust

**Files:**
- Modify: `src/game/systems/LanceManager.js`
- Test: `tests/lance.test.js`

- [ ] **Step 1: Write the failing lance render regression**

Expand `tests/lance.test.js` with a visual rendering test:

```js
import { describe, expect, it, vi } from 'vitest';
import { LanceManager } from '../src/game/systems/LanceManager.js';

describe('LanceManager', () => {
  it('renders a spear-first strike aligned to the aim direction', () => {
    const createdImages = [];
    const makeImage = (x, y, key) => ({
      active: true,
      alpha: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      texture: { key },
      x,
      y,
      setAlpha(value) { this.alpha = value; return this; },
      setDepth() { return this; },
      setOrigin(xValue, yValue) { this.originX = xValue; this.originY = yValue; return this; },
      setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
      setRotation(value) { this.rotation = value; return this; },
      setScale(xValue, yValue = xValue) { this.scaleX = xValue; this.scaleY = yValue; return this; },
      setTintFill(value) { this.tint = value; return this; },
      destroy() { this.active = false; }
    });

    const manager = new LanceManager({
      add: {
        image: (x, y, key) => {
          const sprite = makeImage(x, y, key);
          createdImages.push(sprite);
          return sprite;
        }
      },
      time: {
        delayedCall: vi.fn((delay, callback) => {
          callback();
          return delay;
        })
      }
    });

    manager.update(
      { sprite: { x: 20, y: 30 } },
      {
        lanceUnlocked: true,
        lanceDamage: 20,
        lanceCooldownMs: 900,
        lanceLength: 220,
        lanceWidth: 18
      },
      { x: 1, y: 0 },
      1000,
      [{ active: true, x: 90, y: 0, id: 'a' }],
      { damageEnemy: () => {} }
    );

    const strike = createdImages.find((entry) => entry.texture.key === 'lance-strike');
    const trail = createdImages.find((entry) => entry.texture.key === 'lance-trail');

    expect(strike).toBeTruthy();
    expect(trail).toBeTruthy();
    expect(strike.rotation).toBeCloseTo(0, 5);
    expect(strike.originX).toBe(0.12);
    expect(strike.active).toBe(false);
    expect(trail.active).toBe(false);
  });
});
```

- [ ] **Step 2: Run the lance regression and verify it fails**

Run: `npm test -- tests/lance.test.js`
Expected: FAIL because `LanceManager` still renders only a graphics line.

- [ ] **Step 3: Replace the graphics line with spear sprites**

Update `src/game/systems/LanceManager.js` so `render()` uses the new textures:

```js
render(origin, aimDirection, stats) {
  const add = this.scene?.add;
  const time = this.scene?.time;

  if (!add?.image || !time?.delayedCall) {
    return;
  }

  const rotation = Math.atan2(aimDirection.y, aimDirection.x);
  const midX = origin.x + aimDirection.x * ((stats.lanceLength ?? 0) * 0.5);
  const midY = origin.y + aimDirection.y * ((stats.lanceLength ?? 0) * 0.5);
  const strike = add.image(midX, midY, 'lance-strike');
  const trail = add.image(midX - aimDirection.x * 14, midY - aimDirection.y * 14, 'lance-trail');

  trail.setDepth?.(2.8);
  trail.setOrigin?.(0.14, 0.5);
  trail.setRotation?.(rotation);
  trail.setScale?.(Math.max(0.7, (stats.lanceLength ?? 0) / 180), Math.max(0.8, (stats.lanceWidth ?? 0) / 16));
  trail.setAlpha?.(0.52);
  trail.setTintFill?.(0x8fefff);

  strike.setDepth?.(3);
  strike.setOrigin?.(0.12, 0.5);
  strike.setRotation?.(rotation);
  strike.setScale?.(Math.max(0.8, (stats.lanceLength ?? 0) / 180), Math.max(0.8, (stats.lanceWidth ?? 0) / 18));
  strike.setAlpha?.(0.98);

  time.delayedCall(70, () => {
    strike.destroy?.();
    trail.destroy?.();
  });
}
```

- [ ] **Step 4: Re-run the lance regression and verify it passes**

Run: `npm test -- tests/lance.test.js`
Expected: PASS

- [ ] **Step 5: Commit the lance render upgrade**

```bash
git add src/game/systems/LanceManager.js tests/lance.test.js
git commit -m "Upgrade lance to spear-first strike visuals"
```

### Task 4: Full Verification

**Files:**
- Modify: none expected
- Test: `tests/spearBarrage.test.js`
- Test: `tests/lance.test.js`
- Test: `tests/runtimeFlow.test.js`

- [ ] **Step 1: Run the focused spear-related suites**

Run: `npm test -- tests/spearBarrage.test.js tests/lance.test.js tests/runtimeFlow.test.js`
Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS with all tests green

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: Vite build succeeds; the existing large-chunk warning is acceptable if no new errors appear

- [ ] **Step 4: Commit any small verification-driven polish**

```bash
git status --short
git add src/game/logic/spearBarrageVisuals.js src/game/scenes/GameScene.js src/game/systems/SpearBarrageManager.js src/game/systems/LanceManager.js tests/runtimeFlow.test.js tests/spearBarrage.test.js tests/lance.test.js
git commit -m "Polish spear direction visuals"
```

## Self-Review

- Spec coverage:
  - `Spear Barrage` point-first direction is handled in Task 1
  - `Lance` spearhead-led thrust is handled in Tasks 2 and 3
  - new generated textures are covered in Task 2
  - unchanged gameplay timing and damage are preserved by keeping all hit logic in existing managers
- Placeholder scan: no `TBD`, `TODO`, or unresolved “similar to above” instructions remain
- Type consistency:
  - barrage helper uses `getSpearFlightRotation`
  - lance textures use `lance-strike` and `lance-trail`
  - tests reference the same texture keys and rotation/origin behavior defined in the implementation steps
