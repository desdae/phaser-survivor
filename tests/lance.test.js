import { describe, expect, it, vi } from 'vitest';
import { LanceManager } from '../src/game/systems/LanceManager.js';

describe('LanceManager', () => {
  it('damages multiple enemies along a piercing lance line', () => {
    const hits = [];
    const manager = new LanceManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      lanceUnlocked: true,
      lanceDamage: 20,
      lanceCooldownMs: 900,
      lanceLength: 220,
      lanceWidth: 18
    };
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
      setAlpha(value) {
        this.alpha = value;
        return this;
      },
      setDepth() {
        return this;
      },
      setOrigin(xValue, yValue) {
        this.originX = xValue;
        this.originY = yValue;
        return this;
      },
      setPosition(nextX, nextY) {
        this.x = nextX;
        this.y = nextY;
        return this;
      },
      setRotation(value) {
        this.rotation = value;
        return this;
      },
      setScale(xValue, yValue = xValue) {
        this.scaleX = xValue;
        this.scaleY = yValue;
        return this;
      },
      setTintFill(value) {
        this.tint = value;
        return this;
      },
      destroy() {
        this.active = false;
      }
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
      [{ active: true, x: 90, y: 30, id: 'a' }],
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
