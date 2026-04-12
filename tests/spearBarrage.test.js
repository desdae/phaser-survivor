import { describe, expect, it, vi } from 'vitest';
import { SpearBarrageManager } from '../src/game/systems/SpearBarrageManager.js';

describe('SpearBarrageManager', () => {
  it('spawns a warning ring, a falling spear, and an impact burst around the existing damage timing', () => {
    const createdSprites = [];
    const makeSprite = (x, y, key) => ({
      active: true,
      alpha: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      texture: { key },
      tint: null,
      x,
      y,
      setAlpha(value) {
        this.alpha = value;
        return this;
      },
      setDepth() {
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
      setScale(xScale, yScale = xScale) {
        this.scaleX = xScale;
        this.scaleY = yScale;
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

    const hits = [];
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
        add: vi.fn((config) => {
          config.onComplete?.();
          return config;
        })
      }
    });
    const stats = {
      spearBarrageUnlocked: true,
      spearBarrageDamage: 18,
      spearBarrageCount: 1,
      spearBarrageRadius: 30,
      spearBarrageCooldownMs: 1200
    };
    const enemies = [{ active: true, x: 120, y: 100, id: 'target' }];

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1000, [], {
      damageEnemy: () => {}
    });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1110, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 120, y: 100 }, 1220, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    const marker = createdSprites.find((entry) => entry.texture.key === 'spear-barrage-marker');
    const fallingSpear = createdSprites.find((entry) => entry.texture.key === 'spear-barrage-fall');
    const shadow = createdSprites.find((entry) => entry.texture.key === 'spear-barrage-shadow');
    const impact = createdSprites.find((entry) => entry.texture.key === 'spear-barrage-impact');

    expect(marker).toBeTruthy();
    expect(fallingSpear).toBeTruthy();
    expect(shadow).toBeTruthy();
    expect(fallingSpear.x).toBe(120);
    expect(fallingSpear.y).toBe(100);
    expect(marker.active).toBe(false);
    expect(fallingSpear.active).toBe(false);
    expect(shadow.active).toBe(false);
    expect(impact).toBeTruthy();
    expect(hits).toEqual([{ id: 'target', damage: 18 }]);
  });
});
